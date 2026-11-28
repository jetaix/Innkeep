import { describe, expect, it } from "vitest";
import {
  claimedMember,
  machineSpace,
  machineToken,
  memberSessionValid,
  memberSessionValue,
  tooManyAttempts,
} from "./session";

describe("session", () => {
  it("accepts a user's cookie only with the same secret and password hash", () => {
    const user = { id: 7, passwordHash: "salt:hash" };
    const cookie = memberSessionValue("secret", user);
    expect(cookie).not.toContain("salt:hash");
    expect(claimedMember(cookie)).toBe(7);
    expect(memberSessionValid(cookie, "secret", user)).toBe(true);
    expect(memberSessionValid(cookie, "another secret", user)).toBe(false);
    expect(memberSessionValid(cookie, "secret", { id: 7, passwordHash: "salt:changed" })).toBe(false);
    expect(memberSessionValid(undefined, "secret", user)).toBe(false);
    expect(claimedMember("m7.nothing")).toBe(null);
  });

  it("ties a machine's token to one space and one kind", () => {
    const token = machineToken("secret", "extension", 3);
    expect(machineSpace("secret", "extension", token)).toBe(3);
    expect(machineSpace("secret", "mcp", token)).toBe(null);
    expect(machineSpace("another secret", "extension", token)).toBe(null);
    expect(machineSpace("secret", "extension", token.replace("x3.", "x4."))).toBe(null);
  });

  it("refuses attempts after many failures, until the window has passed", () => {
    const start = 1_000_000;
    const failures = Array.from({ length: 20 }, (_, i) => start + i);
    expect(tooManyAttempts(failures.slice(1), start + 100)).toBe(false);
    expect(tooManyAttempts(failures, start + 100)).toBe(true);
    expect(tooManyAttempts(failures, start + 11 * 60_000)).toBe(false);
  });
});
