import "server-only";
import { asc } from "drizzle-orm";
import { charges, getDb, type Loan, type LoanPayment, loanPayments, loans } from "@/db";
import { getProperties, getStays } from "@/features/reservations/queries";
import { today } from "@/lib/dates";
import {
  addMonths,
  type Cost,
  monthOf,
  monthStart,
  summariseMonth,
  summariseYear,
  type Month,
} from "./compute";
import { loanCosts } from "./loans";

export async function getCharges() {
  return await getDb().select().from(charges).orderBy(asc(charges.createdAt)).all();
}

/** A loan with the lines of its bank's table, when one was imported. */
export type LoanWithSchedule = Loan & { schedule: LoanPayment[] };

export async function getLoans(): Promise<LoanWithSchedule[]> {
  const db = getDb();
  const all = await db.select().from(loans).orderBy(asc(loans.createdAt)).all();
  const lines = await db.select().from(loanPayments).orderBy(asc(loanPayments.date)).all();
  return all.map((loan) => ({ ...loan, schedule: lines.filter((line) => line.loanId === loan.id) }));
}

/** Everything set against revenue: the charges, and each loan as its monthly payment. */
export async function getCosts(): Promise<Cost[]> {
  return [...(await getCharges()), ...loanCosts(await getLoans())];
}

/** Monthly summaries from `monthsBack` months ago to `monthsAhead` months ahead. */
export async function getRevenue({ monthsBack = 1, monthsAhead = 4 } = {}) {
  const properties = await getProperties();
  const allCharges = await getCharges();
  const allLoans = await getLoans();
  const costs = [...allCharges, ...loanCosts(allLoans)];
  const current = monthOf(today());
  const first = addMonths(current, -monthsBack);
  const months: Month[] = Array.from({ length: monthsBack + monthsAhead + 1 }, (_, i) => addMonths(first, i));

  const guestStays = (await getStays(monthStart(first))).filter((stay) => stay.kind === "reservation");
  const summaries = months.map((month) => summariseMonth(month, guestStays, costs, properties));

  return {
    // One currency for the whole account: the first property's.
    currency: properties[0]?.currency ?? "EUR",
    current,
    summaries,
    thisMonth: summaries[monthsBack],
    charges: allCharges,
    loans: allLoans,
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
  const allLoans = await getLoans();
  const costs = [...allCharges, ...loanCosts(allLoans)];
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
      summariseYear(String(first + i), guestStays, costs, properties),
    ),
    charges: allCharges,
    loans: allLoans,
    properties,
    guestStays,
  };
}
