import "server-only";
import { and, eq } from "drizzle-orm";
import { cleanings, getDb } from "@/db";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { createFormat } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";
import { sendTelegram, telegramBot } from "@/lib/telegram";
import { cleaningNotices } from "./compute";
import { getCleaning } from "./queries";
import { getTelegramChat } from "./telegram-chat";
import { cleaningDay, cleaningLines } from "./text";

/** Notifications are written outside any request, so their language is a setting, not a cookie. */
export function telegramLocale(): Locale {
  const chosen = process.env.TELEGRAM_LANGUAGE?.toLowerCase();
  return isLocale(chosen) ? chosen : DEFAULT_LOCALE;
}

const scope = globalThis as unknown as { __innkeepNotifying?: boolean };

/**
 * Tells the host on Telegram about each cleaning to arrange, once: when a new
 * check-out appears, or a cleaning is added by hand. A cleaning they were told
 * about that is no longer needed gets a second message. Nothing is recorded
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
    const t = m.cleaning.telegram;
    const places = new Map(properties.map((property) => [property.id, property]));

    const blocks: string[] = [];
    if (needed.length > 0) {
      blocks.push(
        [
          t.needed(needed.length),
          ...needed.map((entry) => cleaningLines(entry, places.get(entry.propertyId)!, m, fmt).join("\n")),
        ].join("\n\n"),
      );
    }
    if (cancelled.length > 0) {
      blocks.push(
        [
          t.cancelled(cancelled.length),
          "",
          ...cancelled.map((record) =>
            m.cleaning.share.line(cleaningDay(record.date, fmt), places.get(record.propertyId)?.name ?? ""),
          ),
        ].join("\n"),
      );
    }
    await sendTelegram(blocks.join("\n\n"), chat.id);

    const now = Date.now();
    await db.transaction(async (tx) => {
      for (const entry of needed) {
        await tx
          .insert(cleanings)
          .values({ propertyId: entry.propertyId, date: entry.date, notifiedAt: now })
          .onConflictDoUpdate({ target: [cleanings.propertyId, cleanings.date], set: { notifiedAt: now } })
          .run();
      }
      for (const record of cancelled) {
        await tx
          .update(cleanings)
          .set({ notifiedAt: null })
          .where(and(eq(cleanings.propertyId, record.propertyId), eq(cleanings.date, record.date)))
          .run();
      }
    });
    return { needed: needed.length, cancelled: cancelled.length };
  } finally {
    scope.__innkeepNotifying = false;
  }
}
