import { describe, expect, it, vi } from "vitest";

process.env.DATABASE_PATH = ":memory:";
vi.mock("server-only", () => ({}));

import { eq } from "drizzle-orm";
import { getDb, listings, properties } from "@/db";
import { ingestListing } from "./ingest";

const listing = {
  source: "airbnb" as const,
  listingId: "1400000000000000001",
  title: "Sea view flat | Old town",
  maxGuests: 2,
  listingUrl: "https://www.airbnb.com/rooms/1400000000000000001",
};

describe("ingestListing", () => {
  it("creates the property from a listing it has not seen", () => {
    const result = ingestListing(listing);
    expect(result.status).toBe("created");
    const property = getDb().select().from(properties).all()[0];
    expect(property).toMatchObject({ name: "Sea view flat", title: listing.title, maxGuests: 2 });
    expect(getDb().select().from(listings).all()[0]).toMatchObject({
      channel: "airbnb",
      externalId: listing.listingId,
      listingUrl: listing.listingUrl,
    });
  });

  it("leaves a known listing untouched, even if the host renamed the property here", () => {
    getDb().update(properties).set({ name: "My flat", maxGuests: 3 }).run();
    const result = ingestListing({ ...listing, title: "Changed on Airbnb", maxGuests: 4 });
    expect(result.status).toBe("known");
    expect(getDb().select().from(properties).all()).toHaveLength(1);
    expect(getDb().select().from(properties).all()[0]).toMatchObject({ name: "My flat", maxGuests: 3 });
  });

  it("links the same property when it is also listed on the other channel under the same title", () => {
    const result = ingestListing({ ...listing, source: "booking", listingId: "14170000" });
    expect(result.status).toBe("linked");
    expect(getDb().select().from(properties).all()).toHaveLength(1);
    expect(getDb().select().from(listings).all()).toHaveLength(2);
  });

  it("fills in what the host has not set, and keeps the editor's cards", () => {
    const db = getDb();
    db.update(properties).set({ checkOutTime: "12:00" }).run();
    const result = ingestListing({
      source: "airbnb",
      listingId: listing.listingId,
      listingUrl: listing.listingUrl,
      description: "Quiet flat near the harbour.",
      address: "1 Example Street",
      bedrooms: 2,
      checkInTime: "16:00",
      checkOutTime: "10:00",
      details: { pricing: ["Pricing", "55 € – 300 € per night"] },
    });
    expect(result.status).toBe("updated");
    expect(db.select().from(properties).all()[0]).toMatchObject({
      name: "My flat",
      maxGuests: 3,
      description: "Quiet flat near the harbour.",
      address: "1 Example Street",
      bedrooms: 2,
      checkInTime: "16:00",
      // Set by the host above, so the platform's value does not replace it.
      checkOutTime: "12:00",
    });

    // A later visit to another editor tab adds cards and leaves the first ones.
    ingestListing({
      source: "airbnb",
      listingId: listing.listingId,
      listingUrl: listing.listingUrl,
      details: { "house-rules": ["House rules", "No pets"] },
    });
    const stored = db.select().from(listings).where(eq(listings.channel, "airbnb")).get()!;
    expect(JSON.parse(stored.channelDetails!)).toEqual({
      pricing: ["Pricing", "55 € – 300 € per night"],
      "house-rules": ["House rules", "No pets"],
    });
  });

  it("asks for the details tab when it meets an unknown listing without a title", () => {
    const result = ingestListing({
      source: "airbnb",
      listingId: "1400000000000000099",
      listingUrl: "https://www.airbnb.com/rooms/1400000000000000099",
    });
    expect(result.status).toBe("unknown");
    expect(getDb().select().from(properties).all()).toHaveLength(1);
  });
});
