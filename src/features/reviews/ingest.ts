import "server-only";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, OTA_CHANNELS, reviews } from "@/db";
import { findListingForPage } from "@/features/properties/link";

/**
 * Reviews sent by the browser extension from a listing's public page. A
 * review already known is updated in place (a reply may have been added);
 * nothing is ever deleted, since a visit may show only part of the list.
 */
export const reviewsSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  listingId: z.string().trim().min(3).max(40),
  /** The public page that was read; lets a listing with no platform number yet be recognised. */
  listingUrl: z.url().max(500).nullish(),
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
export async function ingestReviews(input: z.input<typeof reviewsSchema>): Promise<ReviewsResult> {
  const parsed = reviewsSchema.parse(input);
  const db = getDb();
  const listing = await findListingForPage(parsed.source, parsed.listingId, parsed.listingUrl);
  if (!listing) return { ok: false, error: "This is not one of your listings in Innkeep." };

  const seenAt = Date.now();
  await db.transaction(async (tx) => {
    for (const { key, ...review } of parsed.reviews) {
      const values = {
        ...review,
        rating: review.rating ?? null,
        reviewedOn: review.reviewedOn ?? null,
        seenAt,
      };
      await tx
        .insert(reviews)
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
