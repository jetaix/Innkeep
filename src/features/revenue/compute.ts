import type { Charge, Property, Reservation } from "@/db/schema";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";

/**
 * Revenue estimation. Pure functions over plain rows, so the same numbers
 * back the dashboard, the suggestions and the MCP server.
 *
 * Calendar feeds carry no prices, so a stay is worth the payout the host
 * entered or, failing that, its nights at the property's nightly rate. Stays
 * that span two months are split by night.
 */

export type Month = string; // "YYYY-MM"

type Stay = Pick<Reservation, "propertyId" | "source" | "checkIn" | "checkOut" | "amount">;
type Rate = Pick<Property, "id" | "basePrice">;
type Cost = Pick<
  Charge,
  "id" | "propertyId" | "label" | "category" | "frequency" | "amount" | "appliesTo" | "startsOn" | "endsOn"
>;

export type MonthSummary = {
  month: Month;
  /** Payouts for the nights that fall in this month. */
  gross: Minor;
  /** Part of `gross` that comes from the nightly rate rather than an entered payout. */
  estimated: Minor;
  charges: Minor;
  net: Minor;
  chargeLines: { id: number; label: string; category: Charge["category"]; amount: Minor }[];
  bookedNights: number;
  availableNights: number;
  occupancy: number;
  arrivals: number;
};

export function monthOf(date: ISODate): Month {
  return date.slice(0, 7);
}

export function monthStart(month: Month): ISODate {
  return `${month}-01`;
}

export function addMonths(month: Month, count: number): Month {
  const [year, index] = month.split("-").map(Number);
  const total = year * 12 + (index - 1) + count;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** "Nov" or "November 2026", in the regional format given (see `INTL_LOCALE`). */
export function formatMonth(month: Month, style: "short" | "long" = "short", locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    month: style,
    year: style === "long" ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

/** Nights of [checkIn, checkOut) that fall inside [from, to). */
export function nightsWithin(stay: Pick<Stay, "checkIn" | "checkOut">, from: ISODate, to: ISODate): number {
  const start = stay.checkIn > from ? stay.checkIn : from;
  const end = stay.checkOut < to ? stay.checkOut : to;
  return Math.max(0, diffDays(start, end));
}

export function stayValue(stay: Stay, rates: Rate[]): { total: Minor; estimated: boolean } {
  if (stay.amount != null) return { total: stay.amount, estimated: false };
  const nightly = (rates.find((rate) => rate.id === stay.propertyId)?.basePrice ?? 0) * 100;
  return { total: nightly * diffDays(stay.checkIn, stay.checkOut), estimated: true };
}

function isActive(charge: Cost, from: ISODate, to: ISODate): boolean {
  return charge.startsOn < to && (charge.endsOn == null || charge.endsOn >= from);
}

/** Summarises one calendar month. `stays` are confirmed guest reservations, not blocks. */
export function summariseMonth(month: Month, stays: Stay[], charges: Cost[], rates: Rate[]): MonthSummary {
  const from = monthStart(month);
  const to = monthStart(addMonths(month, 1));

  const inMonth = stays
    .map((stay) => {
      const nights = nightsWithin(stay, from, to);
      const length = diffDays(stay.checkIn, stay.checkOut);
      const { total, estimated } = stayValue(stay, rates);
      return {
        stay,
        nights,
        estimated,
        // Share of the payout earned by this month's nights.
        value: length > 0 ? Math.round((total * nights) / length) : 0,
        arrives: stay.checkIn >= from && stay.checkIn < to,
      };
    })
    .filter((entry) => entry.nights > 0);

  const gross = inMonth.reduce((sum, entry) => sum + entry.value, 0);
  const estimated = inMonth.reduce((sum, entry) => sum + (entry.estimated ? entry.value : 0), 0);
  const bookedNights = inMonth.reduce((sum, entry) => sum + entry.nights, 0);

  const chargeLines = charges
    .filter((charge) =>
      charge.frequency === "once"
        ? charge.startsOn >= from && charge.startsOn < to
        : isActive(charge, from, to),
    )
    .map((charge) => {
      const matching = inMonth.filter(
        (entry) =>
          (charge.propertyId == null || charge.propertyId === entry.stay.propertyId) &&
          (charge.appliesTo === "all" || charge.appliesTo === entry.stay.source),
      );
      const amount = (() => {
        switch (charge.frequency) {
          case "once":
          case "monthly":
            return charge.amount;
          case "yearly":
            return Math.round(charge.amount / 12);
          case "per_stay":
            return charge.amount * matching.filter((entry) => entry.arrives).length;
          case "per_night":
            return charge.amount * matching.reduce((sum, entry) => sum + entry.nights, 0);
          case "percent":
            return Math.round(
              (matching.reduce((sum, entry) => sum + entry.value, 0) * charge.amount) / 10_000,
            );
        }
      })();
      return { id: charge.id, label: charge.label, category: charge.category, amount };
    })
    .filter((line) => line.amount !== 0);

  const totalCharges = chargeLines.reduce((sum, line) => sum + line.amount, 0);
  const availableNights = diffDays(from, to) * rates.length;

  return {
    month,
    gross,
    estimated,
    charges: totalCharges,
    net: gross - totalCharges,
    chargeLines,
    bookedNights,
    availableNights,
    occupancy: availableNights > 0 ? bookedNights / availableNights : 0,
    arrivals: inMonth.filter((entry) => entry.arrives).length,
  };
}

/**
 * One year from its twelve months. The result has the shape of a month's
 * summary, with the year ("2026") where the month would be.
 */
export function summariseYear(year: string, stays: Stay[], charges: Cost[], rates: Rate[]): MonthSummary {
  const months = Array.from({ length: 12 }, (_, i) =>
    summariseMonth(`${year}-${String(i + 1).padStart(2, "0")}`, stays, charges, rates),
  );
  const sum = (pick: (summary: MonthSummary) => number) =>
    months.reduce((total, summary) => total + pick(summary), 0);
  const bookedNights = sum((summary) => summary.bookedNights);
  const availableNights = sum((summary) => summary.availableNights);
  const lines = new Map<number, MonthSummary["chargeLines"][number]>();
  for (const line of months.flatMap((summary) => summary.chargeLines)) {
    const known = lines.get(line.id);
    lines.set(line.id, known ? { ...known, amount: known.amount + line.amount } : line);
  }
  return {
    month: year,
    gross: sum((summary) => summary.gross),
    estimated: sum((summary) => summary.estimated),
    charges: sum((summary) => summary.charges),
    net: sum((summary) => summary.net),
    chargeLines: [...lines.values()],
    bookedNights,
    availableNights,
    occupancy: availableNights > 0 ? bookedNights / availableNights : 0,
    arrivals: sum((summary) => summary.arrivals),
  };
}

/** Share of nights booked in the `days` days starting at `from`, per property. */
export function occupancyAhead(propertyId: number, stays: Stay[], from: ISODate, days: number): number {
  const to = addDays(from, days);
  const booked = stays
    .filter((stay) => stay.propertyId === propertyId)
    .reduce((sum, stay) => sum + nightsWithin(stay, from, to), 0);
  return Math.min(1, booked / days);
}
