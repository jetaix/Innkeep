import { describe, expect, it } from "vitest";
import { freshness, STALE_AFTER } from "./state";

describe("freshness", () => {
  const now = Date.UTC(2027, 0, 10, 12);

  it("is never for data that was not read", () => {
    expect(freshness(null, "prices", now)).toBe("never");
  });

  it("turns stale once the kind's own limit has passed", () => {
    expect(freshness(now - STALE_AFTER.prices + 1, "prices", now)).toBe("fresh");
    expect(freshness(now - STALE_AFTER.prices, "prices", now)).toBe("stale");
    // A day-old reading is stale for reservations but fine for a listing preview.
    const yesterday = now - 24 * 60 * 60_000;
    expect(freshness(yesterday, "reservations", now)).toBe("stale");
    expect(freshness(yesterday, "preview", now)).toBe("fresh");
  });
});
