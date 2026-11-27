import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import {
  addMonths,
  type Cost,
  formatMonth,
  monthOf,
  occupancyAhead,
  summariseMonth,
} from "@/features/revenue/compute";
import { getApiKey } from "@/features/assistant/key";
import type { Pricing } from "@/features/pricing/queries";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import type { InsightInput, Suggestion } from "./rules";

/**
 * Optional AI advice. The rule-based suggestions always work; when an
 * Anthropic API key is configured, the host can also ask Claude for advice
 * written for their listings.
 *
 * Privacy: the request contains listing content, nightly prices, occupancy,
 * payouts per stay and revenue totals. It never contains guest names,
 * messages, confirmation codes or reservation links.
 */

export const AI_MODEL = process.env.AI_MODEL ?? "claude-opus-5-5";

export async function aiConfigured(): Promise<boolean> {
  return Boolean((await getApiKey()) || process.env.ANTHROPIC_AUTH_TOKEN);
}

const adviceSchema = z.object({
  summary: z.string().describe("Two sentences on how the rentals are doing overall."),
  recommendations: z
    .array(
      z.object({
        title: z.string().describe("The recommendation as an instruction, under 70 characters."),
        property: z.string().describe("The property it applies to, or 'All properties'."),
        why: z
          .string()
          .describe("One or two sentences citing the specific numbers or text that motivate it."),
        steps: z.array(z.string()).describe("Two to four concrete steps the host can do this week."),
        impact: z.enum(["high", "medium", "low"]),
        area: z.enum(["pricing", "listing", "operations", "guests", "costs"]),
      }),
    )
    .describe("Three to six recommendations, most valuable first."),
});

export type Advice = z.infer<typeof adviceSchema>;

const SYSTEM = `You advise an independent host who rents out one or two properties on Airbnb and Booking.com and manages them with Innkeep, a self-hosted channel manager.

You receive a JSON snapshot of their account: each property's listing content, occupancy for the coming weeks, monthly revenue and costs, and the issues Innkeep's own rules already flagged. Where the host's browser extension has read them, it also holds real figures: what each finished stay paid per night, and, under "pricing", the nightly price each platform currently shows for free nights (by month), what the host keeps after each platform's cut, and the nights where the two platforms disagree.

Write practical recommendations for this host specifically. Ground every recommendation in something present in the snapshot (a number, a date range, a phrase from the listing) and say what it is. Prefer actions a single person can take this week without new tools or spending. Rewrite weak listing titles and opening lines in full rather than describing how to improve them. Do not repeat issues already flagged unless you add something beyond what the flag says. Innkeep syncs calendars by iCal and cannot change prices or listings on the platforms itself, so steps that involve the platforms are done by the host in the Airbnb or Booking.com dashboard.

Pricing recommendations must come from the snapshot's own numbers: the host's past earnings per night for the same month, the gap between platforms, how full the coming weeks are, and how far ahead a free night is. You have no data on other listings or on the local market, so never state or imply what competitors charge, and say so if the host would need that to decide. Quote amounts in the property's currency. A platform with no prices in the snapshot has simply not been read yet; suggest reading its calendar rather than guessing.

Revenue marked estimated is nights multiplied by the nightly rate, not a real payout; treat it as approximate. If the snapshot is too thin to support a recommendation, give fewer recommendations rather than generic ones.`;

/** Added to the instructions when the host does not read English. */
const LANGUAGE: Partial<Record<Locale, string>> = {
  fr: `Write the summary and every recommendation (title, why and steps) in French: the host reads French. Address the host as "vous", use sentence case and keep the wording short and plain. In the property field, give the property's name as it appears in the snapshot, or "Tous les logements" when it applies to all of them. Keep the impact and area values exactly as the schema defines them.`,
};

/**
 * Nightly prices condensed for the model: one line per month and platform
 * rather than one per night, plus the nights where the platforms disagree.
 */
function pricingSnapshot(pricing: Pricing | undefined) {
  if (!pricing || (!pricing.coverage.airbnb && !pricing.coverage.booking)) return "not read yet";
  const free = pricing.nights.filter((night) => !night.takenBy);
  const months = new Map<string, { airbnb: number[]; booking: number[]; free: number }>();
  for (const night of free) {
    const month = months.get(night.date.slice(0, 7)) ?? { airbnb: [], booking: [], free: 0 };
    month.free++;
    if (night.airbnb != null) month.airbnb.push(night.airbnb / 100);
    if (night.booking != null) month.booking.push(night.booking / 100);
    months.set(night.date.slice(0, 7), month);
  }
  const range = (values: number[]) =>
    values.length === 0
      ? "no price read"
      : {
          lowest: Math.min(...values),
          highest: Math.max(...values),
          average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
        };
  return {
    note: "Guest-facing nightly prices of nights still free, as each platform's calendar shows them.",
    platformCut: { airbnb: pricing.fees.airbnb, booking: pricing.fees.booking },
    bookingCutMeasuredOnOwnBookings: pricing.bookingFeeMeasured,
    bookingRatePlan: pricing.plan,
    airbnbPricesVaryByNight: pricing.airbnbVaries,
    freeNightsByMonth: [...months].map(([month, value]) => ({
      month,
      freeNights: value.free,
      airbnb: range(value.airbnb),
      booking: range(value.booking),
    })),
    nightsWhereBookingLeavesLess: pricing.summary.bookingLower,
    nightsWhereBookingLeavesMore: pricing.summary.bookingHigher,
    ruleBasedFlags: pricing.summary.suggestions,
    disagreements: free
      .filter((night) => night.suggestion?.kind === "align")
      .slice(0, 30)
      .map((night) => ({
        date: night.date,
        airbnb: night.airbnb! / 100,
        booking: night.booking! / 100,
        hostKeepsOnAirbnb: night.airbnbNet! / 100,
        hostKeepsOnBooking: night.bookingNet! / 100,
      })),
  };
}

