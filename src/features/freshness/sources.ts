import "server-only";
import { getDb, listings, nightlyPrices, reviews, type OtaChannel } from "@/db";
import { getExtensionStatus, getLastUpdate } from "@/features/extension/status";
import { aiConfigured } from "@/features/insights/ai";
import { getAdvice } from "@/features/insights/queries";
import { getPricing } from "@/features/pricing/queries";
import { getPages } from "@/features/properties/pages";
import {
  calendarLinks,
  publicPageLinks,
  reservationLinks,
  reviewPageLinks,
} from "@/features/reservations/platform-links";
import { getProperties } from "@/features/reservations/queries";
import { freshness, type Freshness, type SourceKind } from "./state";

/**
 * Every piece of data Innkeep holds that comes from somewhere else, with its
 * age and the one action that brings it up to date. This is the single place
 * that knows them all: the Data page lists it, the sidebar counts it.
 */
export type DataSource = {
  id: string;
  kind: SourceKind;
  /** Null for data that belongs to the whole account rather than one property. */
  propertyId: number | null;
  channel: OtaChannel | null;
  at: number | null;
  state: Freshness;
  /** Innkeep refreshes it by itself; the action is only a shortcut. */
  automatic: boolean;
  /** The last attempt failed with this message (calendar links only). */
  error?: string | null;
  /** For guest prices: sample stays checked, out of those proposed. */
  progress?: { done: number; total: number };
  action:
    | { type: "open"; href: string }
    | { type: "sync"; listingId: number }
    | { type: "go"; href: string }
    /** Nothing to press yet, and why. */
    /** Done from the extension's own popup ("Read everything"), not from a link. */
    | { type: "popup" }
    | { type: "blocked"; reason: "extension" | "listingId" | "listingUrl" | "calendarLink" | "claude" };
};

