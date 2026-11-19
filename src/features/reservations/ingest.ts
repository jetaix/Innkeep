import "server-only";
import { and, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, listings, OTA_CHANNELS, properties, reservations, type Reservation } from "@/db";
import { today } from "@/lib/dates";

/**
 * Details sent by the Innkeep browser extension from the host's own
 * reservations page.
 *
 * The calendar feed stays the source of truth for which current and future
 * stays exist and on which dates. Rows from the extension add what the feed
 * lacks (guest name, payout, confirmation code, booking date) to a stay the
 * feed already produced, and confirm that closed dates on Booking.com are a
 * real booking. An upcoming row that matches nothing is reported back, never
 * inserted, so a misread row cannot block dates.
 *
 * Finished stays are the exception: the feed no longer lists them, so a
 * finished, uncancelled row is added as history. It cannot affect
 * availability and gives the revenue pages their past.
 */

export const ingestSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  /** The channel's id for the listing these rows belong to, when the page shows one. */
  listingId: z.string().trim().max(40).nullish(),
  reservations: z
    .array(
      z.object({
        code: z.string().trim().min(4).max(40),
        checkIn: z.iso.date(),
        checkOut: z.iso.date(),
        guestName: z.string().trim().max(120).default(""),
        guests: z.number().int().min(1).max(50).nullish(),
        /** Host payout in minor units (cents). */
        payout: z.number().int().min(0).nullish(),
        listingName: z.string().trim().max(300).default(""),
        status: z.enum(["confirmed", "cancelled"]).default("confirmed"),
        /** The status as the page words it. */
        statusText: z.string().trim().max(80).default(""),
        bookedOn: z.iso.date().nullish(),
        /** Booking.com only: price before commission, and the commission and fees. */
        price: z.number().int().min(0).nullish(),
        fees: z.number().int().min(0).nullish(),
        /** Booking.com only: the room type booked. */
        room: z.string().trim().max(200).nullish(),
      }),
    )
    .max(200),
});

export type IngestPayload = z.infer<typeof ingestSchema>;
/** As posted: fields with a default may be left out. */
export type IngestInput = z.input<typeof ingestSchema>;
export type IngestResult = {
  updated: number;
  unchanged: number;
  /** Finished stays added as history. */
  added: number;
  /** Rows the platform marks as cancelled. Kept as cancelled stays, which block nothing and earn nothing. */
  cancelled: number;
  unmatched: string[];
};

type Details = Pick<
  Reservation,
  | "kind"
  | "externalCode"
  | "guests"
  | "amount"
  | "bookedOn"
  | "channelStatus"
  | "grossAmount"
  | "channelFees"
  | "unitName"
>;

/**
 * What to write on a stay Innkeep already has. A name the host typed is kept;
 * what the platform states wins otherwise, and a value this page does not
 * show never erases one already stored.
 */
function withStored(details: Details, stay: Reservation, guestName = "") {
  return {
    ...details,
    guestName: stay.guestName || guestName,
    guests: details.guests ?? stay.guests,
    amount: details.amount ?? stay.amount,
    bookedOn: details.bookedOn ?? stay.bookedOn,
    channelStatus: details.channelStatus ?? stay.channelStatus,
    grossAmount: details.grossAmount ?? stay.grossAmount,
    channelFees: details.channelFees ?? stay.channelFees,
    unitName: details.unitName ?? stay.unitName,
  };
}

const normalise = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

