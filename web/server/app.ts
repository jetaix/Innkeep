import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { withData } from "../../src/db";
import { auth } from "./auth";
import type { Env } from "./env";
import { read } from "./read";
import { decide, SESSION_COOKIE } from "./scope";

/**
 * The API the client-rendered app talks to. Machine routes (iCal, ingest,
 * MCP, cron) join it in a later phase.
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
  .route("/", read);

/** The API's routes and their types, for the client. */
export type AppType = typeof app;

app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  // drizzle wraps what the database layer throws.
  const cause = (error as { cause?: { name?: string } }).cause;
  if (error.name === "DemoReadOnlyError" || cause?.name === "DemoReadOnlyError") {
    return c.json({ error: "This is a demo: changes are not saved." }, 403);
  }
  console.error(error);
  return c.json({ error: "Something went wrong." }, 500);
});
