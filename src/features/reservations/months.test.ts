import { describe, expect, it } from "vitest";
import { reservationCounts, reservationMonths } from "./months";

const stay = (checkIn: string, checkOut: string, extra = {}) => ({
  propertyId: 1,
  source: "airbnb" as const,
  checkIn,
  checkOut,
  amount: 30_000 as number | null,
  kind: "reservation" as const,
  status: "confirmed" as const,
  ...extra,
});

const properties = [{ id: 1, basePrice: 100 }];
const today = "2027-03-15";

describe("reservationMonths", () => {
  it("runs from the current month to the last booked one, then back to the oldest stay", () => {
    const { upcoming, past } = reservationMonths({
      today,
      stays: [stay("2027-01-10", "2027-01-12"), stay("2027-05-01", "2027-05-06")],
      properties,
    });
    expect(upcoming.map((row) => row.month)).toEqual(["2027-03", "2027-04", "2027-05"]);
    expect(past.map((row) => row.month)).toEqual(["2027-02", "2027-01"]);
    expect(upcoming[1]).toMatchObject({ stays: [], nights: 0, occupancy: 0, revenue: 0 });
  });

  it("goes back eleven months at most", () => {
    const { past } = reservationMonths({ today, stays: [stay("2025-06-01", "2025-06-04")], properties });
    expect(past).toHaveLength(11);
    expect(past.at(-1)?.month).toBe("2026-04");
  });

  it("gives the share of the month's nights that are booked", () => {
    const { upcoming } = reservationMonths({
      today,
      stays: [stay("2027-04-01", "2027-04-16"), stay("2027-06-01", "2027-07-01")],
      properties,
    });
    expect(upcoming[1]).toMatchObject({ month: "2027-04", nights: 15, availableNights: 30, occupancy: 0.5 });
    expect(upcoming[3]).toMatchObject({ month: "2027-06", nights: 30, occupancy: 1 });
    // Leaving on the 1st of July takes no night of July.
    expect(upcoming).toHaveLength(4);
  });

  it("counts a stay across two months in both, for its own nights and money", () => {
    const { upcoming } = reservationMonths({
      today,
      stays: [stay("2027-04-28", "2027-05-04", { amount: 60_000 })],
      properties,
    });
    const [, april, may] = upcoming;
    expect(april).toMatchObject({ nights: 3, revenue: 30_000 });
    expect(may).toMatchObject({ nights: 3, revenue: 30_000 });
    expect(april.stays).toHaveLength(1);
    expect(may.stays).toHaveLength(1);
  });

  it("spreads the nights over every property and leaves blocks out", () => {
    const { upcoming } = reservationMonths({
      today,
      stays: [stay("2027-04-01", "2027-04-16"), stay("2027-04-01", "2027-04-30", { kind: "block" })],
      properties: [...properties, { id: 2, basePrice: 80 }],
    });
    expect(upcoming[1]).toMatchObject({ nights: 15, availableNights: 60, occupancy: 0.25 });
  });

  it("marks what comes from the nightly rate", () => {
    const { upcoming } = reservationMonths({
      today,
      stays: [stay("2027-04-01", "2027-04-03", { amount: null })],
      properties,
    });
    expect(upcoming[1]).toMatchObject({ revenue: 20_000, estimated: 20_000 });
  });
});

describe("reservationCounts", () => {
  it("counts each reservation once, in the month it arrives", () => {
    const counts = reservationCounts({
      today,
      stays: [
        // Arrived before the twelve months shown: not counted.
        stay("2026-03-28", "2026-04-03"),
        stay("2027-01-10", "2027-01-12"),
        stay("2027-01-30", "2027-02-02"),
        stay("2027-05-01", "2027-05-06"),
        stay("2027-05-10", "2027-05-12", { kind: "block" }),
      ],
    });
    expect(counts[0]).toEqual({ month: "2026-04", count: 0 });
    expect(counts.at(-1)).toEqual({ month: "2027-05", count: 1 });
    expect(counts.filter((entry) => entry.count > 0)).toEqual([
      { month: "2027-01", count: 2 },
      { month: "2027-05", count: 1 },
    ]);
  });

  it("stops at the current month when nothing is booked ahead", () => {
    expect(reservationCounts({ today, stays: [] })).toHaveLength(12);
  });
});
