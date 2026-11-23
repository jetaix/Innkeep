/**
 * Messages to the host's own Telegram, through a bot they created with
 * @BotFather. The chat is a person or a group, so a couple can both receive
 * them. It comes from `TELEGRAM_CHAT_ID`, or from the group the host picked
 * on the Settings page (see `features/cleaning/telegram-chat`).
 */
const LIMIT = 4000; // Telegram refuses a message over 4096 characters.

/** Whether a bot is set up at all; which chat it writes to is a separate matter. */
export const telegramBot = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

export type TelegramChat = { id: string; title: string; kind: "group" | "person" | "channel" };

/** The chats in what `getUpdates` returns, newest first, each once. Pure. */
export function chatsIn(updates: unknown): TelegramChat[] {
  const found = new Map<string, TelegramChat>();
  for (const update of Array.isArray(updates) ? [...updates].reverse() : []) {
    for (const part of Object.values((update ?? {}) as Record<string, unknown>)) {
      const chat = (part as { chat?: Record<string, unknown> } | null)?.chat;
      if (!chat || (typeof chat.id !== "number" && typeof chat.id !== "string")) continue;
      const id = String(chat.id);
      if (found.has(id)) continue;
      const kind = chat.type === "private" ? "person" : chat.type === "channel" ? "channel" : "group";
      const name = [chat.title, chat.first_name, chat.username].find((value) => typeof value === "string");
      found.set(id, { id, title: String(name ?? id).slice(0, 80), kind });
    }
  }
  return [...found.values()];
}

/**
 * The chats the bot has recently been written to in, so the host can pick
 * theirs instead of looking its number up by hand. Telegram only remembers
 * the last day or so: a message sent in the group just before is what makes
 * it appear.
 */
export async function findTelegramChats(): Promise<TelegramChat[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`, {
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  const answer = (await response.json().catch(() => null)) as {
    result?: unknown;
    description?: string;
  } | null;
  if (!response.ok) throw new Error(answer?.description ?? `Telegram answered ${response.status}`);
  return chatsIn(answer?.result);
}

/** Cuts a long text into messages at line breaks. */
export function splitMessage(text: string, limit = LIMIT): string[] {
  const parts: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length + 1 > limit) {
      parts.push(current.trimEnd());
      current = "";
    }
    current += `${line.slice(0, limit)}\n`;
  }
  if (current.trim()) parts.push(current.trimEnd());
  return parts;
}

/** Sends a plain-text message. Throws with Telegram's own explanation when it is refused. */
export async function sendTelegram(text: string, chat: string | null): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chat) throw new Error("Set TELEGRAM_BOT_TOKEN and choose a chat");

  for (const part of splitMessage(text)) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: part, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (response.ok) continue;
    const answer = (await response.json().catch(() => null)) as { description?: string } | null;
    throw new Error(answer?.description ?? `Telegram answered ${response.status}`);
  }
}
