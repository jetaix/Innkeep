import { describe, expect, it } from "vitest";
import { addMonths, bookedNights, monthWeeks, nightsOf } from "./compute";

const stay = (id: number, checkIn: string, checkOut: string, extra = {}) => ({
  id,
  propertyId: 1,
  checkIn,
  checkOut,
  kind: "reservation" as const,
  ...extra,
});

describe("addMonths", () => {
  it("moves by whole months, across years, to the first of the month", () => {
    expect(addMonths("2026-11-23", 1)).toBe("2026-12-01");
    expect(addMonths("2026-11-23", 2)).toBe("2027-01-01");
    expect(addMonths("2027-01-15", -1)).toBe("2026-12-01");
    expect(addMonths("2027-03-01", -12)).toBe("2026-03-01");
  });
});

describe("monthWeeks", () => {
  it("lays a month out in weeks that start on Monday", () => {
    // November 2026 starts on a Sunday and has 30 days.
    const weeks = monthWeeks("2026-11-10");
    expect(weeks).toHaveLength(6);
    expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(weeks[1][0]).toBe("2026-11-02");
    expect(weeks[5]).toEqual(["2026-11-30", null, null, null, null, null, null]);
  });

  it("needs no padding for a month that fills its weeks", () => {
    // February 2027 starts on a Monday and has 28 days.
    const weeks = monthWeeks("2027-02-01");
    expect(weeks).toHaveLength(4);
    expect(weeks.flat().includes(null)).toBe(false);
  });
});

describe("nightsOf", () => {
  it("gives a stay its nights, not its check-out day, within the range asked", () => {
    const nights = nightsOf(
      [
        stay(1, "2026-11-28", "2026-12-02"),
        stay(2, "2026-12-02", "2026-12-04"),
        stay(3, "2026-12-05", "2026-12-06", { propertyId: 2 }),
      ],
      1,
      "2026-12-01",
      "2027-01-01",
    );
    expect([...nights.keys()]).toEqual(["2026-12-01", "2026-12-02", "2026-12-03"]);
    expect(nights.get("2026-12-01")?.id).toBe(1);
    expect(nights.get("2026-12-02")?.id).toBe(2);
  });

  it("counts a month's sold nights without its blocked dates", () => {
    const nights = nightsOf(
      [stay(1, "2026-11-28", "2026-12-02"), stay(2, "2026-12-10", "2026-12-13", { kind: "block" as const })],
      1,
      "2026-11-01",
      "2027-01-01",
    );
    expect(bookedNights(nights, "2026-11-01")).toBe(3);
    expect(bookedNights(nights, "2026-12-01")).toBe(1);
  });
});
