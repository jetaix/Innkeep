import http from "node:http";
import https from "node:https";

/**
 * Messages to the host's own Telegram, through a bot they created with
 * @BotFather. The chat is a person or a group, so a couple can both receive
 * them. It comes from `TELEGRAM_CHAT_ID`, or from the group the host picked
 * on the Settings page (see `features/cleaning/telegram-chat`).
 */
const LIMIT = 4000; // Telegram refuses a message over 4096 characters.

type Answer = { status: number; data: { result?: unknown; description?: string } | null };

/**
 * One JSON request, over IPv4 only. Telegram also publishes an IPv6 address,
 * and on hosts whose network cannot route IPv6 (most serverless ones) a
 * request sent there is never answered: it hangs until it times out. Asking
 * for IPv4 outright is the known cure. Exported for its test.
 */
export function requestJson(url: URL, body?: unknown, timeoutMs = 10_000): Promise<Answer> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const request = (url.protocol === "http:" ? http : https).request(
      url,
      {
        family: 4,
        method: payload ? "POST" : "GET",
        headers: payload
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }
          : {},
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          clearTimeout(deadline);
          let data: Answer["data"] = null;
          try {
            data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          } catch {
            // Not JSON: the status alone will have to do.
          }
          resolve({ status: response.statusCode ?? 0, data });
        });
      },
    );
    // How far the request got, so a failure says where it stopped instead of only that it did.
    let reached = "could not find its address";
    request.on("socket", (socket) => {
      socket.on("lookup", (_error, address) => {
        reached = `could not connect to ${address}`;
      });
      socket.on("connect", () => {
        reached = `connected to ${socket.remoteAddress} but the secure link was not set up`;
      });
      socket.on("secureConnect", () => {
        reached = `connected to ${socket.remoteAddress} and sent the request, but got no reply`;
      });
    });
    // From the first byte sent to the last received: connecting counts too.
    const deadline = setTimeout(
      () => request.destroy(new Error(`Telegram did not answer in time: ${reached}`)),
      timeoutMs,
    );
    request.on("error", (cause) => {
      clearTimeout(deadline);
      reject(cause);
    });
    request.end(payload ?? undefined);
  });
}

/** Calls one method of the bot API. A request that fails on the way is tried once more. */
async function telegram(method: string, body?: unknown): Promise<Answer> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN");
  const url = new URL(`https://api.telegram.org/bot${token}/${method}`);
  try {
    return await requestJson(url, body);
  } catch {
    return await requestJson(url, body);
  }
}

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
  const { status, data } = await telegram("getUpdates");
  if (status !== 200) throw new Error(data?.description ?? `Telegram answered ${status}`);
  return chatsIn(data?.result);
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
  if (!process.env.TELEGRAM_BOT_TOKEN || !chat) throw new Error("Set TELEGRAM_BOT_TOKEN and choose a chat");

  for (const part of splitMessage(text)) {
    const { status, data } = await telegram("sendMessage", {
      chat_id: chat,
      text: part,
      disable_web_page_preview: true,
    });
    if (status !== 200) throw new Error(data?.description ?? `Telegram answered ${status}`);
  }
}
