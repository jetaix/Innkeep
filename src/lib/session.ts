import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The password that protects an Innkeep reachable from the internet.
 *
 * `APP_PASSWORD` is one password shared by the people of the household. Once
 * typed, the browser keeps a cookie derived from it, so changing the password
 * signs everyone out. Without the variable Innkeep stays open, as it is on a
 * computer at home.
 */
export const SESSION_COOKIE = "innkeep-session";
export const SESSION_DAYS = 90;

export const appPassword = () => process.env.APP_PASSWORD || null;

const same = (a: string, b: string) => {
  const [left, right] = [Buffer.from(a), Buffer.from(b)];
  return left.length === right.length && timingSafeEqual(left, right);
};

/** What the cookie holds: not the password, and of no use once it changes. */
export const sessionValue = (password: string) =>
  createHmac("sha256", password).update("innkeep-session-v1").digest("hex");

export const passwordMatches = (given: string, password: string) =>
  same(sessionValue(given), sessionValue(password));

export const sessionValid = (cookie: string | undefined, password: string) =>
  cookie != null && same(cookie, sessionValue(password));

/**
 * Slows down guessing: after too many wrong passwords in a few minutes, every
 * attempt is refused until the window has passed. People already signed in
 * are not affected. Pure: the times of recent failures are kept by the caller.
 */
export const ATTEMPT_WINDOW_MS = 10 * 60_000;
export const MAX_FAILURES = 20;

export const recentFailures = (failures: number[], now: number) =>
  failures.filter((at) => at > now - ATTEMPT_WINDOW_MS);

export const tooManyAttempts = (failures: number[], now: number) =>
  recentFailures(failures, now).length >= MAX_FAILURES;
