import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, listings, OTA_CHANNELS, type Listing } from "@/db";

/**
 * A listing as a platform's public page shows it to guests, read by the
 * browser extension when the host opens that page from Innkeep. It is kept
 * as one JSON value per listing and replaced whole on each read.
 */
export const previewSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().max(6000).default(""),
  /** Photo addresses on the platform's own image servers. */
  images: z
    .array(z.url({ protocol: /^https$/ }).max(500))
    .max(12)
    .default([]),
  rating: z.number().min(0).max(10).nullish(),
  /** Airbnb scores out of 5, Booking.com out of 10. */
  ratingScale: z.union([z.literal(5), z.literal(10)]).default(5),
  reviews: z.number().int().min(0).nullish(),
  location: z.string().max(200).default(""),
  summary: z.array(z.string().max(200)).max(4).default([]),
  highlights: z.array(z.string().max(300)).max(8).default([]),
  amenities: z.array(z.string().max(80)).max(16).default([]),
});

export type Preview = z.infer<typeof previewSchema>;

export const previewIngestSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  listingId: z.string().trim().min(3).max(40),
  preview: previewSchema,
});

export async function savePreview(listingRowId: number, preview: Preview) {
  await (await getDb())
    .update(listings)
    .set({ publicPreview: JSON.stringify(preview), publicPreviewAt: Date.now() })
    .where(eq(listings.id, listingRowId))
    .run();
}

/** Only for a listing Innkeep knows by its platform id: anyone else's page is refused. */
export async function ingestPreview(
  input: z.input<typeof previewIngestSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { source, listingId, preview } = previewIngestSchema.parse(input);
  const listing = await (await getDb())
    .select()
    .from(listings)
    .where(and(eq(listings.channel, source), eq(listings.externalId, listingId)))
    .get();
  if (!listing) return { ok: false, error: "This is not one of your listings in Innkeep." };
  await savePreview(listing.id, preview);
  return { ok: true };
}

export function readPreview(listing: Pick<Listing, "publicPreview">): Preview | null {
  if (!listing.publicPreview) return null;
  try {
    return previewSchema.parse(JSON.parse(listing.publicPreview));
  } catch {
    return null;
  }
}
