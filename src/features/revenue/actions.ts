"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { CHARGE_CATEGORIES, CHARGE_FREQUENCIES, charges, getDb, OTA_CHANNELS } from "@/db";
import { blankAsNull, isoDate, parseForm, text, wholeNumber } from "@/lib/form";
import { parseMoney } from "@/lib/money";

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

export async function addCharge(form: FormData) {
  const parsed = parseForm(newCharge, form);
  if (!parsed.success) return;

  // Money is typed in major units ("55" = 55.00); a percentage as "15" = 15%.
  // Both are stored ×100, as cents and basis points.
  const amount = parseMoney(parsed.data.amount);
  if (amount == null || amount <= 0) return;

  await (
    await getDb()
  )
    .insert(charges)
    .values({ ...parsed.data, amount, createdAt: Date.now() })
    .run();
  refresh();
}

export async function deleteCharge(id: number) {
  await getDb().delete(charges).where(eq(charges.id, id)).run();
  refresh();
}
