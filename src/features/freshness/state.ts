/**
 * How fresh a piece of data is. Pure: the clock is passed in, so the rule is
 * unit tested.
 */
export type Freshness = "fresh" | "stale" | "never";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * How long each kind of data stays current. Calendars change by the minute
 * and refresh themselves; a listing's description changes when the host
 * edits it, so it can go a month.
 */
export const STALE_AFTER = {
  calendar: 30 * MINUTE,
  reservations: 12 * HOUR,
  prices: DAY,
  guestPrices: 7 * DAY,
  preview: 7 * DAY,
  reviews: 7 * DAY,
  listingDetails: 30 * DAY,
  adminPages: 30 * DAY,
  advice: 7 * DAY,
} as const;

export type SourceKind = keyof typeof STALE_AFTER;

export function freshness(at: number | null, kind: SourceKind, now: number): Freshness {
  if (at == null) return "never";
  return now - at < STALE_AFTER[kind] ? "fresh" : "stale";
}
