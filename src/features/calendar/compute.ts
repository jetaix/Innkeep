import type { Reservation } from "@/db/schema";
import { addDays, dayOfWeek, type ISODate } from "@/lib/dates";

/** How the calendar is laid out: a five-week timeline, one month, or the whole year. */
export const VIEWS = ["weeks", "month", "year"] as const;
export type View = (typeof VIEWS)[number];

export const isView = (value: unknown): value is View => VIEWS.includes(value as View);

export const monthStart = (date: ISODate): ISODate => `${date.slice(0, 7)}-01`;
export const yearStart = (date: ISODate): ISODate => `${date.slice(0, 4)}-01-01`;

/** The first day of the month `months` after (or before) the month of `date`. */
export function addMonths(date: ISODate, months: number): ISODate {
  const index = Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1 + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}-01`;
}

/** The days of a month in rows of seven starting on Monday; days of other months are null. */
export function monthWeeks(month: ISODate): (ISODate | null)[][] {
  const first = monthStart(month);
  const next = addMonths(first, 1);
  const cells: (ISODate | null)[] = Array.from({ length: (dayOfWeek(first) + 6) % 7 }, () => null);
  for (let day = first; day < next; day = addDays(day, 1)) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));
}

type Stay = Pick<Reservation, "id" | "propertyId" | "checkIn" | "checkOut" | "kind">;

/**
 * Which stay holds each night of a property between `from` and `to`. A night
 * belongs to the stay that sleeps there: from check-in to the eve of check-out.
 */
export function nightsOf<S extends Stay>(stays: S[], propertyId: number, from: ISODate, to: ISODate) {
  const nights = new Map<ISODate, S>();
  for (const stay of stays) {
    if (stay.propertyId !== propertyId) continue;
    const start = stay.checkIn > from ? stay.checkIn : from;
    for (let night = start; night < stay.checkOut && night < to; night = addDays(night, 1)) {
      if (!nights.has(night)) nights.set(night, stay);
    }
  }
  return nights;
}

/** Nights of a month sold to a guest; blocked dates do not count. */
export function bookedNights(nights: Map<ISODate, Stay>, month: ISODate): number {
  const prefix = month.slice(0, 7);
  let count = 0;
  for (const [night, stay] of nights) if (night.startsWith(prefix) && stay.kind === "reservation") count++;
  return count;
}
