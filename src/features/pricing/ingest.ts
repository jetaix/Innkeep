import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, guestQuotes, listings, nightlyPrices, OTA_CHANNELS, properties } from "@/db";
import { previewSchema, savePreview } from "@/features/properties/preview";
import { addDays, today } from "@/lib/dates";

/**
 * Nightly prices sent by the browser extension from the host's own calendar
 * on a platform. Each visit replaces what was known for the nights it covers
 * and leaves the others alone, so scrolling further only adds.
 */
export const pricesSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  /** The platform's id for the listing whose calendar this is. */
  listingId: z.string().trim().max(40).nullish(),
  prices: z
    .array(
      z.object({
        date: z.iso.date(),
        /** Minor units (cents). */
        amount: z.number().int().min(1).max(100_000_000),
        plan: z.string().trim().max(60).default(""),
        note: z.string().trim().max(80).nullish(),
      }),
    )
    .min(1)
    .max(3000),
});

export type PricesResult =
  { ok: true; saved: number; until: string; propertyId: number } | { ok: false; error: string };

export async function ingestPrices(input: z.input<typeof pricesSchema>): Promise<PricesResult> {
  const parsed = pricesSchema.parse(input);
  const { source, listingId } = parsed;
  // Airbnb's calendar also shows a year of past nights; only prices still on sale are kept.
  const since = addDays(today(), -1);
  const prices = parsed.prices.filter((price) => price.date >= since);
  if (prices.length === 0) return { ok: false, error: "These prices are all for nights already past." };
  const db = getDb();

  const known = listingId
    ? await db
        .select()
        .from(listings)
        .where(and(eq(listings.channel, source), eq(listings.externalId, listingId)))
        .get()
    : undefined;
  const all = await db.select({ id: properties.id }).from(properties).all();
  // A price on the wrong property would mislead every comparison, so never guess between several.
  const propertyId = known?.propertyId ?? (all.length === 1 ? all[0].id : null);
  if (propertyId == null) {
    return {
      ok: false,
      error: "Innkeep does not know this listing yet. Send its reservations or details first.",
    };
  }

  const seenAt = Date.now();
  await db.transaction(async (tx) => {
    for (const price of prices) {
      await tx
        .insert(nightlyPrices)
        .values({ propertyId, source, seenAt, ...price, note: price.note ?? null })
        .onConflictDoUpdate({
          target: [nightlyPrices.propertyId, nightlyPrices.source, nightlyPrices.plan, nightlyPrices.date],
          set: { amount: sql`excluded.amount`, note: sql`excluded.note`, seenAt },
        })
        .run();
    }
    // The platform told us its id for this listing: remember it for next time.
    if (listingId && !known) {
      await tx
        .update(listings)
        .set({ externalId: listingId })
        .where(and(eq(listings.propertyId, propertyId), eq(listings.channel, source)))
        .run();
    }
  });

  const until = prices.reduce((latest, price) => (price.date > latest ? price.date : latest), prices[0].date);
  return { ok: true, saved: prices.length, until, propertyId };
}

export const quoteSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  listingId: z.string().trim().min(3).max(40),
  checkIn: z.iso.date(),
  checkOut: z.iso.date(),
  guests: z.number().int().min(1).max(50).nullish(),
  /** Minor units (cents). */
  total: z.number().int().min(1).max(1_000_000_000),
  original: z.number().int().min(1).max(1_000_000_000).nullish(),
  /** The same page also shows the listing itself; see `features/properties/preview`. */
  preview: previewSchema.nullish(),
});

/**
 * Keeps what a guest is shown for one stay. Only for a listing Innkeep knows
 * by its platform id: the public page of anyone else's listing is refused.
 */
export async function ingestQuote(
  input: z.input<typeof quoteSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const quote = quoteSchema.parse(input);
  const db = getDb();
  const listing = await db
    .select()
    .from(listings)
    .where(and(eq(listings.channel, quote.source), eq(listings.externalId, quote.listingId)))
    .get();
  if (!listing) return { ok: false, error: "This is not one of your listings in Innkeep." };

  const values = {
    guests: quote.guests ?? null,
    total: quote.total,
    original: quote.original ?? null,
    seenAt: Date.now(),
  };
  await db
    .insert(guestQuotes)
    .values({
      propertyId: listing.propertyId,
      source: quote.source,
      checkIn: quote.checkIn,
      checkOut: quote.checkOut,
      ...values,
    })
    .onConflictDoUpdate({
      target: [guestQuotes.propertyId, guestQuotes.source, guestQuotes.checkIn, guestQuotes.checkOut],
      set: values,
    })
    .run();
  if (quote.preview) await savePreview(listing.id, quote.preview);
  return { ok: true };
}
