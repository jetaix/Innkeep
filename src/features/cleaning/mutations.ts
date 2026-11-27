import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  CLEANING_REQUESTS,
  CLEANING_STATUSES,
  cleanerAssignments,
  cleaners,
  cleanings,
  getDb,
  properties,
} from "@/db";
import { MESSAGES } from "@/i18n/messages";
import { InvalidInput, isoDate, parse, text } from "@/lib/form";
import { findTelegramChats, sendTelegram, type TelegramChat } from "@/lib/telegram";
import { notifyCleanings, telegramLocale } from "./notify";
import { getTelegramChat, rememberMovedChat, saveTelegramChat } from "./telegram-chat";

/** Changes to cleanings, cleaners and the Telegram chat. Called by the API; no framework in here. */
const day = z.object({ propertyId: z.coerce.number().int().positive(), date: isoDate });
const cleanerChoice = z.union([z.literal(""), z.coerce.number().int().positive()]);

/** Creates the record of a cleaning day if there is none, then changes it. */
async function upsertCleaning(
  propertyId: number,
  date: string,
  changes: Partial<typeof cleanings.$inferInsert>,
) {
  await getDb()
    .insert(cleanings)
    .values({ propertyId, date, ...changes })
    .onConflictDoUpdate({ target: [cleanings.propertyId, cleanings.date], set: changes })
    .run();
}

export async function addCleaner(input: unknown) {
  const data = parse(z.object({ name: text.min(1).max(80), phone: text.max(40) }), input);
  const row = await getDb()
    .insert(cleaners)
    .values({ ...data, createdAt: Date.now() })
    .returning({ id: cleaners.id })
    .get();
  return row.id;
}

export async function deleteCleaner(id: number) {
  await getDb().delete(cleaners).where(eq(cleaners.id, id)).run();
}

/** Sets who cleans a property: priority 0 is the usual cleaner, 1 the backup. An empty choice clears it. */
export async function assignCleaner(propertyId: number, priority: number, input: unknown) {
  const { cleanerId } = parse(z.object({ cleanerId: cleanerChoice }), input);
  if (![0, 1].includes(priority)) throw new InvalidInput("priority");
  await getDb().transaction(async (tx) => {
    await tx
      .delete(cleanerAssignments)
      .where(and(eq(cleanerAssignments.propertyId, propertyId), eq(cleanerAssignments.priority, priority)))
      .run();
    if (cleanerId !== "")
      await tx.insert(cleanerAssignments).values({ propertyId, cleanerId, priority }).run();
  });
}

export async function setCleaningEnabled(propertyId: number, enabled: boolean) {
  await getDb()
    .update(properties)
    .set({ cleaningEnabled: enabled })
    .where(eq(properties.id, propertyId))
    .run();
}

export async function setCleaningStatus(propertyId: unknown, date: unknown, status: unknown) {
  const data = parse(z.object({ ...day.shape, status: z.enum(CLEANING_STATUSES) }), {
    propertyId,
    date,
    status,
  });
  await upsertCleaning(data.propertyId, data.date, {
    status: data.status,
    doneAt: data.status === "done" ? Date.now() : null,
  });
}

/** Records where the host stands with the cleaner: not asked, waiting for an answer, or agreed. */
export async function setCleaningRequest(propertyId: unknown, date: unknown, request: unknown) {
  const data = parse(z.object({ ...day.shape, request: z.enum(CLEANING_REQUESTS) }), {
    propertyId,
    date,
    request,
  });
  await upsertCleaning(data.propertyId, data.date, { request: data.request });
}

/** The note for the cleaner, and who does this one when it is not the usual cleaner. */
export async function updateCleaning(propertyId: unknown, date: unknown, input: unknown) {
  const where = parse(day, { propertyId, date });
  const data = parse(z.object({ notes: text.max(500), cleanerId: cleanerChoice }), input);
  await upsertCleaning(where.propertyId, where.date, {
    notes: data.notes,
    cleanerId: data.cleanerId === "" ? null : data.cleanerId,
  });
}

export async function addManualCleaning(input: unknown) {
  const { propertyId, date, notes } = parse(z.object({ ...day.shape, notes: text.max(500) }), input);
  await getDb()
    .insert(cleanings)
    .values({ propertyId, date, notes, manual: true })
    .onConflictDoUpdate({ target: [cleanings.propertyId, cleanings.date], set: { manual: true, notes } })
    .run();
}

/** Removes a cleaning the host added by hand. */
export async function removeManualCleaning(propertyId: number, date: string) {
  await getDb()
    .delete(cleanings)
    .where(and(eq(cleanings.propertyId, propertyId), eq(cleanings.date, date), eq(cleanings.manual, true)))
    .run();
}

export type TelegramTestState = { sent: boolean; error: string | null };

/** Checks the Telegram settings with a real message, then sends whatever is waiting. */
export async function sendTelegramTest(): Promise<TelegramTestState> {
  try {
    await sendTelegram(
      MESSAGES[telegramLocale()].cleaning.telegram.test,
      (await getTelegramChat())?.id ?? null,
      rememberMovedChat,
    );
    await notifyCleanings();
    return { sent: true, error: null };
  } catch (cause) {
    return { sent: false, error: cause instanceof Error ? cause.message : String(cause) };
  }
}

export type TelegramChatsState = { chats: TelegramChat[] | null; error: string | null };

/** Asks Telegram which chats the bot was recently written to in. */
export async function listTelegramChats(): Promise<TelegramChatsState> {
  try {
    return { chats: await findTelegramChats(), error: null };
  } catch (cause) {
    return { chats: null, error: cause instanceof Error ? cause.message : String(cause) };
  }
}

const chosenChat = z.object({ id: z.string().regex(/^-?\d{3,20}$/), title: text.max(80) });

/** Keeps the chat the host picked, and proves it works with a first message. Returns whether it was kept. */
export async function chooseTelegramChat(input: unknown): Promise<boolean> {
  const data = parse(chosenChat, input);
  // Only a chat Telegram itself listed for this bot can be chosen.
  const listed = (await findTelegramChats().catch(() => [])).some((chat) => chat.id === data.id);
  if (!listed) return false;
  await saveTelegramChat(data);
  await sendTelegram(MESSAGES[telegramLocale()].cleaning.telegram.test, data.id).catch(() => {});
  return true;
}
