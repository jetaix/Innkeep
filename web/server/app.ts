import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { withData, withSpace } from "../../src/db";
import { auth } from "./auth";
import { adminOnly, type Env } from "./env";
import { machine } from "./machine";
import { read } from "./read";
import { decide, SESSION_COOKIE, visitorMay } from "./scope";
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
    const verdict = await decide(c.req.method, getCookie(c, SESSION_COOKIE));
    if ("refuse" in verdict) throw new HTTPException(401, { message: "Sign in first." });
    // A visitor's role is enforced here, once, for every address: no handler has to remember it.
    if (verdict.role === "visitor" && !visitorMay(c.req.method, c.req.path.replace(/^\/api\/app/, ""))) {
      throw adminOnly();
    }
    c.set("signedIn", verdict.signedIn);
    c.set("role", verdict.role);
    c.set("member", verdict.member);
    c.set("space", verdict.space);
    const { space } = verdict;
    await withData(verdict.scope, () => (space ? withSpace(space, next) : next()));
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
  // Nowhere to put another space: the host's to fix, and said as it is.
  if (error.name === "NoRoomError") return c.json({ error: error.message }, 503);
  if (error.name === "DemoReadOnlyError" || cause?.name === "DemoReadOnlyError") {
    return c.json({ error: "This is a demo: changes are not saved." }, 403);
  }
  console.error(error);
  return c.json({ error: "Something went wrong." }, 500);
});

/**
 * Everything the server answers: the app's API and the routes machines call.
 * This is what gets deployed, with one rule in front of them.
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
    return next();
  })
  .route("/", app)
  .route("/", machine);
