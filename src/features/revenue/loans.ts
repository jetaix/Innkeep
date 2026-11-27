import type { Loan } from "@/db/schema";
import type { ISODate } from "@/lib/dates";
import type { Minor } from "@/lib/money";
import { addMonths, type Cost, monthOf } from "./compute";

/**
 * Loans repaid in equal monthly payments (the usual mortgage). Pure, like
 * the revenue maths: a loan becomes one monthly cost from its first payment
 * to its last, so every figure built on costs counts it without knowing.
 */
type Terms = Pick<Loan, "principal" | "rate" | "months" | "insurance" | "startsOn">;

/** The monthly rate as a ratio: 385 basis points a year is 0.0385 / 12. */
const monthly = (rate: number) => rate / 10_000 / 12;

/** What is paid each month for capital and interest, before insurance. */
export function monthlyPayment(loan: Pick<Loan, "principal" | "rate" | "months">): Minor {
  if (loan.months <= 0) return 0;
  const r = monthly(loan.rate);
  if (r === 0) return Math.round(loan.principal / loan.months);
  return Math.round((loan.principal * r) / (1 - (1 + r) ** -loan.months));
}

/** Capital still owed once `paid` payments have been made. */
export function balanceAfter(loan: Pick<Loan, "principal" | "rate" | "months">, paid: number): Minor {
  if (paid >= loan.months) return 0;
  if (paid <= 0) return loan.principal;
  const r = monthly(loan.rate);
  if (r === 0) return Math.round(loan.principal * (1 - paid / loan.months));
  const growth = (1 + r) ** paid;
  const payment = (loan.principal * r) / (1 - (1 + r) ** -loan.months);
  return Math.max(0, Math.round(loan.principal * growth - (payment * (growth - 1)) / r));
}

/** The month of the last payment. */
export function lastPaymentMonth(loan: Pick<Loan, "months" | "startsOn">): string {
  return addMonths(monthOf(loan.startsOn), Math.max(0, loan.months - 1));
}

export type LoanState = {
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

/** Where a loan stands on a given day. */
export function loanState(loan: Terms, today: ISODate): LoanState {
  const payment = monthlyPayment(loan);
  const months = Math.max(0, loan.months);
  const [year, month, day] = today.split("-").map(Number);
  const [startYear, startMonth, startDay] = loan.startsOn.split("-").map(Number);
  // One payment per month, on the day of the first one.
  const elapsed = (year - startYear) * 12 + (month - startMonth) + (day >= startDay ? 1 : 0);
  const paid = Math.min(months, Math.max(0, elapsed));
  const remaining = balanceAfter(loan, paid);
  const interest = Math.max(0, payment * months - loan.principal);
  // The payment of the month we are in: the one just made, or the one about to be.
  const running = monthOf(today) >= monthOf(loan.startsOn) && monthOf(today) <= lastPaymentMonth(loan);
  const before = balanceAfter(loan, (year - startYear) * 12 + (month - startMonth));
  const interestNow = running ? Math.min(payment, Math.round(before * monthly(loan.rate))) : 0;
  return {
    payment,
    monthlyCost: payment + loan.insurance,
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

/**
 * Each loan as a monthly cost, from the month of its first payment to the
 * month of its last. Ids are negative so they never meet a charge's.
 */
export function loanCosts(
  loans: Pick<
    Loan,
    "id" | "propertyId" | "label" | "principal" | "rate" | "months" | "insurance" | "startsOn"
  >[],
): Cost[] {
  return loans
    .filter((loan) => loan.months > 0)
    .map((loan) => ({
      id: -loan.id,
      propertyId: loan.propertyId,
      label: loan.label,
      category: "loan",
      frequency: "monthly",
      amount: monthlyPayment(loan) + loan.insurance,
      appliesTo: "all",
      startsOn: `${monthOf(loan.startsOn)}-01`,
      endsOn: `${lastPaymentMonth(loan)}-01`,
    }));
}
