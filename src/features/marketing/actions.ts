"use server";

import { z } from "zod";
import { MESSAGES } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
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
export async function requestAccess(_previous: AccessState, form: FormData): Promise<AccessState> {
  const locale = await getLocale();
  const t = MESSAGES[locale].marketing.access;
  const parsed = schema.safeParse({ email: form.get("email"), company: form.get("company") ?? undefined });
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
