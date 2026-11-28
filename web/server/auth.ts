import { eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import { appState, getDb, withData } from "../../src/db";
import { requestAccess } from "../../src/features/marketing/mutations";
import { acceptInvitation, findInvitation } from "../../src/features/members/mutations";
import { passwordFits } from "../../src/features/members/password";
import { findMemberByEmail } from "../../src/features/members/queries";
import { LOCALES } from "../../src/i18n/config";
import {
  appPassword,
  memberSessionValue,
  passwordMatches,
  recentFailures,
  SESSION_DAYS,
  sessionValue,
  tooManyAttempts,
} from "../../src/lib/session";
import type { Env } from "./env";
import { SESSION_COOKIE } from "./scope";

/** Opens a session in the browser that asked. */
function open(c: Context, session: string) {
  setCookie(c, SESSION_COOKIE, session, {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: c.req.header("x-forwarded-proto") === "https",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

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

async function failed(earlier: number[], now: number): Promise<never> {
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

/** What was sent, as an object: the change itself checks every field. */
const json = validator(
  "json",
  (value): Record<string, unknown> =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : {},
);

const signingIn = z.object({
  /** Empty for the owner, who signs in with the password of the instance alone. */
  email: z.string().max(200).default(""),
  password: z.string().max(500),
});

/** Signing in, joining and signing out: the only requests answered before the data a request may see is decided. */
export const auth = new Hono<Env>()
  .post("/session", async (c) => {
    const password = appPassword();
    if (!password) return c.json({ ok: true as const });
    const given = signingIn.safeParse(await c.req.json().catch(() => null));
    const now = Date.now();
    const earlier = await failures();
    if (tooManyAttempts(earlier, now)) {
      throw new HTTPException(429, { message: "Too many attempts. Try again in ten minutes." });
    }
    if (!given.success) return failed(earlier, now);
    let session: string;
    if (given.data.email.trim() === "") {
      if (!passwordMatches(given.data.password, password)) return failed(earlier, now);
      session = sessionValue(password);
    } else {
      // A member, with the password they chose when they joined.
      const member = await withData("real", () => findMemberByEmail(given.data.email));
      if (!member || !passwordFits(given.data.password, member.passwordHash)) return failed(earlier, now);
      session = memberSessionValue(password, member);
    }
    open(c, session);
    return c.json({ ok: true as const });
  })
  // What an invitation offers, for the page that opens from its link.
  .get("/invitations/:token", async (c) => {
    const invitation = await withData("real", () => findInvitation(c.req.param("token")));
    if (!invitation) throw new HTTPException(404, { message: "This invitation is no longer valid." });
    return c.json({ role: invitation.role, email: invitation.email });
  })
  // Joining: the invitation becomes a member, who is signed in at once.
  .post("/invitations/:token", json, async (c) => {
    const password = appPassword();
    // Without a password on the instance nobody signs in, so there is nothing to join.
    if (!password) throw new HTTPException(409, { message: "This Innkeep has no sign-in." });
    const now = Date.now();
    const earlier = await failures();
    if (tooManyAttempts(earlier, now)) {
      throw new HTTPException(429, { message: "Too many attempts. Try again in ten minutes." });
    }
    const member = await withData("real", () => acceptInvitation(c.req.param("token"), c.req.valid("json")));
    open(c, memberSessionValue(password, member));
    return c.json({ ok: true as const, role: member.role });
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
