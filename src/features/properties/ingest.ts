import "server-only";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, listings, OTA_CHANNELS, properties, type Property } from "@/db";
import { newToken } from "@/db/seed";

/**
 * A listing sent by the browser extension from the host's own listing editor.
 *
 * It creates the property the first time, so a new host starts from their
 * real listing rather than a blank form. For a listing Innkeep already knows
 * it only fills in what the host has not set here (an empty field, or one
 * still at its starting value), so details edited in Innkeep are never
 * overwritten. The editor's own wording is kept beside the listing as
 * reference.
 */

const time = z.string().regex(/^\d{2}:\d{2}$/);

export const listingSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  listingId: z.string().trim().min(3).max(40),
  /** Missing on editor tabs that do not show the title. */
  title: z.string().trim().min(1).max(255).optional(),
  maxGuests: z.number().int().min(1).max(50).nullish(),
  listingUrl: z.url().max(500),
  description: z.string().trim().max(5000).optional(),
  address: z.string().trim().max(300).optional(),
  bedrooms: z.number().int().min(0).max(50).optional(),
  bathrooms: z.number().int().min(0).max(50).optional(),
  checkInTime: time.optional(),
  checkOutTime: time.optional(),
  houseRules: z.string().trim().max(2000).optional(),
  /** Editor cards as shown: section to lines, heading first. */
  details: z.record(z.string().max(40), z.array(z.string().max(200)).max(12)).optional(),
});

export type ListingInput = z.infer<typeof listingSchema>;
export type ListingResult =
  | { status: "created" | "linked" | "known" | "updated"; propertyId: number }
  | { status: "unknown"; error: string };

/** Values a new property starts with; a field still holding one counts as not set. */
const STARTING = { maxGuests: 2, bedrooms: 1, bathrooms: 1, checkInTime: "15:00", checkOutTime: "11:00" };

/** The fields of `input` that the host has not set on `property` yet. */
function missingFacts(property: Property, input: ListingInput) {
  const facts: Partial<Property> = {};
  for (const key of ["description", "address", "houseRules"] as const) {
    if (input[key] && !property[key]) facts[key] = input[key];
  }
  for (const key of ["maxGuests", "bedrooms", "bathrooms"] as const) {
    const value = input[key];
    if (value != null && property[key] === STARTING[key] && value !== property[key]) facts[key] = value;
  }
  for (const key of ["checkInTime", "checkOutTime"] as const) {
    const value = input[key];
    if (value && property[key] === STARTING[key] && value !== property[key]) facts[key] = value;
  }
  return facts;
}

export function parseChannelDetails(stored: string | null): Record<string, string[]> {
  try {
    return stored ? (JSON.parse(stored) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export async function ingestListing(input: ListingInput): Promise<ListingResult> {
  const db = getDb();
  return await db.transaction(async (tx): Promise<ListingResult> => {
    /** Fills in missing facts and keeps the editor's cards; says whether anything changed. */
    const absorb = async (propertyId: number) => {
      const property = (await tx.select().from(properties).where(eq(properties.id, propertyId)).get())!;
      const facts = missingFacts(property, input);
      const hasFacts = Object.keys(facts).length > 0;
      if (hasFacts) await tx.update(properties).set(facts).where(eq(properties.id, propertyId)).run();

      const listing = (await tx
        .select()
        .from(listings)
        .where(and(eq(listings.propertyId, propertyId), eq(listings.channel, input.source)))
        .get())!;
      // The editor spreads its cards over tabs, so each visit adds to what is stored.
      const merged = JSON.stringify({ ...parseChannelDetails(listing.channelDetails), ...input.details });
      const hasDetails = input.details != null && merged !== listing.channelDetails;
      if (hasDetails) {
        await tx
          .update(listings)
          .set({ channelDetails: merged, channelDetailsAt: Date.now() })
          .where(eq(listings.id, listing.id))
          .run();
      }
      return hasFacts || hasDetails;
    };

    const known = await tx
      .select()
      .from(listings)
      .where(and(eq(listings.channel, input.source), eq(listings.externalId, input.listingId)))
      .get();
    if (known) {
      return { status: (await absorb(known.propertyId)) ? "updated" : "known", propertyId: known.propertyId };
    }
    if (!input.title) {
      return { status: "unknown", error: "Open this listing's details tab first, so Innkeep can add it." };
    }

    const link = { externalId: input.listingId, listingUrl: input.listingUrl };

    // A property with the same title that has no listing id for this channel yet: link it.
    const sameTitle = await tx.select().from(properties).where(eq(properties.title, input.title)).all();
    if (sameTitle.length === 1) {
      const propertyId = sameTitle[0].id;
      await tx
        .insert(listings)
        .values({ propertyId, channel: input.source, ...link })
        .onConflictDoUpdate({ target: [listings.propertyId, listings.channel], set: link })
        .run();
      await absorb(propertyId);
      return { status: "linked", propertyId };
    }

    const property = await tx
      .insert(properties)
      .values({
        name: input.title.split("|")[0].trim().slice(0, 60) || input.title,
        title: input.title,
        icalToken: newToken(),
        createdAt: Date.now(),
      })
      .returning({ id: properties.id })
      .get();
    await tx
      .insert(listings)
      .values({ propertyId: property.id, channel: input.source, ...link })
      .run();
    await absorb(property.id);
    return { status: "created", propertyId: property.id };
  });
}
