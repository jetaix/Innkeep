import { eq } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import { z } from "zod";
import { appState, central, getDb } from "../../src/db";
import { requestAccess } from "../../src/features/marketing/mutations";
import {
  acceptInvitation,
  bringOwnerHome,
  findInvitation,
  NoAccessError,
  signUp,
} from "../../src/features/members/mutations";
import { passwordFits } from "../../src/features/members/password";
import { findAccount, findMemberByEmail, signUpState } from "../../src/features/members/queries";
import { serverSecret } from "../../src/features/members/secret";
import { LOCALES } from "../../src/i18n/config";
import { memberSessionValue, recentFailures, SESSION_DAYS, tooManyAttempts } from "../../src/lib/session";
import type { Env } from "./env";
import { SESSION_COOKIE } from "./scope";

/** Opens a session in the browser that asked. */
export async function openSession(c: Context, member: { id: number; passwordHash: string }) {
  setCookie(c, SESSION_COOKIE, memberSessionValue(await serverSecret(), member), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: c.req.header("x-forwarded-proto") === "https",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

/** Counted in the main database, so the limits hold across servers. */
const FAILURES = "sign-in-failures";
const SIGN_UPS = "sign-ups";
/** New accounts per hour, all visitors together: enough for people, too few to fill a disk. */
const MAX_SIGN_UPS = 30;
const HOUR = 60 * 60_000;

async function times(key: string): Promise<number[]> {
  const row = await central(() => getDb().select().from(appState).where(eq(appState.key, key)).get());
  try {
    const parsed: unknown = JSON.parse(row?.value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((at) => typeof at === "number") : [];
  } catch {
    return [];
  }
}

async function keep(key: string, value: number[]) {
  const text = JSON.stringify(value);
  await central(() =>
    getDb()
      .insert(appState)
      .values({ key, value: text })
      .onConflictDoUpdate({ target: appState.key, set: { value: text } })
      .run(),
  );
}

/** Refuses when too many wrong passwords were typed lately, and answers with them. */
async function attempts(now: number): Promise<number[]> {
  const earlier = await times(FAILURES);
  if (tooManyAttempts(earlier, now)) {
    throw new HTTPException(429, { message: "Too many attempts. Try again in ten minutes." });
  }
  return earlier;
}

async function failed(earlier: number[], now: number): Promise<never> {
  await keep(FAILURES, [...recentFailures(earlier, now), now]);
  await new Promise((resolve) => setTimeout(resolve, process.env.VITEST ? 0 : 800));
  throw new HTTPException(401, {
    message: "That email and password do not match. Check them and try again.",
  });
}

/** What was sent, as an object: the change itself checks every field. */
const json = validator(
  "json",
  (value): Record<string, unknown> =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : {},
);

const signingIn = z.object({ email: z.string().max(200), password: z.string().max(500) });

/**
 * Creating an account, signing in, following a link and signing out: the only
 * requests answered before the data a request may see is decided.
 */
export const auth = new Hono<Env>()
  // Whether an account can be created here, for the sign-in and sign-up pages.
  .get("/account", async (c) => c.json(await signUpState()))
  // Signing up: a new space, its admin, and a session at once.
  .post("/account", json, async (c) => {
    const now = Date.now();
    const recent = (await times(SIGN_UPS)).filter((at) => at > now - HOUR);
    if (recent.length >= MAX_SIGN_UPS) {
      throw new HTTPException(429, { message: "Too many new accounts just now. Try again in an hour." });
    }
    const made = await signUp(c.req.valid("json")).catch((error: unknown) => {
      if (error instanceof NoAccessError) throw new HTTPException(403, { message: error.message });
      throw error;
    });
    await keep(SIGN_UPS, [...recent, now]);
    await openSession(c, made.user);
    return c.json({ ok: true as const });
  })
  .post("/session", async (c) => {
    const given = signingIn.safeParse(await c.req.json().catch(() => null));
    const now = Date.now();
    const earlier = await attempts(now);
    if (!given.success) return failed(earlier, now);
    const found = await findMemberByEmail(given.data.email);
    if (!found || !passwordFits(given.data.password, found.passwordHash)) return failed(earlier, now);
    const member = await bringOwnerHome(found);
    await openSession(c, member);
    return c.json({ ok: true as const, role: member.role });
  })
  // What a link offers, for the page that opens from it: a place in a space, or a new password.
  .get("/invitations/:token", async (c) => {
    const invitation = await findInvitation(c.req.param("token"));
    if (!invitation) throw new HTTPException(404, { message: "This link is no longer valid." });
    const account = invitation.userId == null ? null : await findAccount(invitation.userId);
    return c.json({
      role: invitation.role,
      email: invitation.email,
      // A reset link names the member it is for, so they know which account they are opening.
      reset: account ? { name: account.user.name } : null,
    });
  })
  // Following it: the invitation becomes a member, or the member has a new password; signed in at once.
  .post("/invitations/:token", json, async (c) => {
    await attempts(Date.now());
    const member = await acceptInvitation(c.req.param("token"), c.req.valid("json"));
    await openSession(c, member);
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