export function ingestReservations(input: IngestInput): IngestResult {
  const { source, listingId, reservations: rows } = ingestSchema.parse(input);
  const db = getDb();
  const result: IngestResult = { updated: 0, unchanged: 0, added: 0, cancelled: 0, unmatched: [] };
  const now = today();

  // Listing titles as the channel shows them, to tell properties apart when dates collide.
  const titles = db
    .select({
      propertyId: properties.id,
      title: properties.title,
      name: properties.name,
      override: listings.titleOverride,
    })
    .from(properties)
    .leftJoin(listings, and(eq(listings.propertyId, properties.id), eq(listings.channel, source)))
    .all();

  // When this listing id is already known, only that property's stays can match.
  const knownListing = listingId
    ? db
        .select()
        .from(listings)
        .where(and(eq(listings.channel, source), eq(listings.externalId, listingId)))
        .get()
    : undefined;
  const matchedProperties = new Set<number>();

  /** The property a finished stay belongs to, when there is no doubt about it. */
  const propertyFor = (listingName: string): number | null => {
    if (knownListing) return knownListing.propertyId;
    // A page that names no listing (Booking.com shows one property at a time)
    // can only mean the single property there is.
    if (!listingName) return titles.length === 1 ? titles[0].propertyId : null;
    const listing = normalise(listingName);
    const named = titles.filter((title) =>
      [title.override, title.title, title.name].some(
        (candidate) => candidate && listing.includes(normalise(candidate)),
      ),
    );
    return named.length === 1 ? named[0].propertyId : null;
  };

  db.transaction((tx) => {
    for (const row of rows) {
      // Extension versions before 0.4 sent no status; a payout of zero is what a cancelled row shows.
      const cancelled = row.status === "cancelled" || row.payout === 0;
      const details = {
        kind: "reservation" as const,
        externalCode: row.code,
        guests: row.guests ?? null,
        amount: cancelled ? 0 : (row.payout ?? null),
        bookedOn: row.bookedOn ?? null,
        channelStatus: row.statusText || null,
        grossAmount: row.price ?? null,
        channelFees: row.fees ?? null,
        unitName: row.listingName || row.room || null,
      };

      if (cancelled) {
        // Only its own code may match a cancelled row: its dates often belong to the booking that replaced it.
        const known = tx
          .select()
          .from(reservations)
          .where(and(eq(reservations.source, source), eq(reservations.externalCode, row.code)))
          .get();
        const propertyId = known?.propertyId ?? propertyFor(row.listingName);
        if (known) {
          tx.update(reservations)
            .set({ ...withStored(details, known), status: "cancelled" })
            .where(eq(reservations.id, known.id))
            .run();
        } else if (propertyId != null) {
          tx.insert(reservations)
            .values({
              ...details,
              propertyId,
              source,
              status: "cancelled",
              guestName: row.guestName,
              checkIn: row.checkIn,
              checkOut: row.checkOut,
              createdAt: Date.now(),
            })
            .run();
        }
        result.cancelled++;
        continue;
      }

      // Any kind: a Booking.com stay arrives from the feed as closed dates.
      const fromSource = eq(reservations.source, source);

      // 1. The confirmation code: stored from an earlier run, or inside the feed's reservation link.
      let matches = tx
        .select()
        .from(reservations)
        .where(
          and(
            fromSource,
            or(eq(reservations.externalCode, row.code), like(reservations.channelInfo, `%/${row.code}%`)),
          ),
        )
        .all();

      // 2. Otherwise the same dates on that channel (Booking.com feeds carry no code).
      if (matches.length === 0) {
        matches = tx
          .select()
          .from(reservations)
          .where(
            and(
              fromSource,
              eq(reservations.status, "confirmed"),
              eq(reservations.checkIn, row.checkIn),
              eq(reservations.checkOut, row.checkOut),
            ),
          )
          .all();
        if (knownListing) matches = matches.filter((match) => match.propertyId === knownListing.propertyId);
        if (matches.length > 1 && row.listingName) {
          const listing = normalise(row.listingName);
          matches = matches.filter((match) =>
            titles.some(
              (title) =>
                title.propertyId === match.propertyId &&
                [title.override, title.title, title.name].some(
                  (candidate) => candidate && listing.includes(normalise(candidate)),
                ),
            ),
          );
        }
      }

      if (matches.length !== 1) {
        const propertyId = matches.length === 0 && row.checkOut <= now ? propertyFor(row.listingName) : null;
        if (propertyId == null) {
          result.unmatched.push(row.code);
          continue;
        }
        tx.insert(reservations)
          .values({
            ...details,
            propertyId,
            source,
            guestName: row.guestName,
            checkIn: row.checkIn,
            checkOut: row.checkOut,
            createdAt: Date.now(),
          })
          .run();
        matchedProperties.add(propertyId);
        result.added++;
        continue;
      }

      const stay = matches[0];
      matchedProperties.add(stay.propertyId);
      // The platform lists it as a live booking, so a stay once stored as cancelled is one again.
      const changes = { ...withStored(details, stay, row.guestName), status: "confirmed" as const };
      const changed = (Object.keys(changes) as (keyof typeof changes)[]).some(
        (key) => changes[key] !== stay[key],
      );
      if (!changed) {
        result.unchanged++;
        continue;
      }
      tx.update(reservations).set(changes).where(eq(reservations.id, stay.id)).run();
      result.updated++;
    }

    // Remember which property this listing id belongs to once the rows agree on one.
    if (listingId && !knownListing && matchedProperties.size === 1) {
      const [propertyId] = matchedProperties;
      tx.update(listings)
        .set({ externalId: listingId })
        .where(and(eq(listings.propertyId, propertyId), eq(listings.channel, source)))
        .run();
    }
  });

  return result;
}
