import "server-only";
import { getDb, listings, type OtaChannel } from "@/db";
import { today } from "@/lib/dates";

export type PlatformLink = { id: number; channel: OtaChannel; href: string };

/**
 * The host's own reservations page on each connected platform, opened on the
 * view that lists the most: finished stays as well as upcoming ones.
 */
export async function reservationLinks(): Promise<PlatformLink[]> {
  const now = today();
  return (
    (await getDb().select().from(listings).all())
      .flatMap((listing): PlatformLink[] => {
        if (listing.channel === "airbnb") {
          // Stay on the Airbnb domain the host uses (airbnb.fr, airbnb.co.uk…). The
          // "all" tab also lists finished stays, which become revenue history.
          const origin = URL.canParse(listing.listingUrl)
            ? new URL(listing.listingUrl).origin
            : "https://www.airbnb.com";
          return [{ id: listing.id, channel: listing.channel, href: `${origin}/hosting/reservations/all` }];
        }
        // Booking.com needs the property id, and only lists the dates asked for:
        // arrivals from today to the end of next year.
        if (!listing.externalId) return [];
        const query = new URLSearchParams({
          hotel_id: listing.externalId,
          date_type: "arrival",
          date_from: now,
          date_to: `${Number(now.slice(0, 4)) + 1}-12-31`,
        });
        return [
          {
            id: listing.id,
            channel: listing.channel,
            href: `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/search_reservations.html?${query}`,
          },
        ];
      })
      // One link per platform page: several Airbnb listings share one reservations page.
      .filter((link, index, all) => all.findIndex((other) => other.href === link.href) === index)
  );
}

/**
 * The host's own calendar on each connected platform, where the price of
 * every night is shown. Needs the platform's id for the listing.
 */
export async function calendarLinks(propertyId: number): Promise<PlatformLink[]> {
  return (await getDb().select().from(listings).all())
    .filter((listing) => listing.propertyId === propertyId && listing.externalId)
    .map((listing) => {
      const origin = URL.canParse(listing.listingUrl)
        ? new URL(listing.listingUrl).origin
        : "https://www.airbnb.com";
      const href =
        listing.channel === "airbnb"
          ? `${origin}/multicalendar/${listing.externalId}`
          : `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/calendar/index.html?hotel_id=${listing.externalId}`;
      return { id: listing.id, channel: listing.channel, href };
    });
}

/**
 * The public page of a property on each platform for given dates, as a guest
 * sees it. Airbnb needs the listing's id; Booking.com needs the listing page
 * address saved on the property page.
 */
export async function guestViewLinks(
  propertyId: number,
  checkIn: string,
  checkOut: string,
  adults: number,
): Promise<Partial<Record<OtaChannel, string>>> {
  const links: Partial<Record<OtaChannel, string>> = {};
  for (const listing of await getDb().select().from(listings).all()) {
    if (listing.propertyId !== propertyId) continue;
    const url = URL.canParse(listing.listingUrl) ? new URL(listing.listingUrl) : null;
    if (listing.channel === "airbnb" && listing.externalId) {
      const query = new URLSearchParams({ check_in: checkIn, check_out: checkOut, adults: String(adults) });
      links.airbnb = `${url?.origin ?? "https://www.airbnb.com"}/rooms/${listing.externalId}?${query}`;
    }
    if (
      listing.channel === "booking" &&
      url?.hostname === "www.booking.com" &&
      url.pathname.startsWith("/hotel/")
    ) {
      const query = new URLSearchParams({
        checkin: checkIn,
        checkout: checkOut,
        group_adults: String(adults),
        group_children: "0",
        no_rooms: "1",
      });
      links.booking = `${url.origin}${url.pathname}?${query}`;
    }
  }
  return links;
}

/** The public page of a property on each platform, with no dates: the listing itself. */
export async function publicPageLinks(propertyId: number): Promise<Partial<Record<OtaChannel, string>>> {
  const links: Partial<Record<OtaChannel, string>> = {};
  for (const listing of await getDb().select().from(listings).all()) {
    if (listing.propertyId !== propertyId) continue;
    const url = URL.canParse(listing.listingUrl) ? new URL(listing.listingUrl) : null;
    if (listing.channel === "airbnb" && listing.externalId) {
      links.airbnb = `${url?.origin ?? "https://www.airbnb.com"}/rooms/${listing.externalId}`;
    }
    if (
      listing.channel === "booking" &&
      url?.hostname === "www.booking.com" &&
      url.pathname.startsWith("/hotel/")
    ) {
      links.booking = `${url.origin}${url.pathname}`;
    }
  }
  return links;
}

/** The public page of a property on each platform, opened on its list of reviews. */
export async function reviewPageLinks(propertyId: number): Promise<Partial<Record<OtaChannel, string>>> {
  const pages = await publicPageLinks(propertyId);
  return {
    ...(pages.airbnb ? { airbnb: `${pages.airbnb}/reviews` } : {}),
    // The query part makes this a different address from the listing itself, so a
    // browser already on the listing loads the page again and opens the reviews.
    ...(pages.booking ? { booking: `${pages.booking}?tab=reviews#tab-reviews` } : {}),
  };
}
