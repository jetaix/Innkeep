import type { PublishState } from "@/channels/content";
import { sourceLabel } from "@/channels";
import type { Listing, Property, Reservation } from "@/db/schema";
import { addDays, diffDays, rangesOverlap, type ISODate } from "@/lib/dates";
import { occupancyAhead } from "@/features/revenue/compute";
import type { Format } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";

/**
 * Suggestions are plain rules over the host's own data: deterministic,
 * explainable and free. Each one names a concrete problem and links to the
 * screen that fixes it. The optional AI advice (see ./ai.ts) builds on top.
 *
 * The wording and the date format are passed in, so the rules stay pure and
 * speak whichever language the caller hands them.
 */

export type Severity = "urgent" | "recommended" | "idea";
export type Area = "calendar" | "guests" | "listing" | "revenue";

export type Suggestion = {
  /** Stable identity, used to remember dismissals. */
  key: string;
  severity: Severity;
  area: Area;
  title: string;
  body: string;
  action: { label: string; href: string };
};

export type InsightInput = {
  today: ISODate;
  now: number;
  properties: Property[];
  listings: (Listing & { publishState: PublishState })[];
  /** Confirmed stays and blocks that have not ended yet. */
  stays: Reservation[];
  conversations: { id: number; guestName: string; lastDirection: "in" | "out"; lastMessageAt: number }[];
  chargeCount: number;
};

const HOUR = 3_600_000;
const SEVERITY_ORDER: Record<Severity, number> = { urgent: 0, recommended: 1, idea: 2 };

