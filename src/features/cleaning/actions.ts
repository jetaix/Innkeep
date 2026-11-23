"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { cleanerAssignments, cleaners, cleanings, CLEANING_STATUSES, getDb, properties } from "@/db";
import { MESSAGES } from "@/i18n/messages";
import { isoDate, parseForm, text } from "@/lib/form";
import { sendTelegram } from "@/lib/telegram";
import { notifyCleanings, telegramLocale } from "./notify";

const day = z.object({ propertyId: z.coerce.number().int().positive(), date: isoDate });

/** Creates the record of a cleaning day if there is none, then changes it. */
async function upsertCleaning(
  propertyId: number,
  date: string,
  changes: Partial<typeof cleanings.$inferInsert>,
) {
  await (await getDb())
    .insert(cleanings)
    .values({ propertyId, date, ...changes })
    .onConflictDoUpdate({ target: [cleanings.propertyId, cleanings.date], set: changes })
    .run();
}

export async function addCleaner(form: FormData) {
  const parsed = parseForm(z.object({ name: text.min(1).max(80), phone: text.max(40) }), form);
  if (!parsed.success) return;
  await (await getDb())
    .insert(cleaners)
    .values({ ...parsed.data, createdAt: Date.now() })
    .run();
  refresh();
}

export async function deleteCleaner(id: number) {
  await getDb().delete(cleaners).where(eq(cleaners.id, id)).run();
  refresh();
}

/** Sets who cleans a property: priority 0 is the usual cleaner, 1 the backup. An empty choice clears it. */
export async function assignCleaner(propertyId: number, priority: number, form: FormData) {
  const parsed = parseForm(
    z.object({ cleanerId: z.union([z.literal(""), z.coerce.number().int().positive()]) }),
    form,
  );
  if (!parsed.success || ![0, 1].includes(priority)) return;
  const db = getDb();
  const { cleanerId } = parsed.data;
  await db.transaction(async (tx) => {
    await tx
      .delete(cleanerAssignments)
      .where(and(eq(cleanerAssignments.propertyId, propertyId), eq(cleanerAssignments.priority, priority)))
      .run();
    if (cleanerId !== "")
      await tx.insert(cleanerAssignments).values({ propertyId, cleanerId, priority }).run();
  });
  refresh();
}

export async function setCleaningEnabled(propertyId: number, enabled: boolean) {
  await (await getDb())
    .update(properties)
    .set({ cleaningEnabled: enabled })
    .where(eq(properties.id, propertyId))
    .run();
  refresh();
}

export async function setCleaningStatus(propertyId: number, date: string, status: string) {
  const parsed = z
    .object({ ...day.shape, status: z.enum(CLEANING_STATUSES) })
    .safeParse({ propertyId, date, status });
  if (!parsed.success) return;
  await upsertCleaning(parsed.data.propertyId, parsed.data.date, {
    status: parsed.data.status,
    doneAt: parsed.data.status === "done" ? Date.now() : null,
  });
  refresh();
}

/** The note for the cleaner, and who does this one when it is not the usual cleaner. */
export async function updateCleaning(propertyId: number, date: string, form: FormData) {
  const where = day.safeParse({ propertyId, date });
  const parsed = parseForm(
    z.object({
      notes: text.max(500),
      cleanerId: z.union([z.literal(""), z.coerce.number().int().positive()]),
    }),
    form,
  );
  if (!where.success || !parsed.success) return;
  await upsertCleaning(where.data.propertyId, where.data.date, {
    notes: parsed.data.notes,
    cleanerId: parsed.data.cleanerId === "" ? null : parsed.data.cleanerId,
  });
  refresh();
}

export async function addManualCleaning(form: FormData) {
  const parsed = parseForm(z.object({ ...day.shape, notes: text.max(500) }), form);
  if (!parsed.success) return;
  const { propertyId, date, notes } = parsed.data;
  await (await getDb())
    .insert(cleanings)
    .values({ propertyId, date, notes, manual: true })
    .onConflictDoUpdate({ target: [cleanings.propertyId, cleanings.date], set: { manual: true, notes } })
    .run();
  refresh();
}

/** Removes a cleaning the host added by hand. */
export async function removeManualCleaning(propertyId: number, date: string) {
  await (await getDb())
    .delete(cleanings)
    .where(and(eq(cleanings.propertyId, propertyId), eq(cleanings.date, date), eq(cleanings.manual, true)))
    .run();
  refresh();
}

export type TelegramTestState = { sent: boolean; error: string | null };

/** Checks the Telegram settings with a real message, then sends whatever is waiting. */
export async function sendTelegramTest(): Promise<TelegramTestState> {
  try {
    await sendTelegram(MESSAGES[telegramLocale()].cleaning.telegram.test);
    await notifyCleanings();
    return { sent: true, error: null };
  } catch (cause) {
    return { sent: false, error: cause instanceof Error ? cause.message : String(cause) };
  }
}
