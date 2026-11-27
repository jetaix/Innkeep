import { describe, expect, it } from "vitest";
import { loanCosts } from "./loans";
import { propertyProfit } from "./profit";

const flat = { id: 1, basePrice: 100 };
const cabin = { id: 2, basePrice: 80 };
const stay = (propertyId: number, checkIn: string, checkOut: string, amount: number) => ({
  propertyId,
  source: "airbnb" as const,
  checkIn,
  checkOut,
  amount,
});
const charge = (extra: object) => ({
  id: 1,
  propertyId: null,
  label: "Charge",
  category: "other" as const,
  frequency: "monthly" as const,
  amount: 0,
  appliesTo: "all" as const,
  startsOn: "2026-01-01",
  endsOn: null,
  ...extra,
});
const mortgage = loanCosts([
  {
    id: 1,
    propertyId: 1,
    label: "Mortgage",
    principal: 120_000_00,
    rate: 0,
    months: 240,
    insurance: 0,
    startsOn: "2026-01-05",
  },
]);
const today = "2027-03-15";

describe("propertyProfit", () => {
  it("judges the months since the first stay, loan and charges included", () => {
    const profit = propertyProfit({
      today,
      property: flat,
      properties: [flat],
      stays: [stay(1, "2027-01-10", "2027-01-20", 1_500_00), stay(1, "2027-03-01", "2027-03-05", 600_00)],
      costs: [...mortgage, charge({ id: 2, frequency: "per_stay", amount: 50_00, category: "cleaning" })],
    });
    // January, February and March: 500 of loan each, two cleanings.
    expect(profit).toMatchObject({
      months: 3,
      income: 2_100_00,
      charges: 100_00,
      loan: 1_500_00,
      net: 500_00,
      profitable: true,
    });
    expect(profit.monthly).toEqual({ income: 700_00, charges: 33_33, loan: 500_00, net: 166_67 });
  });

  it("says a property that does not cover its loan is at a loss", () => {
    const profit = propertyProfit({
      today,
      property: flat,
      properties: [flat],
      stays: [stay(1, "2027-03-01", "2027-03-03", 300_00)],
      costs: mortgage,
    });
    expect(profit).toMatchObject({ months: 1, net: -200_00, profitable: false });
  });

  it("keeps another property's stays and loan out, and shares what is entered for all", () => {
    const profit = propertyProfit({
      today,
      property: cabin,
      properties: [flat, cabin],
      stays: [stay(1, "2027-03-01", "2027-03-05", 900_00), stay(2, "2027-03-10", "2027-03-12", 200_00)],
      costs: [...mortgage, charge({ id: 3, amount: 40_00 })],
    });
    expect(profit).toMatchObject({ income: 200_00, loan: 0, charges: 20_00, net: 180_00 });
  });

  it("does not judge a property nobody has stayed in yet", () => {
    const profit = propertyProfit({ today, property: flat, properties: [flat], stays: [], costs: mortgage });
    expect(profit).toMatchObject({ months: 0, net: 0, profitable: null });
  });
});
