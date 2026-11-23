import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb, type Listing, listings, type OtaChannel } from "@/db";

/**
 * Whether two addresses are the same public Booking.com page. The language
 * in the file name ("….fr.html", "….en-gb.html") and anything after the path
 * do not count: the host may have pasted one and be reading another.
 */
export function samePublicPage(a: string, b: string): boolean {
  const page = (address: string) => {
    if (!URL.canParse(address)) return null;
    const url = new URL(address);
    if (url.hostname !== "www.booking.com") return null;
    return url.pathname.toLowerCase().replace(/(\.[a-z]{2}(-[a-z]{2})?)?\.html$/, "");
  };
  const [left, right] = [page(a), page(b)];
  return left !== null && left === right;
}

/**
 * An Airbnb listing's number, which its public address carries
 * ("https://www.airbnb.fr/rooms/123456"). Null for any other address.
 */
export function airbnbListingId(address: string): string | null {
  if (!URL.canParse(address)) return null;
  const url = new URL(address);
  if (!/(^|\.)airbnb\.[a-z.]+$/.test(url.hostname)) return null;
  return /^\/rooms\/(\d{3,20})(?:\/|$)/.exec(url.pathname)?.[1] ?? null;
}

/**
 * The listing a public page belongs to. Normally Innkeep already knows the
 * platform's number for it. Booking.com only reveals that number on the
 * extranet's reservations page, so a host who has not read that page yet has
 * a listing with an address and no number: it is then recognised by the
 * address the host saved, and the number is remembered from there on.
 * Anyone else's page matches nothing and is refused by the caller.
 */
export async function findListingForPage(
  source: OtaChannel,
  listingId: string,
  pageUrl?: string | null,
): Promise<Listing | undefined> {
  const db = getDb();
  const known = await db
    .select()
    .from(listings)
    .where(and(eq(listings.channel, source), eq(listings.externalId, listingId)))
    .get();
  if (known || source !== "booking") return known;

  const unlinked = await db
    .select()
    .from(listings)
    .where(and(eq(listings.channel, source), isNull(listings.externalId)))
    .all();
  const candidates = pageUrl
    ? unlinked.filter((listing) => samePublicPage(listing.listingUrl, pageUrl))
    : // An extension that does not say which page it read: only when there is no doubt.
      unlinked.filter((listing) => samePublicPage(listing.listingUrl, listing.listingUrl));
  if (candidates.length !== 1) return undefined;

  const [match] = candidates;
  await db.update(listings).set({ externalId: listingId }).where(eq(listings.id, match.id)).run();
  return { ...match, externalId: listingId };
}
