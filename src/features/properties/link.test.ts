import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.DATABASE_PATH = ":memory:";
vi.mock("server-only", () => ({}));

import { eq } from "drizzle-orm";
import { getDb, listings, properties } from "@/db";
import { airbnbListingId, findListingForPage, samePublicPage } from "./link";

const PAGE = "https://www.booking.com/hotel/fr/charmant-appartement.fr.html";

describe("airbnbListingId", () => {
  it("reads the number from an Airbnb listing address, whatever the country", () => {
    expect(airbnbListingId("https://www.airbnb.fr/rooms/1400000000000000001?guests=2")).toBe(
      "1400000000000000001",
    );
    expect(airbnbListingId("https://www.airbnb.co.uk/rooms/12345678/")).toBe("12345678");
  });

  it("answers nothing for other pages", () => {
    expect(airbnbListingId("https://www.airbnb.fr/hosting/listings")).toBeNull();
    expect(airbnbListingId("https://example.com/rooms/12345678")).toBeNull();
    expect(airbnbListingId("12345678")).toBeNull();
  });
});

describe("samePublicPage", () => {
  it("ignores the language in the file name, the query and the hash", () => {
    expect(samePublicPage(PAGE, "https://www.booking.com/hotel/fr/charmant-appartement.html")).toBe(true);
    expect(
      samePublicPage(
        PAGE,
        "https://www.booking.com/hotel/fr/charmant-appartement.en-gb.html?x=1#tab-reviews",
      ),
    ).toBe(true);
  });

  it("refuses another property, another site and text that is not an address", () => {
    expect(samePublicPage(PAGE, "https://www.booking.com/hotel/fr/autre-appartement.fr.html")).toBe(false);
    expect(samePublicPage(PAGE, "https://example.com/hotel/fr/charmant-appartement.fr.html")).toBe(false);
    expect(samePublicPage("", "")).toBe(false);
  });
});

describe("findListingForPage", () => {
  let mine: number;
  let other: number;

  beforeAll(async () => {
    const db = getDb();
    const add = async (name: string, listingUrl: string) => {
      const property = await db
        .insert(properties)
        .values({ name, icalToken: name, createdAt: Date.now() })
        .returning({ id: properties.id })
        .get();
      const listing = await db
        .insert(listings)
        .values({ propertyId: property.id, channel: "booking", listingUrl })
        .returning({ id: listings.id })
        .get();
      return listing.id;
    };
    mine = await add("Mine", PAGE);
    other = await add("Other", "https://www.booking.com/hotel/fr/autre-appartement.fr.html");
  });

  it("refuses a page that is none of the host's listings", async () => {
    expect(
      await findListingForPage("booking", "999999", "https://www.booking.com/hotel/fr/inconnu.html"),
    ).toBeUndefined();
  });

  it("does not guess between two listings when the page is not named", async () => {
    expect(await findListingForPage("booking", "14170621")).toBeUndefined();
  });

  it("recognises a listing by its saved address and remembers its number", async () => {
    const found = await findListingForPage("booking", "14170621", `${PAGE}#tab-reviews`);
    expect(found?.id).toBe(mine);
    const saved = await getDb().select().from(listings).where(eq(listings.id, mine)).get();
    expect(saved?.externalId).toBe("14170621");
    // Known by number from now on, whatever page is named.
    expect((await findListingForPage("booking", "14170621"))?.id).toBe(mine);
    expect(
      (await getDb().select().from(listings).where(eq(listings.id, other)).get())?.externalId,
    ).toBeNull();
  });
});
