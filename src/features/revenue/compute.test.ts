import { describe, expect, it } from "vitest";
import { parseMoney } from "@/lib/money";
import { addMonths, summariseMonth, summariseYear } from "./compute";

const rates = [{ id: 1, basePrice: 100 }];
const stay = (checkIn: string, checkOut: string, extra = {}) => ({
  propertyId: 1,
  source: "airbnb" as const,
  checkIn,
  checkOut,
  amount: null,
  ...extra,
});
const charge = (extra: object) => ({
  id: 1,
  propertyId: null,
  label: "Charge",
  category: "other" as const,
  frequency: "monthly" as const,
  amount: 0,
  appliesTo: "all" as const,
  startsOn: "2027-01-01",
  endsOn: null,
  ...extra,
});

describe("summariseMonth", () => {
  it("estimates unknown payouts from the nightly rate and uses entered ones as they are", () => {
    const summary = summariseMonth(
      "2027-03",
      [stay("2027-03-01", "2027-03-04"), stay("2027-03-10", "2027-03-12", { amount: 45_000 })],
      [],
      rates,
    );
    expect(summary.gross).toBe(30_000 + 45_000);
    expect(summary.estimated).toBe(30_000);
    expect(summary.bookedNights).toBe(5);
    expect(summary.occupancy).toBeCloseTo(5 / 31);
  });

  it("splits a stay that crosses a month boundary by night", () => {
    const crossing = stay("2027-03-30", "2027-04-03", { amount: 40_000 });
    expect(summariseMonth("2027-03", [crossing], [], rates).gross).toBe(20_000);
    expect(summariseMonth("2027-04", [crossing], [], rates).gross).toBe(20_000);
    expect(summariseMonth("2027-04", [crossing], [], rates).arrivals).toBe(0);
  });

  it("applies each kind of charge", () => {
    const stays = [
      stay("2027-03-01", "2027-03-03"), // airbnb, 200.00
      stay("2027-03-10", "2027-03-14", { source: "booking" }), // booking, 400.00
    ];
    const lines = summariseMonth(
      "2027-03",
      stays,
      [
        charge({ id: 1, label: "Internet", frequency: "monthly", amount: 3_500 }),
        charge({ id: 2, label: "Insurance", frequency: "yearly", amount: 24_000 }),
        charge({ id: 3, label: "Cleaning", frequency: "per_stay", amount: 5_000 }),
        charge({ id: 4, label: "Linen", frequency: "per_night", amount: 300 }),
        charge({
          id: 5,
          label: "Booking commission",
          frequency: "percent",
          amount: 1_500,
          appliesTo: "booking",
        }),
        charge({ id: 6, label: "Plumber", frequency: "once", amount: 12_000, startsOn: "2027-03-20" }),
        charge({
          id: 7,
          label: "Last year's repair",
          frequency: "once",
          amount: 99_000,
          startsOn: "2026-03-20",
        }),
        charge({ id: 8, label: "Other property", frequency: "per_stay", amount: 5_000, propertyId: 2 }),
      ],
      rates,
    ).chargeLines;

    expect(Object.fromEntries(lines.map((line) => [line.label, line.amount]))).toEqual({
      Internet: 3_500,
      Insurance: 2_000,
      Cleaning: 10_000,
      Linen: 1_800,
      "Booking commission": 6_000,
      Plumber: 12_000,
    });
  });

  it("stops recurring charges after their end date", () => {
    const ended = charge({ frequency: "monthly", amount: 1_000, endsOn: "2027-02-15" });
    expect(summariseMonth("2027-02", [], [ended], rates).charges).toBe(1_000);
    expect(summariseMonth("2027-03", [], [ended], rates).charges).toBe(0);
  });
});

describe("helpers", () => {
  it("adds months across year boundaries", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
    expect(addMonths("2027-01", -1)).toBe("2026-12");
  });

  it("parses money typed in common formats", () => {
    expect(parseMoney("1250")).toBe(125_000);
    expect(parseMoney("1 250,50 €")).toBe(125_050);
    expect(parseMoney("1,250.5")).toBe(125_050);
    expect(parseMoney("1.250")).toBe(125_000);
    expect(parseMoney("abc")).toBeNull();
  });
});

describe("summariseYear", () => {
  it("adds up the twelve months, splitting a stay across New Year by night", () => {
    const stays = [
      stay("2027-03-01", "2027-03-04", { amount: 30_000 }),
      stay("2027-12-30", "2028-01-03", { amount: 40_000 }),
    ];
    const year = summariseYear("2027", stays, [charge({ amount: 1_000 })], rates);
    expect(year).toMatchObject({
      month: "2027",
      gross: 50_000,
      charges: 12_000,
      net: 38_000,
      bookedNights: 5,
      availableNights: 365,
      arrivals: 2,
    });
    expect(year.chargeLines).toEqual([expect.objectContaining({ id: 1, amount: 12_000 })]);
    expect(summariseYear("2028", stays, [], rates)).toMatchObject({ gross: 20_000, bookedNights: 2 });
  });
});
