import "server-only";
import { asc } from "drizzle-orm";
import { charges, getDb } from "@/db";
import { getProperties, getStays } from "@/features/reservations/queries";
import { today } from "@/lib/dates";
import { addMonths, monthOf, monthStart, summariseMonth, summariseYear, type Month } from "./compute";

export async function getCharges() {
  return await getDb().select().from(charges).orderBy(asc(charges.createdAt)).all();
}

/** Monthly summaries from `monthsBack` months ago to `monthsAhead` months ahead. */
export async function getRevenue({ monthsBack = 1, monthsAhead = 4 } = {}) {
  const properties = await getProperties();
  const allCharges = await getCharges();
  const current = monthOf(today());
  const first = addMonths(current, -monthsBack);
  const months: Month[] = Array.from({ length: monthsBack + monthsAhead + 1 }, (_, i) => addMonths(first, i));

  const guestStays = (await getStays(monthStart(first))).filter((stay) => stay.kind === "reservation");
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

/** How far back the yearly view goes at most. */
const YEARS_BACK = 5;

/** One summary per calendar year, from the first year with a stay to the last booked one. */
export async function getRevenueYears() {
  const properties = await getProperties();
  const allCharges = await getCharges();
  const thisYear = Number(today().slice(0, 4));
  const guestStays = (await getStays(`${thisYear - YEARS_BACK}-01-01`)).filter(
    (stay) => stay.kind === "reservation",
  );
  const years = guestStays.flatMap((stay) => [
    Number(stay.checkIn.slice(0, 4)),
    Number(stay.checkOut.slice(0, 4)),
  ]);
  const first = Math.max(thisYear - YEARS_BACK, Math.min(thisYear, ...years));
  const last = Math.max(thisYear, ...years);
  return {
    currency: properties[0]?.currency ?? "EUR",
    current: String(thisYear),
    summaries: Array.from({ length: last - first + 1 }, (_, i) =>
      summariseYear(String(first + i), guestStays, allCharges, properties),
    ),
    charges: allCharges,
    properties,
  };
}
