"use server";

import { and, eq, isNull, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CHANNELS } from "@/channels";
import { contentHash, effectiveContent } from "@/channels/content";
import { syncAll, syncListing } from "@/channels/sync";
import { getDb, listings, OTA_CHANNELS, properties } from "@/db";
import { newToken, removeSampleData, seedDemo } from "@/db/seed";
import { airbnbListingId } from "./link";
import { parseForm, text, wholeNumber } from "@/lib/form";

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

export async function createProperty(form: FormData) {
  const parsed = parseForm(z.object({ name: text.min(1) }), form);
  if (!parsed.success) return;
  const { name } = parsed.data;
  const row = await (await getDb())
    .insert(properties)
    .values({ name, title: name, icalToken: newToken(), createdAt: Date.now() })
    .returning({ id: properties.id })
    .get();
  redirect(`/properties/${row.id}`);
}

export async function updateProperty(id: number, form: FormData) {
  const parsed = parseForm(propertyDetails, form);
  if (!parsed.success) return;
  await getDb().update(properties).set(parsed.data).where(eq(properties.id, id)).run();
  refresh();
}

export async function deleteProperty(id: number) {
  await getDb().delete(properties).where(eq(properties.id, id)).run();
  redirect("/properties");
}

const listingSettings = z.object({
  listingUrl: text,
  icalUrl: text,
  titleOverride: text,
  descriptionOverride: text,
});

export async function saveListing(propertyId: number, channel: string, form: FormData) {
  const parsedChannel = z.enum(OTA_CHANNELS).safeParse(channel);
  const parsed = parseForm(listingSettings, form);
  if (!parsedChannel.success || !parsed.success) return;

  const row = await getDb()
    .insert(listings)
    .values({ propertyId, channel: parsedChannel.data, ...parsed.data })
    .onConflictDoUpdate({ target: [listings.propertyId, listings.channel], set: parsed.data })
    .returning({ id: listings.id, icalUrl: listings.icalUrl })
    .get();
  // Airbnb's address names the listing, so the extension can read its pages without a first run.
  const airbnbId = parsedChannel.data === "airbnb" ? airbnbListingId(parsed.data.listingUrl) : null;
  if (airbnbId) {
    await getDb()
      .update(listings)
      .set({ externalId: airbnbId })
      .where(and(eq(listings.id, row.id), isNull(listings.externalId)))
      .run();
  }
  // Import straight away so a wrong link is reported while the host is looking.
  if (row.icalUrl) await syncListing(row.id);
  refresh();
}

export async function syncListingAction(listingId: number) {
  await syncListing(listingId);
  refresh();
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
  refresh();
  return true;
}

export async function syncAllAction() {
  await syncAll();
  refresh();
}

/**
 * Records that the channel now shows the current content. With a partner API
 * adapter this pushes the content first; without one the host has pasted it.
 */
export async function markPublished(listingId: number) {
  const db = getDb();
  const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
  if (!listing) return;
  const property = await db.select().from(properties).where(eq(properties.id, listing.propertyId)).get();
  if (!property) return;

  const content = effectiveContent(property, listing);
  await CHANNELS[listing.channel].pushContent?.(listing.listingUrl, content);
  await db
    .update(listings)
    .set({ publishedHash: contentHash(content), publishedAt: Date.now() })
    .where(eq(listings.id, listingId))
    .run();
  refresh();
}

export async function loadDemoData() {
  await seedDemo();
  redirect("/overview");
}

export async function removeSampleDataAction() {
  await removeSampleData();
  redirect("/overview");
}
