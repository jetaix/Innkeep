import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sessions. Everyone signs in with an email and a password of their own; the
 * browser then keeps a cookie that names the user and carries a signature
 * only this Innkeep can make.
 */
export const SESSION_COOKIE = "innkeep-session";
export const SESSION_DAYS = 90;

const same = (a: string, b: string) => {
  const [left, right] = [Buffer.from(a), Buffer.from(b)];
  return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * `APP_PASSWORD` used to open the whole Innkeep. It no longer signs anyone
 * in: on an Innkeep that had data before accounts existed, it is the key the
 * owner types once, when creating their account, to take that data with them.
 */
export const hostPassword = () => process.env.APP_PASSWORD || null;

export const hostPasswordMatches = (given: string) => {
  const password = hostPassword();
  const digest = (value: string) => createHmac("sha256", "innkeep-claim-v1").update(value).digest("hex");
  return password != null && same(digest(given), digest(password));
};

/**
 * A user's cookie: their id, and a signature made with the server's secret.
 * The signature covers the password hash, so it stops working when they
 * change their password and when they are removed.
 */
export const memberSessionValue = (secret: string, member: { id: number; passwordHash: string }) =>
  `m${member.id}.${createHmac("sha256", secret).update(`innkeep-member-v1:${member.id}:${member.passwordHash}`).digest("hex")}`;

/** The user a cookie claims to be; whether it tells the truth is checked against their row. */
export function claimedMember(cookie: string | undefined): number | null {
  const id = cookie?.match(/^m(\d{1,10})\.[0-9a-f]{64}$/)?.[1];
  return id ? Number(id) : null;
}

export const memberSessionValid = (
  cookie: string | undefined,
  secret: string,
  member: { id: number; passwordHash: string },
) => cookie != null && same(cookie, memberSessionValue(secret, member));

/**
 * The tokens machines send for one space (the browser extension, an MCP
 * client): the space's number and a signature, so nothing has to be stored
 * and a token cannot be turned into another space's.
 */
export type MachineKind = "extension" | "mcp";
const LETTER = { extension: "x", mcp: "c" } as const;

export const machineToken = (secret: string, kind: MachineKind, spaceId: number) =>
  `${LETTER[kind]}${spaceId}.${createHmac("sha256", secret).update(`innkeep-${kind}-v1:${spaceId}`).digest("hex")}`;

/** The space a machine's token is for, when the token is genuine. */
export function machineSpace(secret: string, kind: MachineKind, token: string): number | null {
  const id = token.match(/^[xc](\d{1,10})\.[0-9a-f]{64}$/)?.[1];
  return id && same(token, machineToken(secret, kind, Number(id))) ? Number(id) : null;
}

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

/**
 * A public demo. With `PUBLIC_DEMO=1`, a visitor who is not signed in no
 * longer meets the sign-in page: they see the public pages and a read-only
 * dashboard filled with sample bookings, kept apart from every space's data.
 */
export const publicDemo = () => process.env.PUBLIC_DEMO === "1";

/** `SIGN_UP=closed` stops new accounts once the host has theirs; invitations still work. */
export const signUpClosed = () => process.env.SIGN_UP === "closed";

/**
 * Which data a request sees, decided by the server for every request (`web/server/scope.ts`) and read
 * by `src/db`. `real` is the signed-in person's space; `demo` is the sample data;
 * `demo-readonly` is the sample data for a request that tries to change something.
 */
export type DataScope = "real" | "demo" | "demo-readonly";
