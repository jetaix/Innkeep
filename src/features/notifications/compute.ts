import type { Source } from "@/db";

export type EventKind = "new" | "cancelled" | "changed";

/** What matters about a stay when deciding whether the host should be told. */
export type Snapshot = {
  kind: "reservation" | "block";
  status: "confirmed" | "cancelled";
  checkIn: string;
  checkOut: string;
};

/**
 * What to tell the host when a stay goes from `before` to `after`, or null
 * when there is nothing to say. Only stays that are not over count, so a
 * first import of past bookings stays quiet. Dates the host closed by hand on
 * Airbnb are their own doing. On Booking.com the calendar cannot tell a
 * booking from closed dates, so closed dates are announced too.
 */
export function reservationEvent(
  source: Source,
  before: Snapshot | null,
  after: Snapshot,
  today: string,
): { kind: EventKind; detail: string } | null {
  if (source === "direct" || after.checkOut <= today) return null;
  if (after.kind === "block" && source !== "booking") return null;
  if (after.status === "cancelled") {
    return before?.status === "confirmed" ? { kind: "cancelled", detail: "" } : null;
  }
  if (!before || before.status === "cancelled") return { kind: "new", detail: "" };
  if (before.checkIn !== after.checkIn || before.checkOut !== after.checkOut) {
    // The dates it had, for "was 12 to 15 March".
    return { kind: "changed", detail: `${before.checkIn}/${before.checkOut}` };
  }
  return null;
}
