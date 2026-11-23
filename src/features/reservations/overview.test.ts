import { describe, expect, it } from "vitest";
import { reservationsOverview } from "./overview";

const stay = (checkIn: string, checkOut: string, extra = {}) => ({
  propertyId: 1,
  source: "airbnb" as const,
  checkIn,
  checkOut,
  amount: 30_000,
  channelFees: null,
  kind: "reservation" as const,
  status: "confirmed" as const,
  ...extra,
});

const charge = (frequency: "monthly" | "per_stay", amount: number) => ({
  id: frequency === "monthly" ? 1 : 2,
  propertyId: null,
  label: frequency,
  category: "other" as const,
  frequency,
  amount,
  appliesTo: "all" as const,
  startsOn: "2020-01-01",
  endsOn: null,
});

const properties = [{ id: 1, basePrice: 100 }];
const today = "2027-03-15";

describe("reservationsOverview", () => {
  it("splits stays into the last twelve months and what is still to come", () => {
    const { past, upcoming, since } = reservationsOverview({
      today,
      stays: [
        stay("2026-02-01", "2026-02-05"), // too old
        stay("2026-06-01", "2026-06-04"),
        stay("2027-03-01", "2027-03-03", { channelFees: 4_500 }),
        stay("2027-03-14", "2027-03-17"), // still here
        stay("2027-05-01", "2027-05-06", { amount: null }),
        stay("2027-04-01", "2027-04-03", { status: "cancelled" as const }),
        stay("2027-04-10", "2027-04-12", { kind: "block" as const }),
      ],
      charges: [],
      properties,
    });
    expect(since).toBe("2026-04-01");
    expect(past).toMatchObject({ stays: 2, nights: 5, revenue: 60_000, platformFees: 4_500, net: 60_000 });
    // Five nights at the nightly rate stand in for the payout that is not known.
    expect(upcoming).toMatchObject({ stays: 2, nights: 8, revenue: 80_000, estimated: 50_000 });
  });

  it("counts each month's fixed costs once, and stay costs with their stay", () => {
    const { past, upcoming } = reservationsOverview({
      today,
      stays: [stay("2027-03-01", "2027-03-03"), stay("2027-04-10", "2027-04-12")],
      charges: [charge("monthly", 10_000), charge("per_stay", 5_000)],
      properties,
    });
    // Twelve months of rent up to and including March, and one cleaning.
    expect(past.costs).toBe(12 * 10_000 + 5_000);
    expect(past.profitable).toBe(false);
    // April's rent and one cleaning; March's rent is not counted twice.
    expect(upcoming.costs).toBe(10_000 + 5_000);
    expect(upcoming).toMatchObject({ net: 15_000, profitable: true });
  });

  it("does not judge a period with no stay, even with costs running", () => {
    const { past, upcoming } = reservationsOverview({
      today,
      stays: [],
      charges: [charge("monthly", 10_000)],
      properties,
    });
    expect(past.costs).toBe(120_000);
    expect(past.profitable).toBeNull();
    expect(upcoming.profitable).toBeNull();
  });
});
