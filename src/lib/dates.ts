/**
 * All stay dates are plain calendar dates stored as "YYYY-MM-DD" strings.
 * A stay occupies the nights from `checkIn` (inclusive) to `checkOut` (exclusive),
 * which is also how iCal all-day events work.
 */
export type ISODate = string;

const DAY_MS = 86_400_000;

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function toUTC(date: ISODate): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function addDays(date: ISODate, days: number): ISODate {
  return new Date(toUTC(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Number of days from `from` to `to` (positive when `to` is later). */
export function diffDays(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / DAY_MS);
}

/** Today's date in the server's local timezone. */
export function today(): ISODate {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function rangesOverlap(
  a: { checkIn: ISODate; checkOut: ISODate },
  b: { checkIn: ISODate; checkOut: ISODate },
): boolean {
  return a.checkIn < b.checkOut && b.checkIn < a.checkOut;
}

export function dayOfWeek(date: ISODate): number {
  return new Date(toUTC(date)).getUTCDay();
}

export function formatDate(
  date: ISODate,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
  locale = "en-GB",
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(new Date(toUTC(date)));
}

export function formatDateTime(timestamp: number, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}
