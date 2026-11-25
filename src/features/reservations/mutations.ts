import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, reservations } from "@/db";
import { InvalidInput, isoDate, parse, text, wholeNumber } from "@/lib/form";
import { parseMoney } from "@/lib/money";

/** Changes to stays and blocked dates. Called by the Next.js actions and by the API; no framework in here. */
const stayDates = z
  .object({ checkIn: isoDate, checkOut: isoDate })
  .refine((value) => value.checkOut > value.checkIn, { path: ["checkOut"] });

const newStay = z
  .object({
    propertyId: wholeNumber(1),
    kind: z.enum(["reservation", "block"]),
    guestName: text.default(""),
    notes: text.default(""),
    amount: text.default(""),
  })
  .and(stayDates);

export async function createReservation(input: unknown) {
  const { amount, ...values } = parse(newStay, input);
  const row = await getDb()
    .insert(reservations)
    .values({
      ...values,
      source: "direct",
      amount: values.kind === "reservation" ? parseMoney(amount) : null,
      createdAt: Date.now(),
    })
    .returning({ id: reservations.id })
    .get();
  return row.id;
}

const stayEdit = z.object({
  guestName: text.default(""),
  notes: text.default(""),
  amount: text.default(""),
});

export async function updateReservation(id: number, input: unknown) {
  const db = getDb();
  const existing = await db.select().from(reservations).where(eq(reservations.id, id)).get();
  if (!existing) throw new InvalidInput("id");
  const data = parse(stayEdit, input);

  const changes: Partial<typeof reservations.$inferInsert> = {
    guestName: data.guestName,
    notes: data.notes,
    amount: parseMoney(data.amount),
  };
  // Dates of channel bookings belong to the channel; the next sync would undo an edit.
  if (existing.source === "direct") Object.assign(changes, parse(stayDates, input));
  await db.update(reservations).set(changes).where(eq(reservations.id, id)).run();
}

/** Only a stay the host added can be removed; a platform's booking comes back at the next sync. */
export async function deleteReservation(id: number) {
  await getDb()
    .delete(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.source, "direct")))
    .run();
}
