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

/**
 * Who may create an account, from `SIGN_UP`:
 * - `beta` (the default): the addresses the host approved, after a request for access;
 * - `open`: anyone;
 * - `closed`: nobody.
 * The first account of an instance and invitations into a space are never held back.
 */
export type SignUpMode = "beta" | "open" | "closed";
export function signUpMode(): SignUpMode {
  const set = process.env.SIGN_UP?.trim().toLowerCase();
  return set === "open" || set === "closed" ? set : "beta";
}

/**
 * `OWNER_EMAIL` names who the main database belongs to. When it is set, only
 * an account created with that address gets the data already there; without
 * it, the first account does. Innkeep does not verify addresses.
 */
export const ownerEmail = () => process.env.OWNER_EMAIL?.trim().toLowerCase() || null;

/**
 * Which data a request sees, decided by the server for every request (`web/server/scope.ts`) and read
 * by `src/db`. `real` is the signed-in person's space; `demo` is the sample data;
 * `demo-readonly` is the sample data for a request that tries to change something.
 */
export type DataScope = "real" | "demo" | "demo-readonly";
