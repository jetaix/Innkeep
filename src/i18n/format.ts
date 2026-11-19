import { formatDate, formatDateTime, type ISODate } from "@/lib/dates";
import { formatMoney, formatPercent, type Minor } from "@/lib/money";
import { INTL_LOCALE, type Locale } from "./config";

/**
 * Dates, amounts and durations written the way a language expects. Pure and
 * free of request state, so server and client components share it.
 */
export function createFormat(locale: Locale) {
  const intl = INTL_LOCALE[locale];
  const relative = new Intl.RelativeTimeFormat(intl, { style: "short", numeric: "auto" });

  return {
    /** "2 Nov" by default; pass Intl options for other shapes. */
    date: (date: ISODate, options?: Intl.DateTimeFormatOptions) => formatDate(date, options, intl),
    dateTime: (timestamp: number) => formatDateTime(timestamp, intl),
    money: (amount: Minor, currency: string, options?: { cents?: boolean }) =>
      formatMoney(amount, currency, options, intl),
    percent: formatPercent,
    /** "5 min ago", "il y a 3 h". */
    timeAgo(timestamp: number, now = Date.now()): string {
      const minutes = Math.round((now - timestamp) / 60_000);
      if (minutes < 60) return relative.format(-minutes, "minute");
      const hours = Math.round(minutes / 60);
      return hours < 24 ? relative.format(-hours, "hour") : relative.format(-Math.round(hours / 24), "day");
    },
  };
}

export type Format = ReturnType<typeof createFormat>;
