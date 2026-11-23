import { describe, expect, it } from "vitest";

process.env.DATABASE_PATH = ":memory:";

import { charges, getDb, listings, properties, reservations } from "@/db";
import { hasSampleData, newToken, removeSampleData, seedDemo } from "./seed";

const count = async (table: typeof properties | typeof reservations | typeof charges) =>
  (await getDb().select().from(table).all()).length;

describe("sample data", () => {
  it("is flagged while loaded and leaves real properties alone when removed", async () => {
    expect(await hasSampleData()).toBe(false);
    await seedDemo();
    expect(await hasSampleData()).toBe(true);
    expect(await count(properties)).toBe(3);

    // A property the host added themselves, with a real calendar link.
    const db = getDb();
    const own = await db
      .insert(properties)
      .values({ name: "My flat", icalToken: newToken(), createdAt: Date.now() })
      .returning({ id: properties.id })
      .get();
    await db
      .insert(listings)
      .values({ propertyId: own.id, channel: "airbnb", icalUrl: "https://example.test/calendar.ics" })
      .run();

    await removeSampleData();
    expect(await hasSampleData()).toBe(false);
    expect(await db.select({ name: properties.name }).from(properties).all()).toEqual([{ name: "My flat" }]);
    expect(await count(reservations)).toBe(0);
    // Shared charges stay, because a real property still uses them.
    expect(await count(charges)).toBeGreaterThan(0);
  });

  it("clears shared sample charges once no property is left", async () => {
    const db = getDb();
    await db.delete(properties).run();
    await db.delete(charges).run();
    await seedDemo();
    await removeSampleData();
    expect(await count(properties)).toBe(0);
    expect(await count(charges)).toBe(0);
  });
});
