import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { appState, getDb, withData } from "../../src/db";
import {
  appPassword,
  passwordMatches,
  recentFailures,
  SESSION_DAYS,
  sessionValue,
  tooManyAttempts,
} from "../../src/lib/session";
import type { Env } from "./env";
import { SESSION_COOKIE } from "./scope";

/** Wrong passwords are counted in the host's own data, so the limit holds across servers. */
const FAILURES = "sign-in-failures";

/**
 * Someone signing in is not signed in yet. The count of wrong passwords is
 * the one thing they may read and write in the host's own data.
 */
async function failures(): Promise<number[]> {
  const row = await withData("real", () =>
    getDb().select().from(appState).where(eq(appState.key, FAILURES)).get(),
  );
  try {
    const parsed: unknown = JSON.parse(row?.value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((at) => typeof at === "number") : [];
  } catch {
    return [];
  }
}

/** Signing in and out: the only requests answered before the data a request may see is decided. */
export const auth = new Hono<Env>()
  .post("/session", async (c) => {
    const password = appPassword();
    if (!password) return c.json({ ok: true as const });
    const given = z.object({ password: z.string().max(500) }).safeParse(await c.req.json().catch(() => null));
    const now = Date.now();
    const earlier = await failures();
    if (tooManyAttempts(earlier, now)) {
      throw new HTTPException(429, { message: "Too many attempts. Try again in ten minutes." });
    }
    if (!given.success || !passwordMatches(given.data.password, password)) {
      const value = JSON.stringify([...recentFailures(earlier, now), now]);
      await withData("real", () =>
        getDb()
          .insert(appState)
          .values({ key: FAILURES, value })
          .onConflictDoUpdate({ target: appState.key, set: { value } })
          .run(),
      );
      await new Promise((resolve) => setTimeout(resolve, 800));
      throw new HTTPException(401, { message: "That is not the password. Check it and try again." });
    }
    setCookie(c, SESSION_COOKIE, sessionValue(password), {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: c.req.header("x-forwarded-proto") === "https",
      maxAge: 60 * 60 * 24 * SESSION_DAYS,
    });
    return c.json({ ok: true as const });
  })
  .delete("/session", (c) => {
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ ok: true as const });
  });
