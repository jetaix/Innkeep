import { describe, expect, it } from "vitest";
import { passwordMatches, recordFailure, sessionValid, sessionValue, tooManyAttempts } from "./session";

describe("session", () => {
  it("accepts the cookie made from the current password only", () => {
    const cookie = sessionValue("correct horse");
    expect(cookie).not.toContain("correct horse");
    expect(sessionValid(cookie, "correct horse")).toBe(true);
    expect(sessionValid(cookie, "another password")).toBe(false);
    expect(sessionValid(undefined, "correct horse")).toBe(false);
    expect(sessionValid("", "correct horse")).toBe(false);
  });

  it("compares passwords exactly", () => {
    expect(passwordMatches("correct horse", "correct horse")).toBe(true);
    expect(passwordMatches("correct horse ", "correct horse")).toBe(false);
    expect(passwordMatches("", "correct horse")).toBe(false);
  });

  it("refuses attempts after many failures, until the window has passed", () => {
    const start = 1_000_000;
    for (let i = 0; i < 20; i++) recordFailure(start + i);
    expect(tooManyAttempts(start + 100)).toBe(true);
    expect(tooManyAttempts(start + 11 * 60_000)).toBe(false);
  });
});
