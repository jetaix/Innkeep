import { timingSafeEqual } from "node:crypto";

/** Compares a request's bearer token with a secret in constant time. */
export function hasBearerToken(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "");
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
