import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, listings, OTA_CHANNELS, reviews } from "@/db";

/**
 * Reviews sent by the browser extension from a listing's public page. A
 * review already known is updated in place (a reply may have been added);
 * nothing is ever deleted, since a visit may show only part of the list.
 */
export const reviewsSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  listingId: z.string().trim().min(3).max(40),
  reviews: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(200),
        author: z.string().trim().min(1).max(80),
        rating: z.number().min(0).max(10).nullish(),
        scale: z.union([z.literal(5), z.literal(10)]).default(5),
        reviewedOn: z
          .string()
          .regex(/^\d{4}-\d{2}(-\d{2})?$/)
          .nullish(),
        stay: z.string().max(120).default(""),
        title: z.string().max(200).default(""),
        body: z.string().max(5000).default(""),
        negative: z.string().max(5000).default(""),
        reply: z.string().max(5000).default(""),
      }),
    )
    .min(1)
    .max(500),
});

export type ReviewsResult = { ok: true; saved: number } | { ok: false; error: string };

/** Only for a listing Innkeep knows by its platform id: anyone else's reviews are refused. */
export function ingestReviews(input: z.input<typeof reviewsSchema>): ReviewsResult {
  const parsed = reviewsSchema.parse(input);
  const db = getDb();
  const listing = db
    .select()
    .from(listings)
    .where(and(eq(listings.channel, parsed.source), eq(listings.externalId, parsed.listingId)))
    .get();
  if (!listing) return { ok: false, error: "This is not one of your listings in Innkeep." };

  const seenAt = Date.now();
  db.transaction((tx) => {
    for (const { key, ...review } of parsed.reviews) {
      const values = {
        ...review,
        rating: review.rating ?? null,
        reviewedOn: review.reviewedOn ?? null,
        seenAt,
      };
      tx.insert(reviews)
        .values({ propertyId: listing.propertyId, source: parsed.source, externalKey: key, ...values })
        .onConflictDoUpdate({
          target: [reviews.propertyId, reviews.source, reviews.externalKey],
          // A reply once seen is kept even if a later, partial reading misses it.
          set: {
            ...values,
            reply: sql`CASE WHEN excluded.reply != '' THEN excluded.reply ELSE ${reviews.reply} END`,
          },
        })
        .run();
    }
  });
  return { ok: true, saved: parsed.reviews.length };
}
