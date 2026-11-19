import type { NightlyPrice, OtaChannel, Reservation, Source } from "@/db/schema";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";

/**
 * Pricing maths. Pure: plain rows in, plain values out, no database and no
 * clock, so every rule is unit tested.
 *
 * Innkeep has no market data of its own. Its reference points are the
 * host's: the price each platform shows for a night, what the platforms keep,
 * and what the same month earned before. Where Airbnb's Smart Pricing is on,
 * the Airbnb price already follows demand and similar listings, which is why
 * the main suggestion brings the other platform in line with it.
 */

export type PriceRow = Pick<NightlyPrice, "source" | "plan" | "date" | "amount" | "note">;
export type StayRow = Pick<
  Reservation,
  "source" | "kind" | "status" | "checkIn" | "checkOut" | "amount" | "grossAmount" | "channelFees"
>;

/** Share of the price each platform keeps, used when the host's own bookings cannot tell us. */
export const DEFAULT_FEES: Record<OtaChannel, number> = { airbnb: 0.03, booking: 0.15 };

/** Prices closer than this, in what the host receives, count as aligned. */
const ALIGNED_WITHIN = 0.03;
const LAST_MINUTE_DAYS = 7;
const LAST_MINUTE_DISCOUNT = 0.1;
/** A free stretch this short between two bookings rarely sells at the usual minimum stay. */
const ORPHAN_NIGHTS = 2;
const BELOW_HISTORY = 0.75;

/**
 * Booking.com's real cut, from the bookings whose price and commission the
 * extension read. Null when there is none yet.
 */
export function bookingFeeRate(stays: StayRow[]): number | null {
  let gross = 0;
  let fees = 0;
  for (const stay of stays) {
    if (stay.source !== "booking" || stay.status !== "confirmed") continue;
    if (!stay.grossAmount || stay.channelFees == null) continue;
    gross += stay.grossAmount;
    fees += stay.channelFees;
  }
  return gross > 0 ? fees / gross : null;
}

/** Booking.com rate plans present, and the one to compare: the asked one, else the dearest (the base rate). */
export function pickPlan(prices: PriceRow[], wanted?: string): { plans: string[]; plan: string | null } {
  const totals = new Map<string, { sum: number; count: number }>();
  for (const price of prices) {
    if (price.source !== "booking") continue;
    const total = totals.get(price.plan) ?? { sum: 0, count: 0 };
    totals.set(price.plan, { sum: total.sum + price.amount, count: total.count + 1 });
  }
  const plans = [...totals.keys()].sort();
  if (wanted != null && totals.has(wanted)) return { plans, plan: wanted };
  const dearest = [...totals].sort(([, a], [, b]) => b.sum / b.count - a.sum / a.count)[0]?.[0];
  return { plans, plan: dearest ?? null };
}

/**
 * What a night earned in each calendar month ("01" to "12"), from finished
 * stays with a known payout. A payout includes any cleaning fee, so this
 * runs a little above the nightly price; it is a reference, not a target.
 */
export function historyByMonth(stays: StayRow[], today: ISODate): Map<string, Minor> {
  const months = new Map<string, { sum: number; nights: number }>();
  for (const stay of stays) {
    if (stay.kind !== "reservation" || stay.status !== "confirmed" || !stay.amount) continue;
    if (stay.checkOut > today) continue;
    const nights = diffDays(stay.checkIn, stay.checkOut);
    if (nights <= 0) continue;
    const rate = stay.amount / nights;
    for (let night = 0; night < nights; night++) {
      const month = addDays(stay.checkIn, night).slice(5, 7);
      const total = months.get(month) ?? { sum: 0, nights: 0 };
      months.set(month, { sum: total.sum + rate, nights: total.nights + 1 });
    }
  }
  return new Map([...months].map(([month, total]) => [month, Math.round(total.sum / total.nights)]));
}

export type PriceSuggestion =
  /** Booking.com brings in less (or more) than Airbnb for the same night: set it to `target`. */
  | { kind: "align"; target: Minor; direction: "raise" | "lower" }
  /** Still free a few days out: a discount of `percent` often sells it. */
  | { kind: "lastMinute"; percent: number }
  /** A short free stretch between two bookings. */
  | { kind: "orphan"; nights: number }
  /** Priced well under what this month earned before. */
  | { kind: "belowHistory"; earned: Minor };

export type Night = {
  date: ISODate;
  /** Who holds the night; null when it is free. */
  takenBy: Source | "blocked" | null;
  note: string | null;
  /** Guest-facing nightly price on each platform, when its calendar showed one. */
  airbnb: Minor | null;
  booking: Minor | null;
  /** What the host keeps after each platform's cut. */
  airbnbNet: Minor | null;
  bookingNet: Minor | null;
  /** Booking.com minus Airbnb, in what the host keeps. */
  gap: Minor | null;
  suggestion: PriceSuggestion | null;
};

const round = (amount: number): Minor => Math.round(amount / 100) * 100;

