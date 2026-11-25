import { and, eq, gt, isNotNull, ne, sql } from "drizzle-orm";
import { getDb, listings, properties, reservations, type OtaChannel } from "@/db";
import { recordReservationEvent } from "@/features/notifications/record";
import { addDays, today } from "@/lib/dates";
import { parseICal, type CalendarEvent } from "@/lib/ical";
import { CHANNELS, sourceLabel } from "./index";
import { DEMO_SCHEME, demoFeed } from "./demo";

export type SyncResult = { ok: true; imported: number; cancelled: number } | { ok: false; error: string };

/** Stays that ended more than this many days ago are not imported. */
const HISTORY_DAYS = 30;

async function loadFeed(url: string): Promise<string> {
  if (url.startsWith(DEMO_SCHEME)) return demoFeed(url);
  if (!/^https?:\/\//i.test(url)) throw new Error("The iCal URL must start with http:// or https://");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(20_000),
    headers: { "User-Agent": "Innkeep calendar sync", Accept: "text/calendar, text/plain, */*" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`The channel answered ${response.status} ${response.statusText}`);
  return response.text();
}

/**
 * A connection that drops once (wifi waking up, a brief outage) is tried
 * again after a moment, so it does not show up as a failed sync. An answer
 * from the channel, even an error, is final.
 */
async function loadFeedPatiently(url: string): Promise<string> {
  try {
    return await loadFeed(url);
  } catch (cause) {
    const network = cause instanceof TypeError || (cause instanceof Error && cause.name === "TimeoutError");
    if (!network) throw cause;
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    return loadFeed(url);
  }
}

/**
 * Imports one listing's iCal feed.
 *
 * - Events are matched to reservations by UID, so changed dates update in place.
 * - Upcoming reservations that disappeared from the feed are marked cancelled.
 * - Guest names and notes typed in Innkeep are never overwritten.
 */
export async function syncListing(listingId: number): Promise<SyncResult> {
  const db = getDb();
  const listing = await db.select().from(listings).where(eq(listings.id, listingId)).get();
  if (!listing) return { ok: false, error: "Listing not found" };
  if (!listing.icalUrl) return { ok: false, error: "No iCal URL configured" };

  let events: CalendarEvent[];
  try {
    events = parseICal(await loadFeedPatiently(listing.icalUrl));
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : String(cause);
    await db.update(listings).set({ lastSyncError: error }).where(eq(listings.id, listingId)).run();
    return { ok: false, error };
  }

  const adapter = CHANNELS[listing.channel];
  const now = today();
  const cutoff = addDays(now, -HISTORY_DAYS);
  const relevant = events.filter((event) => event.end > cutoff);
  const seen = new Set(relevant.map((event) => event.uid));
  let cancelled = 0;

  await db.transaction(async (tx) => {
    // How each stay stood before this import, to tell the host what changed.
    const stored = await tx
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, listing.propertyId),
          eq(reservations.source, listing.channel),
          isNotNull(reservations.externalUid),
        ),
      )
      .all();
    const before = new Map(stored.map((row) => [row.externalUid, row]));

    for (const event of relevant) {
      const { kind, channelInfo } = adapter.classifyEvent(event);
      const saved = await tx
        .insert(reservations)
        .values({
          propertyId: listing.propertyId,
          source: listing.channel,
          kind,
          externalUid: event.uid,
          checkIn: event.start,
          checkOut: event.end,
          channelInfo,
          createdAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: [reservations.propertyId, reservations.source, reservations.externalUid],
          set: {
            // A stay the extension confirmed as a reservation stays one.
            kind: sql`CASE WHEN ${reservations.externalCode} IS NOT NULL THEN ${reservations.kind} ELSE ${kind} END`,
            checkIn: event.start,
            checkOut: event.end,
            channelInfo,
            status: "confirmed",
          },
        })
        .returning()
        .get();
      await recordReservationEvent(tx, saved, before.get(event.uid) ?? null, saved, now);
    }

    const upcoming = await tx
      .select({ id: reservations.id, uid: reservations.externalUid })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, listing.propertyId),
          eq(reservations.source, listing.channel),
          eq(reservations.status, "confirmed"),
          isNotNull(reservations.externalUid),
          gt(reservations.checkOut, now),
        ),
      )
      .all();
    for (const row of upcoming) {
      if (seen.has(row.uid!)) continue;
      await tx.update(reservations).set({ status: "cancelled" }).where(eq(reservations.id, row.id)).run();
      const was = before.get(row.uid);
      if (was) await recordReservationEvent(tx, was, was, { ...was, status: "cancelled" }, now);
      cancelled++;
    }

    await tx
      .update(listings)
      .set({ lastSyncedAt: Date.now(), lastSyncError: null })
      .where(eq(listings.id, listingId))
      .run();
  });

  return { ok: true, imported: relevant.length, cancelled };
}

export async function syncAll(): Promise<{ synced: number; failed: number }> {
  const rows = await (await getDb())
    .select({ id: listings.id })
    .from(listings)
    .where(ne(listings.icalUrl, ""))
    .all();
  const results = await Promise.all(rows.map((row) => syncListing(row.id)));
  const failed = results.filter((result) => !result.ok).length;
  return { synced: results.length - failed, failed };
}

/**
 * Builds the feed a channel should import: every confirmed stay on the
 * property that did NOT come from that channel. Excluding the channel's own
 * bookings avoids echoing them back as blocks.
 */
export async function exportEvents(
  propertyId: number,
  forChannel: OtaChannel | "all",
): Promise<CalendarEvent[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.propertyId, propertyId),
        eq(reservations.status, "confirmed"),
        gt(reservations.checkOut, addDays(today(), -1)),
      ),
    )
    .all();

  return rows
    .filter((row) => forChannel === "all" || row.source !== forChannel)
    .map((row) => ({
      uid: `innkeep-${row.id}@innkeep`,
      start: row.checkIn,
      end: row.checkOut,
      // Guest names stay private: the URL is unguessable but still a bearer link.
      summary: row.kind === "block" ? "Blocked" : `Reserved (${sourceLabel(row.source)})`,
      description: "",
    }));
}

export async function findPropertyByToken(token: string) {
  return await getDb().select().from(properties).where(eq(properties.icalToken, token)).get();
}
