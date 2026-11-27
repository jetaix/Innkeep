import { and, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { CHANNELS } from "@/channels";
import { contentHash, effectiveContent } from "@/channels/content";
import { syncAll, syncListing } from "@/channels/sync";
import { getDb, listings, OTA_CHANNELS, properties } from "@/db";
import { newToken, removeSampleData, seedDemo } from "@/db/seed";
import { parse, text, wholeNumber } from "@/lib/form";
import { airbnbListingId } from "./link";

/** Changes to properties and their listings. Called by the API; no framework in here. */
const time = z.string().regex(/^\d{2}:\d{2}$/);

const propertyDetails = z.object({
  name: text.min(1),
  address: text,
  title: text,
  description: text,
  maxGuests: wholeNumber(1),
  bedrooms: wholeNumber(),
  bathrooms: wholeNumber(),
  basePrice: wholeNumber(),
  currency: text.toUpperCase().length(3),
  checkInTime: time,
  checkOutTime: time,
  houseRules: text,
});

export async function createProperty(input: unknown) {
  const { name } = parse(z.object({ name: text.min(1) }), input);
  const row = await getDb()
    .insert(properties)
    .values({ name, title: name, icalToken: newToken(), createdAt: Date.now() })
    .returning({ id: properties.id })
    .get();
  return row.id;
}

export async function updateProperty(id: number, input: unknown) {
  await getDb().update(properties).set(parse(propertyDetails, input)).where(eq(properties.id, id)).run();
}

export async function deleteProperty(id: number) {
  await getDb().delete(properties).where(eq(properties.id, id)).run();
}

const listingSettings = z.object({
  listingUrl: text,
  icalUrl: text,
  titleOverride: text,
  descriptionOverride: text,
});

export async function saveListing(propertyId: number, channel: unknown, input: unknown) {
  const parsedChannel = parse(z.enum(OTA_CHANNELS), channel);
  const data = parse(listingSettings, input);

  const row = await getDb()
    .insert(listings)
    .values({ propertyId, channel: parsedChannel, ...data })
    .onConflictDoUpdate({ target: [listings.propertyId, listings.channel], set: data })
    .returning({ id: listings.id, icalUrl: listings.icalUrl })
    .get();
  // Airbnb's own addresses name the listing, so the extension can read its pages without a first run.
  const airbnbId =
    parsedChannel === "airbnb" ? (airbnbListingId(data.listingUrl) ?? airbnbListingId(data.icalUrl)) : null;
  if (airbnbId) {
    await getDb()
      .update(listings)
      .set({ externalId: airbnbId })
      .where(and(eq(listings.id, row.id), isNull(listings.externalId)))
      .run();
  }
  // Import straight away so a wrong link is reported while the host is looking.
  if (row.icalUrl) await syncListing(row.id);
  return row.id;
}

/** Saves only the calendar link of a listing, keeping whatever else was already set on it. */
export async function saveCalendarLink(propertyId: number, channel: unknown, icalUrl: string) {
  const parsedChannel = parse(z.enum(OTA_CHANNELS), channel);
  const existing = await getDb()
    .select()
    .from(listings)
    .where(and(eq(listings.propertyId, propertyId), eq(listings.channel, parsedChannel)))
    .get();
  return saveListing(propertyId, parsedChannel, {
    listingUrl: existing?.listingUrl ?? "",
    titleOverride: existing?.titleOverride ?? "",
    descriptionOverride: existing?.descriptionOverride ?? "",
    icalUrl,
  });
}

export async function syncOne(listingId: number) {
  await syncListing(listingId);
}

/** How old the newest import may be before opening the app triggers a fresh one. */
const STALE_AFTER_MS = 10 * 60_000;

/**
 * Called when the dashboard is opened or comes back into view. Imports the
 * calendars again if the last import is old, so the host never has to ask.
 * Returns whether anything was refreshed.
 */
export async function syncIfStale(): Promise<boolean> {
  const feeds = await getDb().select().from(listings).where(ne(listings.icalUrl, "")).all();
  if (feeds.length === 0) return false;
  const newest = Math.max(...feeds.map((feed) => feed.lastSyncedAt ?? 0));
  if (Date.now() - newest < STALE_AFTER_MS) return false;
  await syncAll();
  return true;
}

export async function syncEverything() {
  await syncAll();
}

/**
 * Records that the channel now shows the current content. With a partner API
 * adapter this pushes the content first; without one the host has pasted it.
 * Returns whether there was such a listing.
 */
export async function markPublished(listingId: number): Promise<boolean> {
  const db = getDb();
  const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
  if (!listing) return false;
  const property = await db.select().from(properties).where(eq(properties.id, listing.propertyId)).get();
  if (!property) return false;

  const content = effectiveContent(property, listing);
  await CHANNELS[listing.channel].pushContent?.(listing.listingUrl, content);
  await db
    .update(listings)
    .set({ publishedHash: contentHash(content), publishedAt: Date.now() })
    .where(eq(listings.id, listingId))
    .run();
  return true;
}

export async function loadSampleData() {
  await seedDemo();
}

export async function clearSampleData() {
  await removeSampleData();
}