export function buildSuggestions(
  input: InsightInput,
  t: Messages["insights"]["rules"],
  fmt: Pick<Format, "date" | "percent">,
): Suggestion[] {
  const { today, now, properties, listings, stays } = input;
  const suggestions: Suggestion[] = [];
  const nameOf = (propertyId: number) => properties.find((p) => p.id === propertyId)?.name ?? t.aProperty;
  const calendarAt = (date: ISODate, id?: number) =>
    `/calendar?start=${addDays(date, -3)}${id ? `&r=${id}` : ""}`;

  for (const property of properties) {
    const own = stays
      .filter((stay) => stay.propertyId === property.id)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    const guests = own.filter((stay) => stay.kind === "reservation");

    // Double bookings
    for (const [index, a] of own.entries()) {
      for (const b of own.slice(index + 1)) {
        if (!rangesOverlap(a, b)) continue;
        suggestions.push({
          key: `conflict:${a.id}:${b.id}`,
          severity: "urgent",
          area: "calendar",
          title: t.conflict.title(property.name),
          body: t.conflict.body(
            sourceLabel(a.source),
            sourceLabel(b.source),
            fmt.date(b.checkIn),
            fmt.date(a.checkOut < b.checkOut ? a.checkOut : b.checkOut),
          ),
          action: { label: t.openInCalendar, href: calendarAt(b.checkIn, b.id) },
        });
      }
    }

    // Arrivals with no guest name
    const unnamed = guests.filter(
      (stay) => !stay.guestName && stay.checkIn >= today && diffDays(today, stay.checkIn) <= 7,
    );
    if (unnamed.length > 0) {
      suggestions.push({
        key: `unnamed:${unnamed.map((stay) => stay.id).join(",")}`,
        severity: "recommended",
        area: "guests",
        title: t.unnamed.title(unnamed.length, property.name),
        body: t.unnamed.body,
        action: { label: t.unnamed.action, href: calendarAt(unnamed[0].checkIn, unnamed[0].id) },
      });
    }

    // One-night gaps nobody will book
    const gaps = own
      .filter((stay, index) => {
        const next = own[index + 1];
        return (
          next &&
          stay.checkOut >= today &&
          diffDays(stay.checkOut, next.checkIn) === 1 &&
          diffDays(today, stay.checkOut) <= 45
        );
      })
      .map((stay) => stay.checkOut);
    if (gaps.length > 0) {
      suggestions.push({
        key: `gap:${property.id}:${gaps.join(",")}`,
        severity: "idea",
        area: "calendar",
        title: t.gap.title(
          property.name,
          gaps.map((gap) => fmt.date(gap)),
        ),
        body: t.gap.body,
        action: { label: t.gap.action(gaps.length), href: calendarAt(gaps[0]) },
      });
    }

    // Same-day turnovers in the next week
    const turnover = guests.find(
      (stay) =>
        stay.checkOut >= today &&
        diffDays(today, stay.checkOut) <= 7 &&
        guests.some((other) => other.id !== stay.id && other.checkIn === stay.checkOut),
    );
    if (turnover) {
      suggestions.push({
        key: `turnover:${property.id}:${turnover.checkOut}`,
        severity: "recommended",
        area: "guests",
        title: t.turnover.title(property.name, fmt.date(turnover.checkOut)),
        body: t.turnover.body(property.checkOutTime, property.checkInTime),
        action: { label: t.openInCalendar, href: calendarAt(turnover.checkOut, turnover.id) },
      });
    }

    // Pricing signals from the next 30 days
    const occupancy = occupancyAhead(property.id, guests, today, 30);
    if (guests.length > 0 && occupancy < 0.35) {
      suggestions.push({
        key: `low-occupancy:${property.id}:${today.slice(0, 7)}`,
        severity: "idea",
        area: "revenue",
        title: t.occupancy.title(property.name, fmt.percent(occupancy)),
        body: t.occupancy.lowBody(`${property.basePrice} ${property.currency}`),
        action: { label: t.reviewPrice, href: `/properties/${property.id}` },
      });
    } else if (occupancy > 0.85) {
      suggestions.push({
        key: `high-occupancy:${property.id}:${today.slice(0, 7)}`,
        severity: "idea",
        area: "revenue",
        title: t.occupancy.title(property.name, fmt.percent(occupancy)),
        body: t.occupancy.highBody,
        action: { label: t.reviewPrice, href: `/properties/${property.id}` },
      });
    }

    // Listing content
    const contentIssues = [
      property.title.length < 15 && t.content.shortTitle,
      property.title.length > 32 && t.content.longTitle,
      property.description.length < 300 && t.content.shortDescription,
      !property.houseRules && t.content.noHouseRules,
    ].filter((issue) => issue !== false);
    if (contentIssues.length > 0) {
      suggestions.push({
        key: `content:${property.id}:${contentIssues.length}`,
        severity: "idea",
        area: "listing",
        title: t.content.title(property.name),
        body: t.content.body(contentIssues),
        action: { label: t.content.action, href: `/properties/${property.id}` },
      });
    }
  }

  // Channel connections
  for (const listing of listings) {
    const property = nameOf(listing.propertyId);
    const channel = sourceLabel(listing.channel);
    const href = `/properties/${listing.propertyId}`;
    if (listing.icalUrl && listing.lastSyncError) {
      suggestions.push({
        key: `sync-error:${listing.id}`,
        severity: "urgent",
        area: "calendar",
        title: t.syncError.title(channel, property),
        body: t.syncError.body(listing.lastSyncError, channel),
        action: { label: t.syncError.action, href },
      });
    } else if (listing.icalUrl && listing.lastSyncedAt && now - listing.lastSyncedAt > 6 * HOUR) {
      suggestions.push({
        key: `sync-stale:${listing.id}`,
        severity: "recommended",
        area: "calendar",
        title: t.syncStale.title(channel, property, Math.round((now - listing.lastSyncedAt) / HOUR)),
        body: t.syncStale.body,
        action: { label: t.syncStale.action, href },
      });
    }
    if (listing.publishState === "outdated") {
      suggestions.push({
        key: `drift:${listing.id}:${listing.publishedAt}`,
        severity: "recommended",
        area: "listing",
        title: t.drift.title(channel, property),
        body: t.drift.body(channel),
        action: { label: t.drift.action, href },
      });
    }
  }
  for (const property of properties) {
    const connected = listings.filter((listing) => listing.propertyId === property.id && listing.icalUrl);
    if (connected.length === 1) {
      const missing = connected[0].channel === "airbnb" ? "Booking.com" : "Airbnb";
      suggestions.push({
        key: `single-channel:${property.id}`,
        severity: "idea",
        area: "calendar",
        title: t.singleChannel.title(property.name, sourceLabel(connected[0].channel)),
        body: t.singleChannel.body(missing),
        action: { label: t.connectCalendar, href: `/properties/${property.id}` },
      });
    } else if (connected.length === 0) {
      suggestions.push({
        key: `no-channel:${property.id}`,
        severity: "recommended",
        area: "calendar",
        title: t.noChannel.title(property.name),
        body: t.noChannel.body,
        action: { label: t.connectCalendar, href: `/properties/${property.id}` },
      });
    }
  }

  // Guests waiting for an answer
  for (const conversation of input.conversations) {
    const waited = now - conversation.lastMessageAt;
    if (conversation.lastDirection !== "in" || waited < HOUR) continue;
    suggestions.push({
      key: `unanswered:${conversation.id}:${conversation.lastMessageAt}`,
      severity: waited > 12 * HOUR ? "urgent" : "recommended",
      area: "guests",
      title: t.unanswered.title(conversation.guestName, Math.round(waited / HOUR)),
      body: t.unanswered.body,
      action: { label: t.unanswered.action, href: `/inbox?c=${conversation.id}` },
    });
  }

  // Money
  const guestStays = stays.filter((stay) => stay.kind === "reservation");
  if (properties.length > 0 && input.chargeCount === 0) {
    suggestions.push({
      key: "no-charges",
      severity: "recommended",
      area: "revenue",
      title: t.noCharges.title,
      body: t.noCharges.body,
      action: { label: t.noCharges.action, href: "/revenue" },
    });
  }
  const unpriced = guestStays.filter((stay) => stay.amount == null && stay.source !== "direct");
  if (unpriced.length >= 3) {
    suggestions.push({
      key: `unpriced:${unpriced.length}`,
      severity: "idea",
      area: "revenue",
      title: t.unpriced.title(unpriced.length),
      body: t.unpriced.body,
      action: { label: t.unpriced.action, href: "/reservations" },
    });
  }

  return suggestions.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
