import { createHash } from "node:crypto";
import type { Listing, Property } from "@/db/schema";
import type { ListingContent } from "./index";

/** The content a channel should show: the master copy plus that channel's overrides. */
export function effectiveContent(property: Property, listing?: Listing | null): ListingContent {
  return {
    title: listing?.titleOverride || property.title,
    description: listing?.descriptionOverride || property.description,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    basePrice: property.basePrice,
    currency: property.currency,
    checkInTime: property.checkInTime,
    checkOutTime: property.checkOutTime,
    houseRules: property.houseRules,
  };
}

export function contentHash(content: ListingContent): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

export type PublishState = "never" | "current" | "outdated";

export function publishState(property: Property, listing: Listing): PublishState {
  if (!listing.publishedHash) return "never";
  return listing.publishedHash === contentHash(effectiveContent(property, listing)) ? "current" : "outdated";
}