export function buildNights(input: {
  from: ISODate;
  days: number;
  prices: PriceRow[];
  /** Booking.com rate plan to compare; see `pickPlan`. */
  plan: string | null;
  /** Confirmed stays and blocks of this property. */
  stays: StayRow[];
  fees: Record<OtaChannel, number>;
  history: Map<string, Minor>;
}): Night[] {
  const { from, days, prices, plan, stays, fees, history } = input;
  const airbnb = new Map<string, PriceRow>();
  const booking = new Map<string, PriceRow>();
  for (const price of prices) {
    if (price.source === "airbnb") airbnb.set(price.date, price);
    else if (price.plan === plan) booking.set(price.date, price);
  }
  const live = stays.filter((stay) => stay.status === "confirmed");
  const holder = (date: ISODate): Night["takenBy"] => {
    const stay = live.find((candidate) => candidate.checkIn <= date && date < candidate.checkOut);
    return stay ? (stay.kind === "block" ? "blocked" : stay.source) : null;
  };

  const nights: Night[] = Array.from({ length: days }, (_, offset) => {
    const date = addDays(from, offset);
    const a = airbnb.get(date)?.amount ?? null;
    const b = booking.get(date)?.amount ?? null;
    const airbnbNet = a == null ? null : Math.round(a * (1 - fees.airbnb));
    const bookingNet = b == null ? null : Math.round(b * (1 - fees.booking));
    return {
      date,
      takenBy: holder(date),
      note: airbnb.get(date)?.note ?? null,
      airbnb: a,
      booking: b,
      airbnbNet,
      bookingNet,
      gap: airbnbNet != null && bookingNet != null ? bookingNet - airbnbNet : null,
      suggestion: null,
    };
  });

  for (const [index, night] of nights.entries()) {
    if (night.takenBy) continue;

    if (night.gap != null && night.airbnbNet && Math.abs(night.gap) / night.airbnbNet >= ALIGNED_WITHIN) {
      const target = round(night.airbnbNet / (1 - fees.booking));
      if (target !== night.booking) {
        night.suggestion = { kind: "align", target, direction: night.gap < 0 ? "raise" : "lower" };
        continue;
      }
    }
    if (index < LAST_MINUTE_DAYS && (night.airbnb ?? night.booking) != null) {
      night.suggestion = { kind: "lastMinute", percent: LAST_MINUTE_DISCOUNT };
      continue;
    }

    // Length of the free stretch this night sits in, when both ends are booked and inside the window.
    let start = index;
    while (start > 0 && !nights[start - 1].takenBy) start--;
    let end = index;
    while (end < nights.length - 1 && !nights[end + 1].takenBy) end++;
    const fenced = start > 0 && end < nights.length - 1;
    if (fenced && end - start + 1 <= ORPHAN_NIGHTS) {
      night.suggestion = { kind: "orphan", nights: end - start + 1 };
      continue;
    }

    const earned = history.get(night.date.slice(5, 7));
    const net = night.airbnbNet ?? night.bookingNet;
    if (earned && net != null && net < earned * BELOW_HISTORY) {
      night.suggestion = { kind: "belowHistory", earned };
    }
  }
  return nights;
}

export type PricingSummary = {
  /** Free nights with a price on that platform, and their average. */
  airbnb: { nights: number; average: Minor | null };
  booking: { nights: number; average: Minor | null };
  /** Free nights where Booking.com leaves the host less, or more, than Airbnb. */
  bookingLower: number;
  bookingHigher: number;
  /** Extra kept over those nights if Booking.com matched Airbnb and they sold there. */
  shortfall: Minor;
  suggestions: Record<PriceSuggestion["kind"], number>;
};

export function summarise(nights: Night[]): PricingSummary {
  const free = nights.filter((night) => !night.takenBy);
  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
  const of = (key: "airbnb" | "booking") => {
    const values = free.flatMap((night) => (night[key] == null ? [] : [night[key]]));
    return { nights: values.length, average: average(values) };
  };
  const misaligned = free.filter((night) => night.suggestion?.kind === "align" && night.gap != null);
  const suggestions = { align: 0, lastMinute: 0, orphan: 0, belowHistory: 0 };
  for (const night of free) if (night.suggestion) suggestions[night.suggestion.kind]++;

  return {
    airbnb: of("airbnb"),
    booking: of("booking"),
    bookingLower: misaligned.filter((night) => night.gap! < 0).length,
    bookingHigher: misaligned.filter((night) => night.gap! > 0).length,
    shortfall: misaligned.reduce((sum, night) => sum + Math.max(0, -night.gap!), 0),
    suggestions,
  };
}

export type SampleStay = {
  checkIn: ISODate;
  checkOut: ISODate;
  /** The Airbnb calendar's nightly prices for the stay, added up. */
  nightly: Minor;
};

/**
 * Short stays worth checking on the public listing page: the first run of
 * free, priced nights in each month. A handful is enough to see how fees and
 * discounts move the price a guest is shown; Innkeep never checks them by
 * itself, the host opens each one.
 */
export function sampleStays(nights: Night[], length = 3, limit = 6): SampleStay[] {
  const samples: SampleStay[] = [];
  const months = new Set<string>();
  for (let start = 0; start + length <= nights.length && samples.length < limit; start++) {
    const month = nights[start].date.slice(0, 7);
    if (months.has(month)) continue;
    const stay = nights.slice(start, start + length);
    if (stay.some((night) => night.takenBy || night.airbnb == null)) continue;
    months.add(month);
    samples.push({
      checkIn: stay[0].date,
      checkOut: addDays(stay[0].date, length),
      nightly: stay.reduce((sum, night) => sum + night.airbnb!, 0),
    });
  }
  return samples;
}
