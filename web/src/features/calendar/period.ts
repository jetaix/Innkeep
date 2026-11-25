import { addMonths, monthStart, type View, yearStart } from "@/features/calendar/compute";
import { addDays, type ISODate } from "@/lib/dates";

/** Days on the timeline of the weeks view. */
export const DAYS = 35;

/** What the calendar's address can say. */
export type Search = {
  view?: View;
  start?: string;
  r?: number;
  new?: string;
};

/** Builds the address of the calendar for a link: the same period, plus what the link opens. */
export type SearchFor = (extra?: Pick<Search, "r" | "new">) => Search;

/** The days on screen, from `start` up to but not including `end`. */
export function period(
  view: View,
  asked: ISODate | undefined,
  now: ISODate,
): { start: ISODate; end: ISODate } {
  // Each view starts where it reads best: a few days back, the first of the month, the first of January.
  const start =
    view === "month"
      ? monthStart(asked ?? now)
      : view === "year"
        ? yearStart(asked ?? now)
        : (asked ?? addDays(now, -3));
  const end =
    view === "month" ? addMonths(start, 1) : view === "year" ? addMonths(start, 12) : addDays(start, DAYS);
  return { start, end };
}

/** Where the previous or the next screen of a view starts. */
export function step(view: View, start: ISODate, direction: 1 | -1): ISODate {
  return view === "month"
    ? addMonths(start, direction)
    : view === "year"
      ? addMonths(start, 12 * direction)
      : addDays(start, 28 * direction);
}
