"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, reservations } from "@/db";
import { isoDate, parseForm, text, wholeNumber } from "@/lib/form";
import { parseMoney } from "@/lib/money";

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

export async function createReservation(returnTo: string, form: FormData) {
  const parsed = parseForm(newStay, form);
  if (!parsed.success) return;
  const { amount, ...values } = parsed.data;

  await (await getDb())
    .insert(reservations)
    .values({
      ...values,
      source: "direct",
      amount: values.kind === "reservation" ? parseMoney(amount) : null,
      createdAt: Date.now(),
    })
    .run();
  redirect(returnTo);
}

const stayEdit = z.object({
  guestName: text.default(""),
  notes: text.default(""),
  amount: text.default(""),
});

export async function updateReservation(id: number, returnTo: string, form: FormData) {
  const db = getDb();
  const existing = await db.select().from(reservations).where(eq(reservations.id, id)).get();
  const parsed = parseForm(stayEdit, form);
  if (!existing || !parsed.success) return;

  const changes: Partial<typeof reservations.$inferInsert> = {
    guestName: parsed.data.guestName,
    notes: parsed.data.notes,
    amount: parseMoney(parsed.data.amount),
  };
  // Dates of channel bookings belong to the channel; the next sync would undo an edit.
  if (existing.source === "direct") {
    const dates = parseForm(stayDates, form);
    if (!dates.success) return;
    Object.assign(changes, dates.data);
  }
  await db.update(reservations).set(changes).where(eq(reservations.id, id)).run();
  redirect(returnTo);
}

export async function deleteReservation(id: number, returnTo: string) {
  await (await getDb())
    .delete(reservations)
    .where(and(eq(reservations.id, id), eq(reservations.source, "direct")))
    .run();
  redirect(returnTo);
}
