"use server";

import { refresh } from "next/cache";
import { hostOnly } from "@/db";
import { applied, fields, InvalidInput } from "@/lib/form";
import * as change from "./mutations";

export type { TelegramChatsState, TelegramTestState } from "./mutations";

export async function addCleaner(form: FormData) {
  if (await applied(() => change.addCleaner(fields(form)))) refresh();
}

export async function deleteCleaner(id: number) {
  await change.deleteCleaner(id);
  refresh();
}

/** Sets who cleans a property: priority 0 is the usual cleaner, 1 the backup. An empty choice clears it. */
export async function assignCleaner(propertyId: number, priority: number, form: FormData) {
  if (await applied(() => change.assignCleaner(propertyId, priority, fields(form)))) refresh();
}

export async function setCleaningEnabled(propertyId: number, enabled: boolean) {
  await change.setCleaningEnabled(propertyId, enabled);
  refresh();
}

export async function setCleaningStatus(propertyId: number, date: string, status: string) {
  if (await applied(() => change.setCleaningStatus(propertyId, date, status))) refresh();
}

/** Records where the host stands with the cleaner: not asked, waiting for an answer, or agreed. */
export async function setCleaningRequest(propertyId: number, date: string, request: string) {
  if (await applied(() => change.setCleaningRequest(propertyId, date, request))) refresh();
}

/** The note for the cleaner, and who does this one when it is not the usual cleaner. */
export async function updateCleaning(propertyId: number, date: string, form: FormData) {
  if (await applied(() => change.updateCleaning(propertyId, date, fields(form)))) refresh();
}

export async function addManualCleaning(form: FormData) {
  if (await applied(() => change.addManualCleaning(fields(form)))) refresh();
}

/** Removes a cleaning the host added by hand. */
export async function removeManualCleaning(propertyId: number, date: string) {
  await change.removeManualCleaning(propertyId, date);
  refresh();
}

/** Checks the Telegram settings with a real message, then sends whatever is waiting. */
export async function sendTelegramTest(): Promise<change.TelegramTestState> {
  await hostOnly();
  return change.sendTelegramTest();
}

/** Asks Telegram which chats the bot was recently written to in. */
export async function findTelegramChatsAction(): Promise<change.TelegramChatsState> {
  await hostOnly();
  return change.listTelegramChats();
}

/** Keeps the chat the host picked, and proves it works with a first message. */
export async function chooseTelegramChat(form: FormData) {
  await hostOnly();
  try {
    if (await change.chooseTelegramChat(fields(form))) refresh();
  } catch (error) {
    if (!(error instanceof InvalidInput)) throw error;
  }
}
