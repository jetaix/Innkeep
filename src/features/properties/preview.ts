import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, listings, OTA_CHANNELS, type Listing } from "@/db";
import { findListingForPage } from "./link";

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
  /** The public page that was read; lets a listing with no platform number yet be recognised. */
  listingUrl: z.url().max(500).nullish(),
  preview: previewSchema,
});

export async function savePreview(listingRowId: number, preview: Preview) {
  await getDb()
    .update(listings)
    .set({ publicPreview: JSON.stringify(preview), publicPreviewAt: Date.now() })
    .where(eq(listings.id, listingRowId))
    .run();
}

/** Only for a listing Innkeep knows by its platform id: anyone else's page is refused. */
export async function ingestPreview(
  input: z.input<typeof previewIngestSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { source, listingId, listingUrl, preview } = previewIngestSchema.parse(input);
  const listing = await findListingForPage(source, listingId, listingUrl);
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

/** Airbnb's image server resizes on request; asking for a sensible width keeps the page light. */
export function sizedPhoto(url: string, width: number): string {
  const parsed = new URL(url);
  if (parsed.hostname.endsWith("muscache.com") && !parsed.search)
    parsed.searchParams.set("im_w", String(width));
  return parsed.toString();
}
