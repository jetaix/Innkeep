import { describe, expect, it } from "vitest";
import type { Listing, Property, Reservation } from "@/db/schema";
import { createFormat } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import { buildSuggestions as build, type InsightInput } from "./rules";

const buildSuggestions = (data: InsightInput) => build(data, MESSAGES.en.insights.rules, createFormat("en"));

const HOUR = 3_600_000;
const now = Date.parse("2027-03-01T12:00:00Z");

const property: Property = {
  id: 1,
  name: "Canal Loft",
  address: "",
  title: "Bright loft on the canal",
  description: "x".repeat(400),
  maxGuests: 2,
  bedrooms: 1,
  bathrooms: 1,
  basePrice: 100,
  currency: "EUR",
  checkInTime: "15:00",
  checkOutTime: "11:00",
  houseRules: "No smoking",
  cleaningEnabled: true,
  icalToken: "t",
  createdAt: 0,
};

let nextId = 1;
const stay = (checkIn: string, checkOut: string, extra: Partial<Reservation> = {}): Reservation => ({
  id: nextId++,
  propertyId: 1,
  source: "airbnb",
  kind: "reservation",
  externalUid: null,
  guestName: "Guest",
  checkIn,
  checkOut,
  status: "confirmed",
  channelInfo: "",
  notes: "",
  amount: 10_000,
  externalCode: null,
  guests: null,
  bookedOn: null,
  channelStatus: null,
  grossAmount: null,
  channelFees: null,
  unitName: null,
  createdAt: 0,
  ...extra,
});

const listing = (extra: Partial<Listing & { publishState: "never" | "current" | "outdated" }> = {}) => ({
  id: 1,
  propertyId: 1,
  channel: "airbnb" as const,
  listingUrl: "",
  externalId: null,
  icalUrl: "https://example.test/a.ics",
  titleOverride: "",
  descriptionOverride: "",
  publishedHash: null,
  publishedAt: null,
  channelDetails: null,
  channelDetailsAt: null,
  publicPreview: null,
  publicPreviewAt: null,
  lastSyncedAt: now,
  lastSyncError: null,
  publishState: "current" as const,
  ...extra,
});

const input = (extra: Partial<InsightInput> = {}): InsightInput => ({
  today: "2027-03-01",
  now,
  properties: [property],
  listings: [listing(), listing({ id: 2, channel: "booking" })],
  stays: [],
  conversations: [],
  chargeCount: 1,
  ...extra,
});

const keys = (extra: Partial<InsightInput>) => buildSuggestions(input(extra)).map((s) => s.key.split(":")[0]);

describe("buildSuggestions", () => {
  it("is quiet when nothing needs attention", () => {
    // Mid occupancy, everything connected, named guests, costs entered.
    const stays = [stay("2027-03-02", "2027-03-12"), stay("2027-03-15", "2027-03-22")];
    expect(buildSuggestions(input({ stays }))).toEqual([]);
  });

  it("puts a double booking first", () => {
    const stays = [
      stay("2027-03-10", "2027-03-14"),
      stay("2027-03-12", "2027-03-16", { source: "booking" }),
      stay("2027-03-16", "2027-03-28"),
    ];
    const [first] = buildSuggestions(input({ stays, chargeCount: 0 }));
    expect(first).toMatchObject({ severity: "urgent", area: "calendar" });
    expect(first.title).toContain("Double booking");
  });

  it("flags one-night gaps, same-day turnovers and unnamed arrivals", () => {
    const stays = [
      stay("2027-03-01", "2027-03-04", { guestName: "" }),
      stay("2027-03-04", "2027-03-08"),
      stay("2027-03-09", "2027-03-20"),
    ];
    expect(keys({ stays })).toEqual(expect.arrayContaining(["unnamed", "turnover", "gap"]));
  });

  it("reads pricing signals from occupancy", () => {
    expect(keys({ stays: [stay("2027-03-05", "2027-03-08")] })).toContain("low-occupancy");
    expect(keys({ stays: [stay("2027-03-01", "2027-03-30")] })).toContain("high-occupancy");
  });

  it("reports failing feeds, drifted details and a missing channel", () => {
    const result = keys({
      listings: [
        listing({ lastSyncError: "The channel answered 404", publishState: "outdated", publishedAt: 5 }),
      ],
    });
    expect(result).toEqual(expect.arrayContaining(["sync-error", "drift", "single-channel"]));
  });

  it("escalates guests who have waited a long time", () => {
    const conversations = [
      { id: 1, guestName: "Tom", lastDirection: "in" as const, lastMessageAt: now - 2 * HOUR },
      { id: 2, guestName: "Ana", lastDirection: "in" as const, lastMessageAt: now - 20 * HOUR },
      { id: 3, guestName: "Answered", lastDirection: "out" as const, lastMessageAt: now - 30 * HOUR },
      { id: 4, guestName: "Just now", lastDirection: "in" as const, lastMessageAt: now - 60_000 },
    ];
    const result = buildSuggestions(input({ conversations })).filter((s) => s.area === "guests");
    expect(result.map((s) => [s.title.split(" ")[0], s.severity])).toEqual([
      ["Ana", "urgent"],
      ["Tom", "recommended"],
    ]);
  });

  it("asks for costs and payouts when revenue is only an estimate", () => {
    const stays = ["05", "10", "15"].map((day) =>
      stay(`2027-03-${day}`, `2027-03-${Number(day) + 3}`, { amount: null }),
    );
    expect(keys({ stays, chargeCount: 0 })).toEqual(expect.arrayContaining(["no-charges", "unpriced"]));
  });

  it("speaks French when given the French wording, with the same keys", () => {
    const stays = [
      stay("2027-03-10", "2027-03-14"),
      stay("2027-03-12", "2027-03-16", { source: "booking" }),
      stay("2027-03-16", "2027-03-28"),
    ];
    const data = input({ stays, chargeCount: 0 });
    const french = build(data, MESSAGES.fr.insights.rules, createFormat("fr"));
    const [first] = french;
    expect(first.title).toBe("Double réservation pour Canal Loft");
    expect(first.body).toContain("entre le 12 mars et le 14 mars");
    expect(first.action.label).toBe("Ouvrir dans le calendrier");
    expect(french.map((s) => [s.key, s.severity])).toEqual(
      buildSuggestions(data).map((s) => [s.key, s.severity]),
    );
  });
});
