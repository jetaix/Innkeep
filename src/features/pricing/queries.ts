import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, guestQuotes, nightlyPrices, reservations, type OtaChannel } from "@/db";
import { today } from "@/lib/dates";
import {
  bookingFeeRate,
  buildNights,
  DEFAULT_FEES,
  historyByMonth,
  pickPlan,
  sampleStays,
  summarise,
} from "./compute";

/** How many nights ahead the Pricing page can show; the first is the default. */
export const PRICING_WINDOWS = [120, 240, 365] as const;

export async function getPricing(propertyId: number, wantedPlan?: string, days: number = PRICING_WINDOWS[0]) {
  const db = getDb();
  const now = today();
  const prices = await db
    .select()
    .from(nightlyPrices)
    .where(eq(nightlyPrices.propertyId, propertyId))
    .orderBy(asc(nightlyPrices.date))
    .all();
  const stays = await db.select().from(reservations).where(eq(reservations.propertyId, propertyId)).all();

  const { plans, plan } = pickPlan(prices, wantedPlan);
  const measured = bookingFeeRate(stays);
  const fees = { ...DEFAULT_FEES, booking: measured ?? DEFAULT_FEES.booking };
  const history = historyByMonth(stays, now);
  const nights = buildNights({ from: now, days, prices, plan, stays, fees, history });

  /** When each platform's calendar was last read, and the last night it covered. */
  const coverage = (source: OtaChannel) => {
    const rows = prices.filter(
      (price) => price.source === source && (source === "airbnb" || price.plan === plan),
    );
    if (rows.length === 0) return null;
    return {
      nights: rows.filter((row) => row.date >= now).length,
      until: rows.at(-1)!.date,
      seenAt: Math.max(...rows.map((row) => row.seenAt)),
    };
  };

  // Sample stays to check on the public listing page, with what a guest was shown when one was read.
  const quotes = await db.select().from(guestQuotes).where(eq(guestQuotes.propertyId, propertyId)).all();
  const quoteFor = (source: OtaChannel, sample: { checkIn: string; checkOut: string }) =>
    quotes.find(
      (quote) =>
        quote.source === source && quote.checkIn === sample.checkIn && quote.checkOut === sample.checkOut,
    ) ?? null;
  const guestChecks = sampleStays(nights).map((sample) => ({
    ...sample,
    quotes: { airbnb: quoteFor("airbnb", sample), booking: quoteFor("booking", sample) },
  }));

  return {
    today: now,
    days,
    guestChecks,
    nights,
    summary: summarise(nights),
    plans,
    plan,
    fees,
    /** Whether Booking.com's cut comes from the host's own bookings rather than the usual rate. */
    bookingFeeMeasured: measured != null,
    coverage: { airbnb: coverage("airbnb"), booking: coverage("booking") },
    /** Airbnb prices that change from night to night are the mark of Smart Pricing. */
    airbnbVaries: new Set(nights.flatMap((night) => (night.airbnb == null ? [] : [night.airbnb]))).size > 3,
  };
}

export type Pricing = Awaited<ReturnType<typeof getPricing>>;
