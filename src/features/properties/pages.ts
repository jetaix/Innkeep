import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { channelPages, getDb, listings, OTA_CHANNELS, type OtaChannel } from "@/db";

/**
 * Admin pages of a platform, kept as shown. The browser extension sends one
 * when the host opens it, or passes through it during a "read everything"
 * run; each reading replaces the last.
 */
export const pageSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  listingId: z.string().trim().min(3).max(40),
  page: z.object({
    key: z
      .string()
      .trim()
      .regex(/^(editor|extranet)\/[a-z0-9_-]{1,60}$/),
    title: z.string().max(120).default(""),
    lines: z.array(z.string().max(240)).max(250).default([]),
    images: z
      .array(z.url({ protocol: /^https$/ }).max(600))
      .max(60)
      .default([]),
  }),
});

/** Only for a listing Innkeep knows by its platform id. */
export async function ingestPage(
  input: z.input<typeof pageSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { source, listingId, page } = pageSchema.parse(input);
  const db = getDb();
  const listing = await db
    .select()
    .from(listings)
    .where(and(eq(listings.channel, source), eq(listings.externalId, listingId)))
    .get();
  if (!listing) return { ok: false, error: "This is not one of your listings in Innkeep." };

  const values = {
    title: page.title,
    lines: JSON.stringify(page.lines),
    images: JSON.stringify(page.images),
    seenAt: Date.now(),
  };
  await db
    .insert(channelPages)
    .values({ listingId: listing.id, page: page.key, ...values })
    .onConflictDoUpdate({ target: [channelPages.listingId, channelPages.page], set: values })
    .run();
  return { ok: true };
}

export type StoredPage = { key: string; title: string; lines: string[]; images: string[]; seenAt: number };

const list = (json: string): string[] => {
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
};

export async function getPages(listingRowId: number): Promise<StoredPage[]> {
  return (
    await (
      await getDb()
    )
      .select()
      .from(channelPages)
      .where(eq(channelPages.listingId, listingRowId))
      .orderBy(asc(channelPages.page))
      .all()
  ).map((row) => ({
    key: row.page,
    title: row.title,
    lines: list(row.lines),
    images: list(row.images),
    seenAt: row.seenAt,
  }));
}

/** The photos of a listing as its admin shows them, for when the public page's gallery was not read. */
export async function adminPhotos(propertyId: number, channel: OtaChannel): Promise<string[]> {
  const db = getDb();
  const listing = await db
    .select()
    .from(listings)
    .where(and(eq(listings.propertyId, propertyId), eq(listings.channel, channel)))
    .get();
  if (!listing) return [];
  const page = (await getPages(listing.id)).find(
    (entry) => /photo/.test(entry.key) && entry.images.length > 0,
  );
  return page?.images ?? [];
}
