import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

process.env.DATABASE_PATH = ":memory:";

import { getDb, listings, properties, reservations } from "@/db";
import { exportEvents, syncListing } from "./sync";

const feed = (events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");
const event = (uid: string, start: string, end: string, summary = "Reserved") =>
  `BEGIN:VEVENT\r\nUID:${uid}\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${end}\r\nSUMMARY:${summary}\r\nEND:VEVENT`;

function serve(body: string, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status })),
  );
}

describe("syncListing", () => {
  let propertyId: number;
  let listingId: number;

  beforeAll(async () => {
    const db = getDb();
    propertyId = (
      await db
        .insert(properties)
        .values({ name: "Test", icalToken: "t", createdAt: 0 })
        .returning({ id: properties.id })
        .get()
    ).id;
    listingId = (
      await db
        .insert(listings)
        .values({ propertyId, channel: "airbnb", icalUrl: "https://example.test/cal.ics" })
        .returning({ id: listings.id })
        .get()
    ).id;
  });

  const rows = async () =>
    await getDb().select().from(reservations).where(eq(reservations.propertyId, propertyId)).all();

  it("imports reservations and blocks from the feed", async () => {
    serve(
      feed([
        event("a", "20990104", "20990108"),
        event("b", "20990210", "20990212", "Airbnb (Not available)"),
      ]),
    );
    expect(await syncListing(listingId)).toEqual({ ok: true, imported: 2, cancelled: 0 });
    expect((await rows()).map((r) => [r.externalUid, r.kind, r.checkIn, r.checkOut])).toEqual([
      ["a", "reservation", "2099-01-04", "2099-01-08"],
      ["b", "block", "2099-02-10", "2099-02-12"],
    ]);
  });

  it("updates changed dates in place, keeps host edits and cancels vanished stays", async () => {
    const db = getDb();
    await db.update(reservations).set({ guestName: "Léa" }).where(eq(reservations.externalUid, "a")).run();

    serve(feed([event("a", "20990105", "20990109")]));
    expect(await syncListing(listingId)).toEqual({ ok: true, imported: 1, cancelled: 1 });

    const [a, b] = await rows();
    expect(a).toMatchObject({
      checkIn: "2099-01-05",
      checkOut: "2099-01-09",
      guestName: "Léa",
      status: "confirmed",
    });
    expect(b.status).toBe("cancelled");
  });

  it("records the error and leaves reservations untouched when the feed fails", async () => {
    serve("nope", 500);
    const result = await syncListing(listingId);
    expect(result.ok).toBe(false);
    expect((await rows()).filter((r) => r.status === "confirmed")).toHaveLength(1);
    const listing = await getDb().select().from(listings).where(eq(listings.id, listingId)).get();
    expect(listing?.lastSyncError).toMatch(/500/);
  });

  it("exports to a channel only the stays that channel does not already know", async () => {
    await (await getDb())
      .insert(reservations)
      .values({
        propertyId,
        source: "direct",
        kind: "block",
        checkIn: "2099-03-01",
        checkOut: "2099-03-03",
        createdAt: 0,
      })
      .run();
    expect((await exportEvents(propertyId, "airbnb")).map((e) => e.summary)).toEqual(["Blocked"]);
    expect((await exportEvents(propertyId, "booking")).map((e) => e.summary)).toEqual([
      "Reserved (Airbnb)",
      "Blocked",
    ]);
  });
});

describe("Booking.com feeds", () => {
  it("imports closed dates as blocks and keeps a stay the extension confirmed as a reservation", async () => {
    const db = getDb();
    const propertyId = (
      await db
        .insert(properties)
        .values({ name: "Flat", icalToken: "b", createdAt: 0 })
        .returning({ id: properties.id })
        .get()
    ).id;
    const listingId = (
      await db
        .insert(listings)
        .values({ propertyId, channel: "booking", icalUrl: "https://example.test/booking.ics" })
        .returning({ id: listings.id })
        .get()
    ).id;
    const closed = (uid: string, start: string, end: string) =>
      event(uid, start, end, "CLOSED - Not available");
    const stays = async () =>
      await db.select().from(reservations).where(eq(reservations.propertyId, propertyId)).all();

    serve(feed([closed("x", "20990601", "20990608"), closed("y", "20991119", "21000519")]));
    await syncListing(listingId);
    expect((await stays()).map((stay) => stay.kind)).toEqual(["block", "block"]);

    // The extension matched the first one to a reservation number.
    await db
      .update(reservations)
      .set({ kind: "reservation", externalCode: "5000000001" })
      .where(eq(reservations.externalUid, "x"))
      .run();
    await syncListing(listingId);
    expect((await stays()).map((stay) => stay.kind)).toEqual(["reservation", "block"]);
  });
});

describe("syncListing: what the host is told", () => {
  it("notes a new stay, its change of dates and its cancellation, once each", async () => {
    const db = getDb();
    const { reservationEvents } = await import("@/db");
    const property = await db
      .insert(properties)
      .values({ name: "Told", icalToken: "told", createdAt: 0 })
      .returning({ id: properties.id })
      .get();
    const listing = await db
      .insert(listings)
      .values({ propertyId: property.id, channel: "airbnb", icalUrl: "https://example.test/told.ics" })
      .returning({ id: listings.id })
      .get();
    const kinds = async () =>
      (await db.select().from(reservationEvents).orderBy(reservationEvents.id).all())
        .filter((row) => row.at > 0)
        .map((row) => row.kind);
    const start = (await kinds()).length;

    serve(feed([event("told-1", "20990110", "20990114"), event("old-1", "20200110", "20200114")]));
    await syncListing(listing.id);
    await syncListing(listing.id);
    expect((await kinds()).slice(start)).toEqual(["new"]);

    serve(feed([event("told-1", "20990110", "20990115")]));
    await syncListing(listing.id);
    expect((await kinds()).slice(start)).toEqual(["new", "changed"]);

    serve(feed([]));
    await syncListing(listing.id);
    await syncListing(listing.id);
    expect((await kinds()).slice(start)).toEqual(["new", "changed", "cancelled"]);
  });
});
