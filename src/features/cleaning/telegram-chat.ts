import "server-only";
import { eq } from "drizzle-orm";
import { appState, getDb } from "@/db";
import { telegramBot } from "@/lib/telegram";

/**
 * Where Telegram messages go. `TELEGRAM_CHAT_ID` set on the server wins;
 * otherwise the chat the host picked on the Settings page, kept with the rest
 * of their data so no number has to be looked up and typed.
 */
const KEY = "telegram-chat";

export type SavedChat = { id: string; title: string };

async function savedChat(): Promise<SavedChat | null> {
  const row = await getDb().select().from(appState).where(eq(appState.key, KEY)).get();
  if (!row) return null;
  try {
    const value = JSON.parse(row.value) as Partial<SavedChat>;
    return typeof value.id === "string" && value.id
      ? { id: value.id, title: String(value.title ?? "") }
      : null;
  } catch {
    return null;
  }
}

export async function getTelegramChat(): Promise<{
  id: string;
  title: string | null;
  source: "environment" | "saved";
} | null> {
  if (process.env.TELEGRAM_CHAT_ID) {
    return { id: process.env.TELEGRAM_CHAT_ID, title: null, source: "environment" };
  }
  const saved = await savedChat();
  return saved ? { ...saved, source: "saved" } : null;
}

export async function saveTelegramChat(chat: SavedChat) {
  const value = JSON.stringify(chat);
  await getDb()
    .insert(appState)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: appState.key, set: { value } })
    .run();
}

/** Whether a message can be sent: a bot, and a chat to write to. */
export async function telegramReady(): Promise<boolean> {
  return telegramBot() && (await getTelegramChat()) !== null;
}
