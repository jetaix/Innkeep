import type { Charge, Property, Reservation } from "@/db/schema";
import { addMonths, monthOf, monthStart, stayValue, summariseMonth } from "@/features/revenue/compute";
import { diffDays, type ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";

/**
 * The reservations in two figures each way: what the last twelve months
 * brought, and what the stays already booked should bring. Pure, like the
 * revenue maths it is built on, so the same costs are counted the same way.
 */
type Stay = Pick<
  Reservation,
  "propertyId" | "source" | "checkIn" | "checkOut" | "amount" | "channelFees" | "kind" | "status"
>;
type Cost = Parameters<typeof summariseMonth>[2][number];
type Rate = Pick<Property, "id" | "basePrice">;

export type StaysTotal = {
  stays: number;
  nights: number;
  /** Payouts, with the nightly rate standing in where a payout is not known. */
  revenue: Minor;
  /** Part of `revenue` that is such an estimate. */
  estimated: Minor;
  /** What the platforms kept, on the stays where they said so. Already out of `revenue`. */
  platformFees: Minor;
  /** The host's own costs for the period: cleaning, rent, insurance and the like. */
  costs: Minor;
  net: Minor;
  /** Null when there is no stay to judge: costs alone say nothing about the bookings. */
  profitable: boolean | null;
};

/** Costs that run whether or not anyone stays. */
const FIXED: Charge["frequency"][] = ["once", "monthly", "yearly"];

function total(
  stays: Stay[],
  months: string[],
  charges: Cost[],
  rates: Rate[],
  fixedFrom: string,
): StaysTotal {
  const costs = months.reduce((sum, month) => {
    // A month's fixed costs are counted once, on the side of the month they belong to.
    const counted =
      month >= fixedFrom ? charges : charges.filter((charge) => !FIXED.includes(charge.frequency));
    return sum + summariseMonth(month, stays, counted, rates).charges;
  }, 0);
  const values = stays.map((stay) => stayValue(stay, rates));
  const revenue = values.reduce((sum, value) => sum + value.total, 0);
  const net = revenue - costs;
  return {
    stays: stays.length,
    nights: stays.reduce((sum, stay) => sum + diffDays(stay.checkIn, stay.checkOut), 0),
    revenue,
    estimated: values.reduce((sum, value) => sum + (value.estimated ? value.total : 0), 0),
    platformFees: stays.reduce((sum, stay) => sum + (stay.channelFees ?? 0), 0),
    costs,
    net,
    profitable: stays.length === 0 ? null : net > 0,
  };
}

export function reservationsOverview(input: {
  today: ISODate;
  /** Every stay that ended in the last twelve months or has not ended yet. */
  stays: Stay[];
  charges: Cost[];
  properties: Rate[];
}): { past: StaysTotal; upcoming: StaysTotal; since: ISODate } {
  const { today, charges, properties } = input;
  const current = monthOf(today);
  const first = addMonths(current, -11);
  const since = monthStart(first);
  const guests = input.stays.filter((stay) => stay.kind === "reservation" && stay.status === "confirmed");

  const past = guests.filter((stay) => stay.checkOut <= today && stay.checkOut > since);
  const upcoming = guests.filter((stay) => stay.checkOut > today);
  const lastMonth = upcoming.reduce(
    (latest, stay) => (monthOf(stay.checkOut) > latest ? monthOf(stay.checkOut) : latest),
    current,
  );

  const span = (from: string, to: string) => {
    const months: string[] = [];
    for (let month = from; month <= to; month = addMonths(month, 1)) months.push(month);
    return months;
  };
  return {
    since,
    // The current month's rent and insurance are already running: they sit with the past.
    past: total(past, span(first, current), charges, properties, first),
    upcoming: total(upcoming, span(current, lastMonth), charges, properties, addMonths(current, 1)),
  };
}
