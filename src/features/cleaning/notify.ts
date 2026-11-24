import "server-only";
import { and, eq } from "drizzle-orm";
import { cleanings, getDb } from "@/db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { createFormat } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import { sendTelegram, telegramBot } from "@/lib/telegram";
import { cleaningNotices } from "./compute";
import { getCleaning } from "./queries";
import { getTelegramChat, rememberMovedChat } from "./telegram-chat";
import { cleaningMessages } from "./text";

/** Notifications are written outside any request, so their language is a setting, not a cookie. */
export function telegramLocale(): Locale {
  const chosen = process.env.TELEGRAM_LANGUAGE?.toLowerCase();
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}

const scope = globalThis as unknown as { __innkeepNotifying?: boolean };

/** Cleanings announced in one run; the rest follow on the next ones. */
const MAX_PER_RUN = 8;

/**
 * Tells the host on Telegram about each cleaning to arrange, once: when a new
 * check-out appears, or a cleaning is added by hand. A summary comes first,
 * then the request for each cleaning as a message of its own, worded for the
 * cleaner and ready to forward. A cleaning they were told about that is no
 * longer needed is named in a later summary. Nothing is recorded
 * as told until Telegram accepted the message, so a failed send is retried on
 * the next run.
 */
export async function notifyCleanings(): Promise<{ needed: number; cancelled: number }> {
  const chat = telegramBot() ? await getTelegramChat() : null;
  if (!chat || scope.__innkeepNotifying) return { needed: 0, cancelled: 0 };
  scope.__innkeepNotifying = true;
  try {
    const db = getDb();
    const { today, properties, schedule } = await getCleaning();
    const { needed, cancelled } = cleaningNotices({
      today,
      schedule,
      records: await db.select().from(cleanings).all(),
    });
    if (needed.length + cancelled.length === 0) return { needed: 0, cancelled: 0 };

    const locale = telegramLocale();
    const m = MESSAGES[locale];
    const fmt = createFormat(locale);
    const places = new Map(properties.map((property) => [property.id, property]));

    // A first run can find a season of cleanings: a few at a time, so Telegram is not flooded.
    const batch = needed.slice(0, MAX_PER_RUN);
    const { summary, requests } = cleaningMessages({ needed: batch, cancelled, places, m, fmt });
    await sendTelegram(summary, chat.id, rememberMovedChat);
    await db.transaction(async (tx) => {
      for (const record of cancelled) {
        await tx
          .update(cleanings)
          .set({ notifiedAt: null })
          .where(and(eq(cleanings.propertyId, record.propertyId), eq(cleanings.date, record.date)))
          .run();
      }
    });

    // Then each request on its own, ready to forward. One that Telegram refuses is asked again next run.
    let told = 0;
    try {
      for (const [index, entry] of batch.entries()) {
        await sendTelegram(requests[index], chat.id, rememberMovedChat);
        await db
          .insert(cleanings)
          .values({ propertyId: entry.propertyId, date: entry.date, notifiedAt: Date.now() })
          .onConflictDoUpdate({
            target: [cleanings.propertyId, cleanings.date],
            set: { notifiedAt: Date.now() },
          })
          .run();
        told++;
      }
    } catch (cause) {
      if (told === 0) throw cause;
      console.error("[innkeep] Telegram stopped part-way through the cleaning requests", cause);
    }
    return { needed: told, cancelled: cancelled.length };
  } finally {
    scope.__innkeepNotifying = false;
  }
}
