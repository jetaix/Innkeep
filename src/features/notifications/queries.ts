import "server-only";
import { asc, desc, eq, gt } from "drizzle-orm";
import { CHANNELS } from "@/channels";
import { getDb, properties, reservationEvents, reservations } from "@/db";
import type { Locale } from "@/i18n/config";
import { createFormat } from "@/i18n/format";
import { MESSAGES } from "@/i18n/messages";

/** The newest event there is, so a browser that just switched notifications on starts from now. */
export async function latestEventId(): Promise<number> {
  const row = await getDb()
    .select({ id: reservationEvents.id })
    .from(reservationEvents)
    .orderBy(desc(reservationEvents.id))
    .limit(1)
    .get();
  return row?.id ?? 0;
}

/** A few at a time: a first calendar import can bring a season of stays. */
const MAX_SHOWN = 3;

export type BrowserNotification = { id: number; title: string; body: string };

/** The notifications to show for what happened after event `after`, worded in `locale`. */
export async function notificationsAfter(after: number, locale: Locale) {
  const rows = await getDb()
    .select({
      id: reservationEvents.id,
      kind: reservationEvents.kind,
      detail: reservationEvents.detail,
      source: reservations.source,
      stayKind: reservations.kind,
      guestName: reservations.guestName,
      checkIn: reservations.checkIn,
      checkOut: reservations.checkOut,
      property: properties.name,
    })
    .from(reservationEvents)
    .innerJoin(reservations, eq(reservations.id, reservationEvents.reservationId))
    .innerJoin(properties, eq(properties.id, reservations.propertyId))
    .where(gt(reservationEvents.id, after))
    .orderBy(asc(reservationEvents.id))
    .limit(200)
    .all();

  const t = MESSAGES[locale].notifications;
  const fmt = createFormat(locale);
  const range = (from: string, to: string) => t.dates(fmt.date(from), fmt.date(to));

  const shown: BrowserNotification[] = rows.slice(0, MAX_SHOWN).map((row) => {
    const channel = row.source === "direct" ? "" : CHANNELS[row.source].label;
    const unsure = row.stayKind === "block";
    const [wasIn, wasOut] = row.detail.split("/");
    return {
      id: row.id,
      title: (unsure ? t.unsure : t.title)[row.kind](channel),
      body: [
        row.guestName,
        range(row.checkIn, row.checkOut) + (wasIn && wasOut ? ` (${t.was(range(wasIn, wasOut))})` : ""),
        row.property,
        unsure ? t.unsure.hint[row.kind] : "",
      ]
        .filter(Boolean)
        .join(" · "),
    };
  });
  const more = rows.length - shown.length;
  if (more > 0) {
    shown.push({ id: rows[rows.length - 1].id, title: t.many.title(more), body: t.many.body });
  }
  return { last: rows.at(-1)?.id ?? after, notifications: shown };
}
