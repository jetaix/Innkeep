import { describe, expect, it } from "vitest";

process.env.DATABASE_PATH = ":memory:";

import { charges, getDb, listings, properties, reservations } from "@/db";
import { hasSampleData, newToken, removeSampleData, seedDemo } from "./seed";

const count = (table: typeof properties | typeof reservations | typeof charges) =>
  getDb().select().from(table).all().length;

describe("sample data", () => {
  it("is flagged while loaded and leaves real properties alone when removed", async () => {
    expect(hasSampleData()).toBe(false);
    await seedDemo();
    expect(hasSampleData()).toBe(true);
    expect(count(properties)).toBe(3);

    // A property the host added themselves, with a real calendar link.
    const db = getDb();
    const own = db
      .insert(properties)
      .values({ name: "My flat", icalToken: newToken(), createdAt: Date.now() })
      .returning({ id: properties.id })
      .get();
    db.insert(listings)
      .values({ propertyId: own.id, channel: "airbnb", icalUrl: "https://example.test/calendar.ics" })
      .run();

    removeSampleData();
    expect(hasSampleData()).toBe(false);
    expect(db.select({ name: properties.name }).from(properties).all()).toEqual([{ name: "My flat" }]);
    expect(count(reservations)).toBe(0);
    // Shared charges stay, because a real property still uses them.
    expect(count(charges)).toBeGreaterThan(0);
  });

  it("clears shared sample charges once no property is left", async () => {
    const db = getDb();
    db.delete(properties).run();
    db.delete(charges).run();
    await seedDemo();
    removeSampleData();
    expect(count(properties)).toBe(0);
    expect(count(charges)).toBe(0);
  });
});
