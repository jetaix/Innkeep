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
 * are not affected.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_FAILURES = 20;
const failures: number[] = [];

export function tooManyAttempts(now = Date.now()): boolean {
  while (failures.length > 0 && failures[0] < now - WINDOW_MS) failures.shift();
  return failures.length >= MAX_FAILURES;
}

export function recordFailure(now = Date.now()) {
  failures.push(now);
}
