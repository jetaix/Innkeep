import type { Loan, LoanPayment } from "@/db/schema";
import type { ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";
import { addMonths, type Cost, monthOf } from "./compute";

/**
 * Loans repaid in equal monthly payments (the usual mortgage). Pure, like
 * the revenue maths: a loan becomes one monthly cost from its first payment
 * to its last, so every figure built on costs counts it without knowing.
 */
type Terms = Pick<Loan, "principal" | "rate" | "months" | "insurance" | "startsOn"> & {
  payment?: Minor | null;
};
/** A line of the bank's own table (see `schedule.ts`). */
type Line = Pick<LoanPayment, "date" | "interest" | "capital" | "insurance" | "remaining">;

/** The monthly rate as a ratio: 385 basis points a year is 0.0385 / 12. */
const monthly = (rate: number) => rate / 10_000 / 12;

/** What is paid each month for capital and interest, before insurance. */
export function monthlyPayment(loan: Pick<Loan, "principal" | "rate" | "months">): Minor {
  if (loan.months <= 0) return 0;
  const r = monthly(loan.rate);
  if (r === 0) return Math.round(loan.principal / loan.months);
  return Math.round((loan.principal * r) / (1 - (1 + r) ** -loan.months));
}

/**
 * What leaves the account each month, insurance included: the amount the
 * borrower typed, which is the bank's own figure. Only a loan entered without
 * it falls back on the payment computed from the amount, the rate and the duration.
 */
export function monthlyCost(
  loan: Pick<Loan, "principal" | "rate" | "months" | "insurance"> & { payment?: Minor | null },
): Minor {
  return loan.payment ?? monthlyPayment(loan) + loan.insurance;
}

/**
 * Capital still owed once `paid` payments have been made. `payment` is what
 * goes to capital and interest each month when the borrower gave it.
 */
export function balanceAfter(
  loan: Pick<Loan, "principal" | "rate" | "months">,
  paid: number,
  payment?: Minor,
): Minor {
  if (paid >= loan.months) return 0;
  if (paid <= 0) return loan.principal;
  const r = monthly(loan.rate);
  if (r === 0) {
    const each = payment ?? loan.principal / loan.months;
    return Math.max(0, Math.round(loan.principal - each * paid));
  }
  const growth = (1 + r) ** paid;
  const each = payment ?? (loan.principal * r) / (1 - (1 + r) ** -loan.months);
  return Math.max(0, Math.round(loan.principal * growth - (each * (growth - 1)) / r));
}

/** The month of the last payment. */
export function lastPaymentMonth(loan: Pick<Loan, "months" | "startsOn">): string {
  return addMonths(monthOf(loan.startsOn), Math.max(0, loan.months - 1));
}

export type LoanState = {
  /** How many payments the loan has in all. */
  total: number;
  /** Capital and interest each month. */
  payment: Minor;
  /** The payment with insurance: what leaves the account each month. */
  monthlyCost: Minor;
  /** Payments made up to and including today. */
  paid: number;
  /** Capital still owed today. */
  remaining: Minor;
  /** Interest over the whole loan. */
  interest: Minor;
  /** Interest and insurance over the whole loan: what borrowing costs. */
  cost: Minor;
  /** Of this month's payment, the interest part and the capital part. Zero outside the loan's life. */
  interestNow: Minor;
  capitalNow: Minor;
  lastMonth: string;
  finished: boolean;
};

/**
 * Where a loan stands on a given day. With the bank's table, every figure
 * comes from it; without, from the amount, the rate and the duration.
 */
export function loanState(loan: Terms, today: ISODate, schedule: Line[] = []): LoanState {
  if (schedule.length > 0) return stateFromSchedule(loan, today, schedule);
  // Capital and interest: what the borrower pays each month, less the insurance in it.
  const typed = loan.payment != null ? Math.max(0, loan.payment - loan.insurance) : undefined;
  const payment = typed ?? monthlyPayment(loan);
  const months = Math.max(0, loan.months);
  const [year, month, day] = today.split("-").map(Number);
  const [startYear, startMonth, startDay] = loan.startsOn.split("-").map(Number);
  // One payment per month, on the day of the first one.
  const elapsed = (year - startYear) * 12 + (month - startMonth) + (day >= startDay ? 1 : 0);
  const paid = Math.min(months, Math.max(0, elapsed));
  const remaining = balanceAfter(loan, paid, typed);
  const interest = Math.max(0, payment * months - loan.principal);
  // The payment of the month we are in: the one just made, or the one about to be.
  const running = monthOf(today) >= monthOf(loan.startsOn) && monthOf(today) <= lastPaymentMonth(loan);
  const before = balanceAfter(loan, (year - startYear) * 12 + (month - startMonth), typed);
  const interestNow = running ? Math.min(payment, Math.round(before * monthly(loan.rate))) : 0;
  return {
    total: months,
    payment,
    monthlyCost: monthlyCost(loan),
    paid,
    remaining,
    interest,
    cost: interest + loan.insurance * months,
    interestNow,
    capitalNow: running ? payment - interestNow : 0,
    lastMonth: lastPaymentMonth(loan),
    finished: paid >= months,
  };
}

function stateFromSchedule(loan: Terms, today: ISODate, schedule: Line[]): LoanState {
  const lines = [...schedule].sort((a, b) => (a.date < b.date ? -1 : 1));
  const done = lines.filter((line) => line.date <= today);
  const sum = (rows: Line[], pick: (line: Line) => number) => rows.reduce((all, line) => all + pick(line), 0);
  // This month's payment, or failing that the next one, or the last.
  const current =
    lines.find((line) => monthOf(line.date) === monthOf(today)) ??
    lines.find((line) => line.date > today) ??
    lines[lines.length - 1];
  const running = monthOf(current.date) === monthOf(today);
  const lastDone = done[done.length - 1];
  const interest = sum(lines, (line) => line.interest);
  // What was owed before the first line: the table's balance plus that line's capital, or the amount borrowed.
  const atStart = lines[0].remaining != null ? lines[0].remaining + lines[0].capital : loan.principal;
  return {
    total: lines.length,
    payment: current.interest + current.capital,
    monthlyCost: current.interest + current.capital + current.insurance,
    paid: done.length,
    // The table's own balance when it has one; otherwise what the capital paid leaves.
    remaining: lastDone?.remaining ?? Math.max(0, atStart - sum(done, (line) => line.capital)),
    interest,
    cost: interest + sum(lines, (line) => line.insurance),
    interestNow: running ? current.interest : 0,
    capitalNow: running ? current.capital : 0,
    lastMonth: monthOf(lines[lines.length - 1].date),
    finished: done.length === lines.length,
  };
}

type CostedLoan = Pick<
  Loan,
  "id" | "propertyId" | "label" | "principal" | "rate" | "months" | "insurance" | "startsOn"
> & { payment?: Minor | null; schedule?: Line[] };

/**
 * Each loan as a cost of its months. Without the bank's table: the payment
 * the borrower typed, every month from the first to the last. With it: what the table
 * says for each month. Ids are negative so they never meet a charge's.
 */
export function loanCosts(loans: CostedLoan[]): Cost[] {
  return loans.flatMap((loan) =>
    loan.schedule?.length ? scheduleCosts(loan, loan.schedule) : computedCosts(loan),
  );
}

function scheduleCosts(loan: CostedLoan, schedule: Line[]): Cost[] {
  const months = new Map<string, number>();
  for (const line of schedule) {
    const month = monthOf(line.date);
    months.set(month, (months.get(month) ?? 0) + line.interest + line.capital + line.insurance);
  }
  // A table printed part-way through the loan says nothing of the months before it: those keep the computed payment.
  const first = [...months.keys()].sort()[0];
  const earlier = computedCosts(loan)
    .filter((cost) => monthOf(cost.startsOn) < first)
    .map((cost) => ({ ...cost, endsOn: `${addMonths(first, -1)}-01` }));
  return [
    ...earlier,
    ...[...months].map(
      ([month, amount]): Cost => ({
        id: -loan.id,
        propertyId: loan.propertyId,
        label: loan.label,
        category: "loan",
        frequency: "once",
        amount,
        appliesTo: "all",
        startsOn: `${month}-01`,
        endsOn: null,
      }),
    ),
  ];
}

function computedCosts(loan: CostedLoan): Cost[] {
  return [loan]
    .filter((loan) => loan.months > 0)
    .map((loan) => ({
      id: -loan.id,
      propertyId: loan.propertyId,
      label: loan.label,
      category: "loan",
      frequency: "monthly",
      amount: monthlyCost(loan),
      appliesTo: "all",
      startsOn: `${monthOf(loan.startsOn)}-01`,
      endsOn: `${lastPaymentMonth(loan)}-01`,
    }));
}