export async function getDataSources(now = Date.now()): Promise<DataSource[]> {
  const db = getDb();
  const extension = await getExtensionStatus();
  const extensionReady = extension.state === "ready" || extension.state === "outdated";
  const properties = await getProperties();
  const allListings = await db.select().from(listings).all();
  const priceRows = await db.select().from(nightlyPrices).all();
  const reviewRows = await db.select().from(reviews).all();
  const sources: DataSource[] = [];

  /** A page the extension reads when the host opens it. */
  const open = (href: string | undefined, missing: "listingId" | "listingUrl"): DataSource["action"] =>
    !extensionReady
      ? { type: "blocked", reason: "extension" }
      : href
        ? { type: "open", href }
        : { type: "blocked", reason: missing };

  // Reservations: one page per platform, shared by every property on it.
  const reservationPages = await reservationLinks();
  for (const channel of ["airbnb", "booking"] as const) {
    if (!allListings.some((listing) => listing.channel === channel)) continue;
    const at = (await getLastUpdate(channel))?.at ?? null;
    sources.push({
      id: `reservations:${channel}`,
      kind: "reservations",
      propertyId: null,
      channel,
      at,
      state: freshness(at, "reservations", now),
      automatic: false,
      action: open(reservationPages.find((link) => link.channel === channel)?.href, "listingId"),
    });
  }

  for (const property of properties) {
    const own = allListings.filter((listing) => listing.propertyId === property.id);
    const calendars = await calendarLinks(property.id);
    const publicPages = await publicPageLinks(property.id);
    const reviewPages = await reviewPageLinks(property.id);
    const pricing = await getPricing(property.id);

    for (const listing of own) {
      const { channel } = listing;
      const id = (kind: SourceKind) => `${kind}:${property.id}:${channel}`;
      const base = { propertyId: property.id, channel };

      // Calendar link: imported in the background and whenever the app is opened.
      sources.push({
        ...base,
        id: id("calendar"),
        kind: "calendar",
        at: listing.lastSyncedAt,
        state: listing.lastSyncError ? "stale" : freshness(listing.lastSyncedAt, "calendar", now),
        automatic: true,
        error: listing.lastSyncError,
        action: listing.icalUrl
          ? { type: "sync", listingId: listing.id }
          : { type: "blocked", reason: "calendarLink" },
      });

      // Nightly prices from the platform's calendar.
      const seen = priceRows
        .filter((row) => row.propertyId === property.id && row.source === channel)
        .map((row) => row.seenAt);
      const pricesAt = seen.length ? Math.max(...seen) : null;
      sources.push({
        ...base,
        id: id("prices"),
        kind: "prices",
        at: pricesAt,
        state: freshness(pricesAt, "prices", now),
        automatic: false,
        action: open(calendars.find((link) => link.channel === channel)?.href, "listingId"),
      });

      // What a guest pays: current only when every sample stay has a recent check.
      const checks = pricing.guestChecks.map((check) => check.quotes[channel]?.seenAt ?? null);
      const done = checks.filter((at) => at != null);
      const oldest = done.length ? Math.min(...done) : null;
      if (checks.length > 0) {
        const complete = done.length === checks.length;
        sources.push({
          ...base,
          id: id("guestPrices"),
          kind: "guestPrices",
          at: oldest,
          state: oldest == null ? "never" : complete ? freshness(oldest, "guestPrices", now) : "stale",
          automatic: false,
          progress: { done: done.length, total: checks.length },
          action: extensionReady
            ? { type: "go", href: "/pricing" }
            : { type: "blocked", reason: "extension" },
        });
      }

      // The listing as guests see it.
      sources.push({
        ...base,
        id: id("preview"),
        kind: "preview",
        at: listing.publicPreviewAt,
        state: freshness(listing.publicPreviewAt, "preview", now),
        automatic: false,
        action: open(publicPages[channel], channel === "airbnb" ? "listingId" : "listingUrl"),
      });

      // Admin pages kept as shown: every amenity, photo, policy.
      const pagesSeen = (await getPages(listing.id)).map((page) => page.seenAt);
      const pagesAt = pagesSeen.length ? Math.min(...pagesSeen) : null;
      sources.push({
        ...base,
        id: id("adminPages"),
        kind: "adminPages",
        at: pagesAt,
        state: freshness(pagesAt, "adminPages", now),
        automatic: false,
        progress: pagesSeen.length ? { done: pagesSeen.length, total: pagesSeen.length } : undefined,
        action: !extensionReady
          ? { type: "blocked", reason: "extension" }
          : listing.externalId
            ? { type: "popup" }
            : { type: "blocked", reason: "listingId" },
      });

      // Guest reviews and the host's replies.
      const reviewSeen = reviewRows
        .filter((row) => row.propertyId === property.id && row.source === channel)
        .map((row) => row.seenAt);
      const reviewsAt = reviewSeen.length ? Math.max(...reviewSeen) : null;
      sources.push({
        ...base,
        id: id("reviews"),
        kind: "reviews",
        at: reviewsAt,
        state: freshness(reviewsAt, "reviews", now),
        automatic: false,
        action: open(reviewPages[channel], channel === "airbnb" ? "listingId" : "listingUrl"),
      });

      // The listing's settings, from Airbnb's editor (Booking.com's is not read).
      if (channel === "airbnb") {
        const origin = URL.canParse(listing.listingUrl)
          ? new URL(listing.listingUrl).origin
          : "https://www.airbnb.com";
        sources.push({
          ...base,
          id: id("listingDetails"),
          kind: "listingDetails",
          at: listing.channelDetailsAt,
          state: freshness(listing.channelDetailsAt, "listingDetails", now),
          automatic: false,
          action: open(
            listing.externalId
              ? `${origin}/hosting/listings/editor/${listing.externalId}/details`
              : undefined,
            "listingId",
          ),
        });
      }
    }
  }

  // Claude's advice, written from all of the above.
  const advice = await getAdvice();
  sources.push({
    id: "advice",
    kind: "advice",
    propertyId: null,
    channel: null,
    at: advice?.generatedAt ?? null,
    state: freshness(advice?.generatedAt ?? null, "advice", now),
    automatic: false,
    action: (await aiConfigured())
      ? { type: "go", href: "/assistant" }
      : { type: "blocked", reason: "claude" },
  });

  return sources;
}

/**
 * Sources the host can and should refresh now. Things never set up (no
 * extension, no Claude) and data that refreshes itself are left out, so the
 * count only ever asks for something that one click fixes.
 */
export function countToRefresh(sources: DataSource[]): number {
  return sources.filter(
    (source) =>
      source.state !== "fresh" &&
      source.action.type !== "blocked" &&
      source.action.type !== "popup" &&
      source.kind !== "advice" &&
      (!source.automatic || Boolean(source.error)),
  ).length;
}

const DAY_MS = 24 * 60 * 60_000;

/**
 * Sources the host can refresh that were never read or are more than a day
 * old, whatever their own limit: the question Innkeep asks when it is opened.
 */
export function olderThanADay(sources: DataSource[], now = Date.now()): DataSource[] {
  return sources.filter(
    (source) =>
      !source.automatic &&
      source.kind !== "advice" &&
      source.action.type !== "blocked" &&
      (source.at == null || now - source.at > DAY_MS),
  );
}
