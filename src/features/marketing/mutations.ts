import { z } from "zod";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { recordRequest } from "@/features/access/requests";
import { sendTelegram } from "@/lib/telegram";

export type AccessState = { status: "idle" | "sent" | "error"; message?: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  /** A field people never see. Anything in it means a script filled the form. */
  company: z.string().max(0).optional(),
});

/**
 * Someone asks for access while sign-up is in beta. The address is kept in
 * the main database, where the host approves it from Settings, and sent to
 * the Telegram chat named by `TELEGRAM_CHAT_ID` so the host hears of it. One
 * of the two is enough for the request to count: a host without a bot still
 * finds it in Settings.
 */
export async function requestAccess(input: unknown, locale: Locale): Promise<AccessState> {
  const t = MESSAGES[locale].marketing.access;
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { status: "error", message: t.invalid };

  const kept = await recordRequest(parsed.data.email, locale).catch(() => false);
  const told = await sendTelegram(
    `Innkeep access request\n${parsed.data.email}\nLanguage: ${locale}`,
    process.env.TELEGRAM_CHAT_ID ?? null,
  ).then(
    () => true,
    () => false,
  );
  return kept || told ? { status: "sent", message: t.sent } : { status: "error", message: t.failed };
}
