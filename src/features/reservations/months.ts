import type { Property, Reservation } from "@/db/schema";
import { addMonths, type Month, monthOf, monthStart, summariseMonth } from "@/features/revenue/compute";
import type { ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";

/**
 * The reservations month by month: who stays, how many nights are taken and
 * how full that leaves the month. Pure, on the same night-splitting as the
 * revenue figures, so a stay across two months counts in both for its nights.
 */
type Stay = Pick<
  Reservation,
  "propertyId" | "source" | "checkIn" | "checkOut" | "amount" | "kind" | "status"
>;
type Rate = Pick<Property, "id" | "basePrice">;

export type MonthRow<S> = {
  month: Month;
  /** Guest stays with at least one night in the month, by arrival. */
  stays: S[];
  nights: number;
  availableNights: number;
  /** Share of the month's nights that are booked, 0 to 1. */
  occupancy: number;
  /** Payouts for the nights in the month, and the part of it that is estimated. */
  revenue: Minor;
  estimated: Minor;
};

/**
 * `upcoming` runs from the current month to the last one with a booking;
 * `past` goes back from last month, at most eleven months and no further than
 * the oldest stay.
 */
export function reservationMonths<S extends Stay>(input: {
  today: ISODate;
  stays: S[];
  properties: Rate[];
}): { upcoming: MonthRow<S>[]; past: MonthRow<S>[] } {
  const { properties } = input;
  const current = monthOf(input.today);
  const oldest = addMonths(current, -11);
  const guests = input.stays.filter((stay) => stay.kind === "reservation" && stay.status === "confirmed");

  const row = (month: Month): MonthRow<S> => {
    const from = monthStart(month);
    const to = monthStart(addMonths(month, 1));
    const summary = summariseMonth(month, guests, [], properties);
    return {
      month,
      stays: guests.filter((stay) => stay.checkIn < to && stay.checkOut > from),
      nights: summary.bookedNights,
      availableNights: summary.availableNights,
      occupancy: Math.min(1, summary.occupancy),
      revenue: summary.gross,
      estimated: summary.estimated,
    };
  };

  // A stay that leaves on the 1st has no night in that month.
  const lastNight = (stay: Stay) =>
    monthOf(stay.checkOut > stay.checkIn ? previousDay(stay.checkOut) : stay.checkIn);
  const last = guests.reduce(
    (latest, stay) => (lastNight(stay) > latest ? lastNight(stay) : latest),
    current,
  );
  const first = guests.reduce(
    (earliest, stay) => (monthOf(stay.checkIn) < earliest ? monthOf(stay.checkIn) : earliest),
    current,
  );

  const upcoming: MonthRow<S>[] = [];
  for (let month = current; month <= last; month = addMonths(month, 1)) upcoming.push(row(month));
  const past: MonthRow<S>[] = [];
  const stop = first > oldest ? first : oldest;
  for (let month = addMonths(current, -1); month >= stop; month = addMonths(month, -1)) past.push(row(month));
  return { upcoming, past };
}

/**
 * How many reservations arrive in each month, from eleven months back to the
 * last month with an arrival. A stay is counted once, in the month it starts.
 */
export function reservationCounts(input: {
  today: ISODate;
  stays: Pick<Stay, "checkIn" | "kind" | "status">[];
}): { month: Month; count: number }[] {
  const current = monthOf(input.today);
  const first = addMonths(current, -11);
  const arrivals = input.stays
    .filter((stay) => stay.kind === "reservation" && stay.status === "confirmed")
    .map((stay) => monthOf(stay.checkIn))
    .filter((month) => month >= first);
  const last = arrivals.reduce((latest, month) => (month > latest ? month : latest), current);
  const counts: { month: Month; count: number }[] = [];
  for (let month = first; month <= last; month = addMonths(month, 1)) {
    counts.push({ month, count: arrivals.filter((arrival) => arrival === month).length });
  }
  return counts;
}

function previousDay(date: ISODate): ISODate {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

export const LISTS = ["list", "months"] as const;
export type ListView = (typeof LISTS)[number];
export const isListView = (value: unknown): value is ListView => LISTS.includes(value as ListView);
