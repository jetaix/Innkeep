import { beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

process.env.DATABASE_PATH = ":memory:";
vi.mock("server-only", () => ({}));

import { getDb, listings, properties, reservations } from "@/db";
import { ingestReservations } from "./ingest";

describe("ingestReservations", () => {
  let loft: number;
  let cabin: number;

  beforeAll(() => {
    const db = getDb();
    const property = (name: string, title: string) =>
      db
        .insert(properties)
        .values({ name, title, icalToken: name, createdAt: 0 })
        .returning({ id: properties.id })
        .get().id;
    loft = property("Loft", "Bright loft on the canal");
    cabin = property("Cabin", "Pine cabin");
    db.insert(listings)
      .values([
        { propertyId: loft, channel: "airbnb" },
        { propertyId: cabin, channel: "airbnb" },
      ])
      .run();

    const stay = { source: "airbnb" as const, createdAt: 0 };
    db.insert(reservations)
      .values([
        // As the calendar feed imports them: dates and a reservation link, no name.
        {
          ...stay,
          propertyId: loft,
          externalUid: "a",
          checkIn: "2099-01-04",
          checkOut: "2099-01-08",
          channelInfo: "https://www.airbnb.com/hosting/reservations/details/HMAAAAAAAA",
        },
        { ...stay, propertyId: loft, externalUid: "b", checkIn: "2099-02-01", checkOut: "2099-02-05" },
        { ...stay, propertyId: cabin, externalUid: "c", checkIn: "2099-02-01", checkOut: "2099-02-05" },
        {
          ...stay,
          propertyId: cabin,
          externalUid: "d",
          checkIn: "2099-03-01",
          checkOut: "2099-03-03",
          guestName: "Nickname I typed",
        },
      ])
      .run();
  });

  const byUid = (uid: string) =>
    getDb().select().from(reservations).where(eq(reservations.externalUid, uid)).get()!;
  const row = (code: string, checkIn: string, checkOut: string, extra = {}) => ({
    code,
    checkIn,
    checkOut,
    guestName: "Camille Durand",
    guests: 2,
    payout: 34_356,
    listingName: "",
    ...extra,
  });

  it("matches by confirmation code even when the dates on the page differ", () => {
    const result = ingestReservations({
      source: "airbnb",
      reservations: [row("HMAAAAAAAA", "2099-01-05", "2099-01-08")],
    });
    expect(result).toEqual({ updated: 1, unchanged: 0, added: 0, cancelled: 0, unmatched: [] });
    expect(byUid("a")).toMatchObject({
      guestName: "Camille Durand",
      guests: 2,
      amount: 34_356,
      externalCode: "HMAAAAAAAA",
      // The calendar feed still owns the dates.
      checkIn: "2099-01-04",
    });
  });

  it("is idempotent", () => {
    const result = ingestReservations({
      source: "airbnb",
      reservations: [row("HMAAAAAAAA", "2099-01-04", "2099-01-08")],
    });
    expect(result).toMatchObject({ updated: 0, unchanged: 1, unmatched: [] });
  });

  it("uses the listing name when two properties have the same dates, and refuses to guess without it", () => {
    const ambiguous = ingestReservations({
      source: "airbnb",
      reservations: [row("HMBBBBBBBB", "2099-02-01", "2099-02-05")],
    });
    expect(ambiguous.unmatched).toEqual(["HMBBBBBBBB"]);

    const named = ingestReservations({
      source: "airbnb",
      reservations: [row("HMBBBBBBBB", "2099-02-01", "2099-02-05", { listingName: "Pine cabin | Chamonix" })],
    });
    expect(named.updated).toBe(1);
    expect(byUid("c").guestName).toBe("Camille Durand");
    expect(byUid("b").guestName).toBe("");
  });

  it("matches Booking.com rows by dates, then remembers the property id for next time", () => {
    const db = getDb();
    db.insert(listings).values({ propertyId: loft, channel: "booking" }).run();
    db.insert(reservations)
      .values({
        propertyId: loft,
        source: "booking",
        externalUid: "bk",
        // Booking.com feeds do not say whether closed dates are a booking.
        kind: "block",
        checkIn: "2099-05-01",
        checkOut: "2099-05-04",
        channelInfo: "CLOSED - Not available",
        createdAt: 0,
      })
      .run();

    const result = ingestReservations({
      source: "booking",
      listingId: "14170000",
      reservations: [row("5000000001", "2099-05-01", "2099-05-04", { payout: 21_909 })],
    });
    expect(result.updated).toBe(1);
    expect(byUid("bk")).toMatchObject({
      guestName: "Camille Durand",
      amount: 21_909,
      externalCode: "5000000001",
    });
    const listing = db.select().from(listings).where(eq(listings.channel, "booking")).get();
    expect(listing?.externalId).toBe("14170000");
  });

  it("keeps a name the host typed and never creates a booking", () => {
    const before = getDb().select().from(reservations).all().length;
    const result = ingestReservations({
      source: "airbnb",
      reservations: [
        row("HMDDDDDDDD", "2099-03-01", "2099-03-03"),
        row("HMZZZZZZZZ", "2099-09-01", "2099-09-03"),
      ],
    });
    expect(result).toMatchObject({ updated: 1, unmatched: ["HMZZZZZZZZ"] });
    expect(byUid("d")).toMatchObject({ guestName: "Nickname I typed", amount: 34_356 });
    expect(getDb().select().from(reservations).all()).toHaveLength(before);
  });

  it("keeps a cancelled row as a cancelled stay, without touching the stay that shares its dates", () => {
    const cancelled = row("HMCANCELLED", "2099-03-01", "2099-03-03", {
      status: "cancelled",
      statusText: "Cancelled by guest",
      guestName: "Someone else",
      payout: 0,
      listingName: "Pine cabin",
    });
    const result = ingestReservations({ source: "airbnb", reservations: [cancelled] });
    expect(result).toMatchObject({ updated: 0, cancelled: 1, unmatched: [] });
    expect(byUid("d")).toMatchObject({ externalCode: "HMDDDDDDDD", status: "confirmed" });

    ingestReservations({ source: "airbnb", reservations: [cancelled] });
    const stored = getDb()
      .select()
      .from(reservations)
      .where(eq(reservations.externalCode, "HMCANCELLED"))
      .all();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      status: "cancelled",
      amount: 0,
      propertyId: cabin,
      channelStatus: "Cancelled by guest",
      unitName: "Pine cabin",
    });
  });

  it("treats a payout of zero as cancelled when an older extension sends no status", () => {
    ingestReservations({
      source: "airbnb",
      reservations: [
        row("HMOLDCLIENT", "2020-01-01", "2020-01-03", { payout: 0, listingName: "Pine cabin" }),
      ],
    });
    const stored = getDb()
      .select()
      .from(reservations)
      .where(eq(reservations.externalCode, "HMOLDCLIENT"))
      .get();
    expect(stored).toMatchObject({ status: "cancelled" });
  });

  it("adds a finished stay the calendar no longer lists, once, on the property its listing names", () => {
    const past = row("HMPAST00001", "2020-06-01", "2020-06-04", {
      listingName: "Pine cabin | Lake view",
      statusText: "Ancien voyageur",
      bookedOn: "2020-05-02",
    });
    expect(ingestReservations({ source: "airbnb", reservations: [past] })).toMatchObject({ added: 1 });
    expect(ingestReservations({ source: "airbnb", reservations: [past] })).toMatchObject({
      added: 0,
      unchanged: 1,
    });
    const stored = getDb()
      .select()
      .from(reservations)
      .where(eq(reservations.externalCode, "HMPAST00001"))
      .all();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      propertyId: cabin,
      kind: "reservation",
      guestName: "Camille Durand",
      amount: 34_356,
      bookedOn: "2020-05-02",
      channelStatus: "Ancien voyageur",
      externalUid: null,
    });
  });

  it("does not guess the property of a finished stay", () => {
    const result = ingestReservations({
      source: "airbnb",
      reservations: [row("HMPAST00002", "2020-07-01", "2020-07-04", { listingName: "Somewhere else" })],
    });
    expect(result).toMatchObject({ added: 0, unmatched: ["HMPAST00002"] });
  });

  it("stores the price and commission Booking.com shows", () => {
    ingestReservations({
      source: "booking",
      listingId: "14170000",
      reservations: [
        row("5000000001", "2099-05-01", "2099-05-04", { payout: 21_909, price: 26_861, fees: 4_952 }),
      ],
    });
    expect(byUid("bk")).toMatchObject({ amount: 21_909, grossAmount: 26_861, channelFees: 4_952 });
  });
});
