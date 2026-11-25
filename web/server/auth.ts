import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { appState, getDb, withData } from "../../src/db";
import { requestAccess } from "../../src/features/marketing/mutations";
import { LOCALES } from "../../src/i18n/config";
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

/**
 * Checks the password that was sent and answers with the session it opens.
 * A wrong one is counted and answered slowly; too many and all are refused.
 */
async function admit(sent: unknown, password: string): Promise<string> {
  const given = z.object({ password: z.string().max(500) }).safeParse(sent);
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
  return sessionValue(password);
}

/** Signing in and out: the only requests answered before the data a request may see is decided. */
export const auth = new Hono<Env>()
  .post("/session", async (c) => {
    const password = appPassword();
    if (!password) return c.json({ ok: true as const });
    const value = await admit(await c.req.json().catch(() => null), password);
    setCookie(c, SESSION_COOKIE, value, {
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: c.req.header("x-forwarded-proto") === "https",
      maxAge: 60 * 60 * 24 * SESSION_DAYS,
    });
    return c.json({ ok: true as const });
  })
  /*
   * Signing in from the phone app, which keeps no cookies: the same password
   * and the same limit, and the session comes back in the answer for the app
   * to keep in the phone's keychain and send as `Authorization: Bearer`. The
   * web app never calls this: its session stays in a cookie no script reads.
   */
  .post("/session/native", async (c) => {
    const password = appPassword();
    if (!password) return c.json({ ok: true as const, token: "" });
    return c.json({ ok: true as const, token: await admit(await c.req.json().catch(() => null), password) });
  })
  // Early access to the hosted version: open to anyone, touches no data, sends one message.
  .post("/access", async (c) => {
    const sent = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
    const locale = z.enum(LOCALES).catch("en").parse(sent?.locale);
    return c.json(await requestAccess({ email: sent?.email, company: sent?.company ?? undefined }, locale));
  })
  .delete("/session", (c) => {
    deleteCookie(c, SESSION_COOKIE, { path: "/" });
    return c.json({ ok: true as const });
  });
