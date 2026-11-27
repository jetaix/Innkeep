import type { Property, Reservation } from "@/db/schema";
import type { ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";
import {
  addMonths,
  type Cost,
  type Month,
  monthOf,
  monthStart,
  nightsWithin,
  summariseMonth,
} from "./compute";

/**
 * Whether a property pays for itself: what its stays brought, less what it
 * costs to run and the loan that bought it, over the months it has been
 * rented. Pure, on the same month summaries as the rest of the revenue page.
 */
type Stay = Pick<Reservation, "propertyId" | "source" | "checkIn" | "checkOut" | "amount">;
type Rate = Pick<Property, "id" | "basePrice">;

export type Profit = {
  /** How many months are judged: from the first month with a stay to the current one, twelve at most. */
  months: number;
  /** Totals over those months. */
  income: Minor;
  /** Cleaning, commission, bills and the like: every cost that is not a loan. */
  charges: Minor;
  loan: Minor;
  net: Minor;
  /** The same, as what an average month looks like. */
  monthly: { income: Minor; charges: Minor; loan: Minor; net: Minor };
  /** Null when no stay has been recorded yet: costs alone say nothing. */
  profitable: boolean | null;
};

/** Costs that run whether or not anyone stays. One shared by every property is split between them. */
const FIXED: Cost["frequency"][] = ["once", "monthly", "yearly"];

export function propertyProfit(input: {
  today: ISODate;
  property: Rate;
  /** Every property of the account, to share the costs entered for all of them. */
  properties: Rate[];
  /** Confirmed guest stays, of any property. */
  stays: Stay[];
  costs: Cost[];
}): Profit {
  const { property } = input;
  const current = monthOf(input.today);
  const oldest = addMonths(current, -11);
  const stays = input.stays.filter((stay) => stay.propertyId === property.id);
  const share = Math.max(1, input.properties.length);
  const costs = input.costs
    .filter((cost) => cost.propertyId == null || cost.propertyId === property.id)
    .map((cost) =>
      cost.propertyId == null && FIXED.includes(cost.frequency)
        ? { ...cost, amount: Math.round(cost.amount / share) }
        : cost,
    );

  // Start at the first month with a night in it: empty months before the first booking would only count costs.
  const months: Month[] = [];
  for (let month = oldest; month <= current; month = addMonths(month, 1)) months.push(month);
  const first = months.find((month) =>
    stays.some((stay) => nightsWithin(stay, monthStart(month), monthStart(addMonths(month, 1))) > 0),
  );
  const judged = first ? months.filter((month) => month >= first) : [];

  let income = 0;
  let charges = 0;
  let loan = 0;
  for (const month of judged) {
    const summary = summariseMonth(month, stays, costs, [property]);
    income += summary.gross;
    for (const line of summary.chargeLines) {
      if (line.category === "loan") loan += line.amount;
      else charges += line.amount;
    }
  }
  const net = income - charges - loan;
  const each = (total: Minor) => (judged.length > 0 ? Math.round(total / judged.length) : 0);
  return {
    months: judged.length,
    income,
    charges,
    loan,
    net,
    monthly: { income: each(income), charges: each(charges), loan: each(loan), net: each(net) },
    profitable: judged.length === 0 ? null : net > 0,
  };
}
