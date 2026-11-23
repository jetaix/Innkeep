import "server-only";
import { CHANNELS } from "@/channels";
import { getDb, listings } from "@/db";
import {
  calendarLinks,
  publicPageLinks,
  reservationLinks,
  reviewPageLinks,
} from "@/features/reservations/platform-links";
import { getProperties } from "@/features/reservations/queries";

export type TourStep = { url: string; label: string };

/**
 * Editor sections of an Airbnb listing that describe the place, in the order
 * the editor lists them. The same list as `LISTING_SECTIONS` in the
 * extension, which refuses any other section.
 */
const EDITOR_SECTIONS: ["details" | "arrival", string][] = [
  ["details", "photo-tour"],
  ["details", "property-type"],
  ["details", "sleeping-arrangements"],
  ["details", "pricing"],
  ["details", "discounts"],
  ["details", "availability"],
  ["details", "instant-book"],
  ["details", "amenities"],
  ["details", "accessibility"],
  ["details", "house-rules"],
  ["details", "guest-safety"],
  ["details", "cancellation-policy"],
  ["arrival", "check-in-out"],
];

/**
 * The pages a run of the extension goes through, in order. Innkeep decides
 * the list, so the extension never has to guess an address: every one is a
 * page of the host's own listings. "reservations" is the quick run; "all"
 * adds calendars, the listing editor, the extranet and the public pages.
 * On Booking.com the extranet's own menu adds its property pages during the run.
 */
export async function tourSteps(scope: "reservations" | "all"): Promise<TourStep[]> {
  const steps: TourStep[] = (await reservationLinks()).map((link) => ({
    url: link.href,
    label: `${CHANNELS[link.channel].label}: reservations`,
  }));
  if (scope === "reservations") return steps;

  const allListings = await getDb().select().from(listings).all();
  for (const property of await getProperties()) {
    for (const link of await calendarLinks(property.id)) {
      steps.push({ url: link.href, label: `${CHANNELS[link.channel].label}: calendar and prices` });
    }

    const airbnb = allListings.find(
      (listing) => listing.propertyId === property.id && listing.channel === "airbnb" && listing.externalId,
    );
    if (airbnb) {
      const origin = URL.canParse(airbnb.listingUrl)
        ? new URL(airbnb.listingUrl).origin
        : "https://www.airbnb.com";
      const editor = `${origin}/hosting/listings/editor/${airbnb.externalId}`;
      steps.push({ url: `${editor}/details`, label: "Airbnb: listing editor" });
      for (const [tab, section] of EDITOR_SECTIONS) {
        steps.push({ url: `${editor}/${tab}/${section}`, label: `Airbnb: ${section.replaceAll("-", " ")}` });
      }
    }

    const booking = allListings.find(
      (listing) => listing.propertyId === property.id && listing.channel === "booking" && listing.externalId,
    );
    if (booking) {
      // A first extranet page; its menu tells the run which other property pages exist.
      steps.push({
        url: `https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/photos.html?hotel_id=${booking.externalId}`,
        label: "Booking.com: photos",
      });
    }

    const pages = await publicPageLinks(property.id);
    const reviews = await reviewPageLinks(property.id);
    for (const channel of ["airbnb", "booking"] as const) {
      const label = CHANNELS[channel].label;
      if (pages[channel]) steps.push({ url: pages[channel], label: `${label}: public listing` });
      if (reviews[channel]) steps.push({ url: reviews[channel], label: `${label}: reviews` });
    }
  }
  return steps;
}
