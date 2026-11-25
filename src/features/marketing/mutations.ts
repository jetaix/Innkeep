import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { sendTelegram } from "@/lib/telegram";

export type AccessState = { status: "idle" | "sent" | "error"; message?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  /** A field people never see. Anything in it means a script filled the form. */
  company: z.string().max(0).optional(),
});

/**
 * A host asks for early access to the hosted version. The address is sent as
 * a message to the Telegram chat named by `TELEGRAM_CHAT_ID` and kept nowhere
 * else: the public site has no database.
 */
export async function requestAccess(input: unknown, locale: Locale): Promise<AccessState> {
  const t = MESSAGES[locale].marketing.access;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "error", message: t.invalid };

  try {
    await sendTelegram(
      `Innkeep early access\n${parsed.data.email}\nLanguage: ${locale}`,
      process.env.TELEGRAM_CHAT_ID ?? null,
    );
  } catch {
    return { status: "error", message: t.failed };
  }
  return { status: "sent", message: t.sent };
}
