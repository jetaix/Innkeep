import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * A member's password is never kept: only a salted scrypt hash of it, as
 * "salt:hash" in hex. scrypt is slow on purpose, so a stolen database does
 * not give the passwords away.
 */
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export function passwordFits(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  return timingSafeEqual(scryptSync(password, Buffer.from(salt, "hex"), KEY_LENGTH), expected);
}
