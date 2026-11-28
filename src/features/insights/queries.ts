import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { publishState } from "@/channels/content";
import { aiAdvice, charges, dismissedSuggestions, getDb, listings, reviews } from "@/db";
import { readPreview } from "@/features/properties/preview";
import { getProperties, getStays } from "@/features/reservations/queries";
import type { Locale } from "@/i18n/config";
import { createFormat } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import { addDays, today } from "@/lib/dates";
import type { Advice } from "./ai";
import { buildSuggestions, type InsightInput, type Suggestion } from "./rules";

async function gatherInput(): Promise<InsightInput> {
  const db = getDb();
  const properties = await getProperties();
  const now = today();

  return {
    today: now,
    now: Date.now(),
    properties,
    listings: (await db.select().from(listings).all()).flatMap((listing) => {
      const property = properties.find((p) => p.id === listing.propertyId);
      if (!property) return [];
      const preview = readPreview(listing);
      const page = preview && {
        title: preview.title,
        description: preview.description,
        photos: preview.images.length,
        amenities: preview.amenities,
        location: preview.location,
      };
      return [{ ...listing, publishState: publishState(property, listing), page }];
    }),
    reviews: await db.select().from(reviews).orderBy(desc(reviews.reviewedOn)).all(),
    // A day of history keeps today's departures in view for turnover checks.
    stays: await getStays(addDays(now, -1)),
    chargeCount: (await db.select({ count: sql<number>`count(*)` }).from(charges).get())?.count ?? 0,
  };
}

/** Suggestions written in `locale`. Their keys are the same in every language, so dismissals carry over. */
export async function getSuggestions(locale: Locale = "en"): Promise<{
  active: Suggestion[];
  dismissed: number;
  input: InsightInput;
}> {
  const input = await gatherInput();
  const all = buildSuggestions(input, MESSAGES[locale].insights.rules, createFormat(locale));
  const hidden = new Set((await getDb().select().from(dismissedSuggestions).all()).map((row) => row.key));
  const active = all.filter((suggestion) => !hidden.has(suggestion.key));
  return { active, dismissed: all.length - active.length, input };
}

export async function getAdvice(): Promise<{ advice: Advice; generatedAt: number; model: string } | null> {
  const row = await getDb().select().from(aiAdvice).where(eq(aiAdvice.id, 1)).get();
  if (!row) return null;
  // Advice written before listings were audited has no such part.
  const stored = JSON.parse(row.payload) as Omit<Advice, "listings"> & Partial<Pick<Advice, "listings">>;
  const advice: Advice = { ...stored, listings: stored.listings ?? [] };
  return { advice, generatedAt: row.generatedAt, model: row.model };
}
