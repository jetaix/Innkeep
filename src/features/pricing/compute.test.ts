import { describe, expect, it } from "vitest";
import {
  bookingFeeRate,
  buildNights,
  DEFAULT_FEES,
  historyByMonth,
  pickPlan,
  sampleStays,
  summarise,
  type PriceRow,
  type StayRow,
} from "./compute";

const price = (source: "airbnb" | "booking", date: string, amount: number, plan = ""): PriceRow => ({
  source,
  date,
  amount,
  plan: source === "booking" ? plan || "Standard Rate" : "",
  note: null,
});

const stay = (checkIn: string, checkOut: string, extra: Partial<StayRow> = {}): StayRow => ({
  source: "airbnb",
  kind: "reservation",
  status: "confirmed",
  checkIn,
  checkOut,
  amount: null,
  grossAmount: null,
  channelFees: null,
  ...extra,
});

const nights = (prices: PriceRow[], stays: StayRow[] = [], history = new Map<string, number>()) =>
  buildNights({
    from: "2027-03-01",
    days: 30,
    prices,
    plan: "Standard Rate",
    stays,
    fees: DEFAULT_FEES,
    history,
  });

describe("bookingFeeRate", () => {
  it("is the commission actually charged on the host's Booking.com stays", () => {
    const rate = bookingFeeRate([
      stay("2026-06-03", "2026-06-06", { source: "booking", grossAmount: 20_000, channelFees: 3_600 }),
      stay("2026-07-03", "2026-07-06", { source: "booking", grossAmount: 10_000, channelFees: 1_800 }),
      stay("2026-08-03", "2026-08-06", { grossAmount: 10_000, channelFees: 9_000 }),
    ]);
    expect(rate).toBeCloseTo(0.18);
  });

  it("is unknown without such stays", () => {
    expect(bookingFeeRate([stay("2026-06-03", "2026-06-06", { source: "booking" })])).toBeNull();
  });
});

describe("pickPlan", () => {
  const prices = [
    price("booking", "2027-03-10", 7_050),
    price("booking", "2027-03-10", 6_345, "Non-refundable Rate"),
    price("airbnb", "2027-03-10", 9_000),
  ];

  it("compares the dearest plan unless another is asked for", () => {
    expect(pickPlan(prices)).toEqual({
      plans: ["Non-refundable Rate", "Standard Rate"],
      plan: "Standard Rate",
    });
    expect(pickPlan(prices, "Non-refundable Rate").plan).toBe("Non-refundable Rate");
    expect(pickPlan(prices, "Gone").plan).toBe("Standard Rate");
    expect(pickPlan([]).plan).toBeNull();
  });
});

describe("historyByMonth", () => {
  it("averages what finished stays paid per night, by calendar month", () => {
    const history = historyByMonth(
      [
        stay("2026-03-10", "2026-03-14", { amount: 40_000 }),
        stay("2026-03-31", "2026-04-02", { amount: 16_000 }),
        stay("2027-03-10", "2027-03-14", { amount: 99_000 }),
        stay("2026-03-01", "2026-03-03", { amount: 99_000, status: "cancelled" }),
      ],
      "2026-12-01",
    );
    // March: four nights at 100 and one at 80. April: one night at 80.
    expect(history.get("03")).toBe(9_600);
    expect(history.get("04")).toBe(8_000);
    expect(history.has("05")).toBe(false);
  });
});

describe("buildNights", () => {
  it("works out what each platform leaves the host and suggests bringing Booking.com in line", () => {
    // Airbnb 100 keeps 97. Booking.com 80 keeps 68. To keep 97 there: 97 / 0.85 = 114.
    const [night] = nights([price("airbnb", "2027-03-01", 10_000), price("booking", "2027-03-01", 8_000)]);
    expect(night).toMatchObject({ airbnbNet: 9_700, bookingNet: 6_800, gap: -2_900 });
    expect(night.suggestion).toEqual({ kind: "align", target: 11_400, direction: "raise" });
  });

  it("suggests lowering Booking.com when it is the dearer one, and nothing when they agree", () => {
    const result = nights([
      price("airbnb", "2027-03-01", 10_000),
      price("booking", "2027-03-01", 14_000),
      price("airbnb", "2027-03-20", 10_000),
      price("booking", "2027-03-20", 11_400),
    ]);
    expect(result[0].suggestion).toMatchObject({ kind: "align", direction: "lower", target: 11_400 });
    expect(result[19].suggestion).toBeNull();
  });

  it("makes no suggestion for a night that is booked or blocked", () => {
    const result = nights(
      [price("airbnb", "2027-03-02", 10_000), price("booking", "2027-03-02", 5_000)],
      [stay("2027-03-01", "2027-03-04"), stay("2027-03-10", "2027-03-12", { kind: "block" })],
    );
    expect(result[1]).toMatchObject({ takenBy: "airbnb", suggestion: null });
    expect(result[9].takenBy).toBe("blocked");
    expect(result[4].takenBy).toBeNull();
  });

  it("flags a free night in the coming week as last minute", () => {
    const result = nights([price("airbnb", "2027-03-03", 10_000), price("airbnb", "2027-03-15", 10_000)]);
    expect(result[2].suggestion).toEqual({ kind: "lastMinute", percent: 0.1 });
    expect(result[14].suggestion).toBeNull();
  });

  it("flags one or two free nights caught between bookings", () => {
    const result = nights(
      [price("airbnb", "2027-03-15", 10_000)],
      [stay("2027-03-10", "2027-03-14"), stay("2027-03-16", "2027-03-20")],
    );
    expect(result[13].suggestion).toEqual({ kind: "orphan", nights: 2 });
    expect(result[14].suggestion).toEqual({ kind: "orphan", nights: 2 });
    expect(result[20].suggestion).toBeNull();
  });

  it("flags a price far under what the month earned before", () => {
    const result = nights([price("airbnb", "2027-03-25", 6_000)], [], new Map([["03", 10_000]]));
    expect(result[24].suggestion).toEqual({ kind: "belowHistory", earned: 10_000 });
  });
});

describe("summarise", () => {
  it("counts free nights only", () => {
    const summary = summarise(
      nights(
        [
          price("airbnb", "2027-03-10", 10_000),
          price("booking", "2027-03-10", 8_000),
          price("airbnb", "2027-03-11", 12_000),
          price("airbnb", "2027-03-20", 30_000),
          price("booking", "2027-03-20", 1_000),
        ],
        [stay("2027-03-19", "2027-03-22")],
      ),
    );
    expect(summary.airbnb).toEqual({ nights: 2, average: 11_000 });
    expect(summary.booking).toEqual({ nights: 1, average: 8_000 });
    expect(summary).toMatchObject({ bookingLower: 1, bookingHigher: 0, shortfall: 2_900 });
    expect(summary.suggestions.align).toBe(1);
  });
});

describe("sampleStays", () => {
  it("picks the first three free, priced nights of each month", () => {
    const prices = Array.from({ length: 30 }, (_, day) =>
      price("airbnb", `2027-03-${String(day + 1).padStart(2, "0")}`, 10_000 + day * 100),
    );
    const samples = sampleStays(nights(prices, [stay("2027-03-01", "2027-03-03")]));
    expect(samples).toEqual([{ checkIn: "2027-03-03", checkOut: "2027-03-06", nightly: 30_900 }]);
  });

  it("skips a month with no such run", () => {
    expect(sampleStays(nights([price("airbnb", "2027-03-05", 10_000)]))).toEqual([]);
  });
});