/** Builds the snapshot sent to the model. Exported for tests and for the "what is sent" preview. */
export function buildSnapshot(
  input: InsightInput,
  charges: Cost[],
  flagged: Suggestion[],
  /** Nightly prices per property id, when the extension has read any. */
  pricing: Map<number, Pricing> = new Map(),
) {
  const guestStays = input.stays.filter((stay) => stay.kind === "reservation");
  const current = monthOf(input.today);
  return {
    today: input.today,
    properties: input.properties.map((property) => ({
      name: property.name,
      location: property.address,
      title: property.title,
      description: property.description,
      houseRules: property.houseRules,
      sleeps: property.maxGuests,
      bedrooms: property.bedrooms,
      nightlyRate: `${property.basePrice} ${property.currency}`,
      checkIn: property.checkInTime,
      checkOut: property.checkOutTime,
      channels: input.listings.filter((l) => l.propertyId === property.id && l.icalUrl).map((l) => l.channel),
      occupancyNext30Days: Math.round(occupancyAhead(property.id, guestStays, input.today, 30) * 100) / 100,
      occupancyNext90Days: Math.round(occupancyAhead(property.id, guestStays, input.today, 90) * 100) / 100,
      upcomingStays: guestStays
        .filter((stay) => stay.propertyId === property.id && stay.checkOut > input.today)
        .map((stay) => ({
          channel: stay.source,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          ...(stay.amount != null ? { payout: stay.amount / 100 } : {}),
        })),
      // Real payouts of finished stays, newest first: what a night has actually earned here.
      finishedStays: guestStays
        .filter((stay) => stay.propertyId === property.id && stay.checkOut <= input.today && stay.amount)
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
        .slice(0, 40)
        .map((stay) => {
          const nights = Math.max(
            1,
            Math.round((Date.parse(stay.checkOut) - Date.parse(stay.checkIn)) / 864e5),
          );
          return {
            channel: stay.source,
            checkIn: stay.checkIn,
            nights,
            payout: stay.amount! / 100,
            perNight: Math.round(stay.amount! / nights) / 100,
            ...(stay.bookedOn ? { bookedOn: stay.bookedOn } : {}),
          };
        }),
      pricing: pricingSnapshot(pricing.get(property.id)),
    })),
    // The past year (real payouts where the extension read them) and the next three months.
    months: Array.from({ length: 15 }, (_, index) => index - 12).map((offset) => {
      const summary = summariseMonth(addMonths(current, offset), guestStays, charges, input.properties);
      return {
        month: formatMonth(summary.month, "long"),
        grossRevenue: summary.gross / 100,
        ofWhichEstimated: summary.estimated / 100,
        costs: summary.charges / 100,
        net: summary.net / 100,
        occupancy: Math.round(summary.occupancy * 100) / 100,
      };
    }),
    // A loan with its bank's table is one cost per month: say it once.
    recurringCosts: charges
      .filter((charge, index) => charges.findIndex((other) => other.id === charge.id) === index)
      .map((charge) => ({
        label: charge.label,
        category: charge.category,
        frequency: charge.frequency,
        amount: charge.frequency === "percent" ? `${charge.amount / 100}%` : charge.amount / 100,
      })),
    alreadyFlagged: flagged.map((suggestion) => suggestion.title),
  };
}

export type AdviceResult = { ok: true; advice: Advice; model: string } | { ok: false; error: string };

/** Asks for advice written in `locale`. Failures are reported in that language too. */
export async function generateAdvice(
  snapshot: ReturnType<typeof buildSnapshot>,
  locale: Locale = "en",
): Promise<AdviceResult> {
  const errors = MESSAGES[locale].insights.errors;
  const language = LANGUAGE[locale];
  // No key here means the SDK falls back to its own environment variables.
  const client = new Anthropic({ apiKey: (await getApiKey()) ?? undefined });
  try {
    const response = await client.beta.messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      // If the model declines, the API retries on its default fallback in the same call.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: language ? `${SYSTEM}\n\n${language}` : SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(snapshot, null, 2) }],
      output_config: { effort: "medium", format: betaZodOutputFormat(adviceSchema) },
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: errors.refused };
    }
    if (!response.parsed_output) {
      return { ok: false, error: errors.unreadable };
    }
    return { ok: true, advice: response.parsed_output, model: response.model };
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: errors.authentication };
    }
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: errors.rateLimit };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, error: errors.connection };
    }
    if (error instanceof Anthropic.APIError) {
      return { ok: false, error: errors.api(error.status ?? null) };
    }
    throw error;
  }
}
