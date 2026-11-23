/**
 * Messages to the host's own Telegram, through a bot they created with
 * @BotFather. `TELEGRAM_CHAT_ID` is a person or a group, so a couple can
 * both receive them. Off unless both variables are set.
 */
const LIMIT = 4000; // Telegram refuses a message over 4096 characters.

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
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
export async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) throw new Error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID");

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
