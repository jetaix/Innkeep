import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { withData } from "../../src/db";
import { appPassword } from "../../src/lib/session";
import { auth } from "./auth";
import type { Env } from "./env";
import { machine } from "./machine";
import { read } from "./read";
import { decide, SESSION_COOKIE } from "./scope";
import { write } from "./write";

/**
 * The API the client-rendered app talks to. The routes machines call (iCal,
 * ingest, MCP, cron) are in `machine.ts` and join it in `server` below.
 *
 * Order matters. Signing in comes first, because it must work without a
 * session. Everything after the middleware reads or writes data, and each of
 * those requests is wrapped in the data it may see, so no handler can reach
 * the host's database by mistake.
 */
export const app = new Hono<Env>()
  .basePath("/api/app")
  .route("/", auth)
  .use("*", async (c, next) => {
    const verdict = decide(c.req.method, getCookie(c, SESSION_COOKIE));
    if ("refuse" in verdict) throw new HTTPException(401, { message: "Sign in first." });
    c.set("signedIn", verdict.signedIn);
    await withData(verdict.scope, next);
  })
  .route("/", read)
  .route("/", write);

/** The API's routes and their types, for the client. */
export type AppType = typeof app;

app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  // What was sent does not fit: the change's own check, or a route's.
  if (error.name === "InvalidInput" || error.name === "ZodError") {
    return c.json({ error: error.name === "InvalidInput" ? error.message : "Check what was sent." }, 400);
  }
  // drizzle wraps what the database layer throws.
  const cause = (error as { cause?: { name?: string } }).cause;
  if (error.name === "DemoReadOnlyError" || cause?.name === "DemoReadOnlyError") {
    return c.json({ error: "This is a demo: changes are not saved." }, 403);
  }
  console.error(error);
  return c.json({ error: "Something went wrong." }, 500);
});

const UNCONFIGURED = "Innkeep is not configured: set APP_PASSWORD, then redeploy.";

/**
 * Everything the server answers: the app's API and the routes machines call.
 * This is what gets deployed, with two rules in front of them.
 *
 * `app` must have its error handler before it is mounted here, so this stays
 * below `app.onError`.
 */
export const server = new Hono()
  .use("*", async (c, next) => {
    const { pathname } = new URL(c.req.url);
    const api = pathname.startsWith("/api/");
    const page = pathname === "/extension/start";
    // Landing-only: a public host keeps no data, so its API answers as if it did not exist.
    if (process.env.LANDING_ONLY === "1") {
      // Machines get a plain "not found"; a person following an old link lands on the home page.
      if (api) return new Response(null, { status: 404 });
      if (page) return Response.redirect(new URL("/", c.req.url), 307);
      return next();
    }
    // A public host with no password would hand the host's data to anyone who finds the address.
    // Machine routes are left alone: each has a token of its own.
    if (process.env.VERCEL && !appPassword()) {
      if (pathname.startsWith("/api/app/")) return c.json({ error: UNCONFIGURED }, 503);
      if (page) return new Response(UNCONFIGURED, { status: 503 });
    }
    return next();
  })
  .route("/", app)
  .route("/", machine);
