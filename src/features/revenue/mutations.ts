import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  CHARGE_CATEGORIES,
  CHARGE_FREQUENCIES,
  charges,
  getDb,
  loanPayments,
  loans,
  OTA_CHANNELS,
} from "@/db";
import { blankAsNull, InvalidInput, isoDate, parse, text, wholeNumber } from "@/lib/form";
import { parseMoney } from "@/lib/money";
import { parseSchedule } from "./schedule";

/** Changes to the costs. Called by the API; no framework in here. */
const newCharge = z.object({
  label: text.min(1),
  category: z.enum(CHARGE_CATEGORIES),
  frequency: z.enum(CHARGE_FREQUENCIES),
  amount: text.min(1),
  appliesTo: z.enum(["all", "direct", ...OTA_CHANNELS]),
  propertyId: blankAsNull(wholeNumber(1)),
  startsOn: isoDate,
  endsOn: blankAsNull(isoDate),
});

export async function addCharge(input: unknown) {
  const data = parse(newCharge, input);
  // Money is typed in major units ("55" = 55.00); a percentage as "15" = 15%.
  // Both are stored ×100, as cents and basis points.
  const amount = parseMoney(data.amount);
  if (amount == null || amount <= 0) throw new InvalidInput("amount");
  const row = await getDb()
    .insert(charges)
    .values({ ...data, amount, createdAt: Date.now() })
    .returning({ id: charges.id })
    .get();
  return row.id;
}

export async function deleteCharge(id: number) {
  await getDb().delete(charges).where(eq(charges.id, id)).run();
}

const newLoan = z.object({
  label: text.min(1),
  principal: text.min(1),
  rate: text.min(1),
  /** Typed in years: 20, or 12.5 for 150 months. */
  years: text.min(1),
  insurance: text,
  propertyId: blankAsNull(wholeNumber(1)),
  startsOn: isoDate,
});

/** "3,85" or "3.85" as a number; null when it is not one. */
function decimal(input: string): number | null {
  const value = Number(input.replace(/\s/g, "").replace(",", "."));
  return input.trim() !== "" && Number.isFinite(value) ? value : null;
}

export async function addLoan(input: unknown) {
  const data = parse(newLoan, input);
  const principal = parseMoney(data.principal);
  if (principal == null || principal <= 0) throw new InvalidInput("principal");
  // A rate of "3.85" is 385 basis points. Zero is a loan without interest.
  const rate = decimal(data.rate);
  if (rate == null || rate < 0 || rate > 30) throw new InvalidInput("rate");
  const years = decimal(data.years);
  const months = years == null ? 0 : Math.round(years * 12);
  if (months < 1 || months > 600) throw new InvalidInput("years");
  const insurance = data.insurance === "" ? 0 : parseMoney(data.insurance);
  if (insurance == null || insurance < 0) throw new InvalidInput("insurance");
  const row = await getDb()
    .insert(loans)
    .values({
      label: data.label,
      propertyId: data.propertyId,
      principal,
      rate: Math.round(rate * 100),
      months,
      insurance,
      startsOn: data.startsOn,
      createdAt: Date.now(),
    })
    .returning({ id: loans.id })
    .get();
  return row.id;
}

export async function deleteLoan(id: number) {
  await getDb().delete(loans).where(eq(loans.id, id)).run();
}

/** Longest table taken: fifty years of monthly payments. */
const MAX_LINES = 600;

/**
 * Replaces a loan's amortisation table with the one pasted or uploaded. From
 * then on the loan's costs are the bank's own figures, month by month.
 */
export async function importSchedule(loanId: number, input: unknown) {
  const { table } = parse(z.object({ table: z.string().max(200_000) }), input);
  const parsed = parseSchedule(table);
  // The field's name carries the reason: nothing dated in the text, or columns that could not be told apart.
  if (!parsed.ok) throw new InvalidInput(parsed.problem === "empty" ? "table-empty" : "table-columns");
  if (parsed.lines.length > MAX_LINES) throw new InvalidInput("table-columns");
  const db = getDb();
  const loan = await db.select({ id: loans.id }).from(loans).where(eq(loans.id, loanId)).get();
  if (!loan) throw new InvalidInput("loan");
  await db.batch([
    db.delete(loanPayments).where(eq(loanPayments.loanId, loanId)),
    db.insert(loanPayments).values(parsed.lines.map((line) => ({ ...line, loanId }))),
  ]);
  return parsed.lines.length;
}

/** Back to the payments computed from the amount, the rate and the duration. */
export async function clearSchedule(loanId: number) {
  await getDb().delete(loanPayments).where(eq(loanPayments.loanId, loanId)).run();
}
