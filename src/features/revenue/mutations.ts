import { eq } from "drizzle-orm";
import { z } from "zod";
import { CHARGE_CATEGORIES, CHARGE_FREQUENCIES, charges, getDb, OTA_CHANNELS } from "@/db";
import { blankAsNull, InvalidInput, isoDate, parse, text, wholeNumber } from "@/lib/form";
import { parseMoney } from "@/lib/money";

/** Changes to the costs. Called by the Next.js actions and by the API; no framework in here. */
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
