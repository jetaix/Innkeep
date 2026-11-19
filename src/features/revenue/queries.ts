import "server-only";
import { asc } from "drizzle-orm";
import { charges, getDb } from "@/db";
import { getProperties, getStays } from "@/features/reservations/queries";
import { today } from "@/lib/dates";
import { addMonths, monthOf, monthStart, summariseMonth, type Month } from "./compute";

export function getCharges() {
  return getDb().select().from(charges).orderBy(asc(charges.createdAt)).all();
}

/** Monthly summaries from `monthsBack` months ago to `monthsAhead` months ahead. */
export function getRevenue({ monthsBack = 1, monthsAhead = 4 } = {}) {
  const properties = getProperties();
  const allCharges = getCharges();
  const current = monthOf(today());
  const first = addMonths(current, -monthsBack);
  const months: Month[] = Array.from({ length: monthsBack + monthsAhead + 1 }, (_, i) => addMonths(first, i));

  const guestStays = getStays(monthStart(first)).filter((stay) => stay.kind === "reservation");
  const summaries = months.map((month) => summariseMonth(month, guestStays, allCharges, properties));

  return {
    // One currency for the whole account: the first property's.
    currency: properties[0]?.currency ?? "EUR",
    current,
    summaries,
    thisMonth: summaries[monthsBack],
    charges: allCharges,
    properties,
    guestStays,
  };
}
