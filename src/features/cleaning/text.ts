import type { Property } from "@/db/schema";
import type { Format } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import type { Cleaning } from "./compute";

/** "Sat 5 Dec": how a cleaning day is written in the schedule and in messages. */
export const cleaningDay = (date: string, fmt: Format) =>
  fmt.date(date, { weekday: "short", day: "numeric", month: "short" });

/** The time there is to clean, in words: a same-day window in hours, otherwise from when and how long. */
export function cleaningWindow(
  entry: Cleaning,
  place: Pick<Property, "checkInTime">,
  t: Messages["cleaning"]["row"],
): string {
  if (entry.sameDay) return t.sameDay(entry.from, place.checkInTime, entry.hours ?? 0);
  const from = t.from(entry.from);
  if (entry.hours == null) return from;
  return `${from}, ${entry.hours < 48 ? t.hours(entry.hours) : t.days(Math.floor(entry.hours / 24))}`;
}

/**
 * One cleaning as plain text, for the cleaner or for a notification: the day,
 * the place and the times. No guest names, no prices.
 */
export function cleaningLines(entry: Cleaning, place: Property, m: Messages, fmt: Format): string[] {
  const t = m.cleaning;
  return [
    t.share.line(cleaningDay(entry.date, fmt), place.name),
    ...(place.address ? [`  ${t.share.address(place.address)}`] : []),
    `  ${cleaningWindow(entry, place, t.row)}`,
    ...(entry.next
      ? [
          `  ${t.row.next(cleaningDay(entry.next.checkIn, fmt), entry.next.guests ? m.common.count.guests(entry.next.guests) : null)}`,
        ]
      : []),
    ...(entry.cleaner ? [`  ${t.share.cleaner(entry.cleaner.name)}`] : []),
    ...(entry.notes ? [`  ${t.share.note(entry.notes)}`] : []),
  ];
}
