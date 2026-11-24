import { cn } from "@/lib/cn";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { formatMonth, type Month, type MonthSummary } from "./compute";

const HEIGHT = 168; // px of plot area

/**
 * Net revenue per month as a bar chart.
 *
 * One series, so no legend: the heading names it. Bars grow from a zero
 * baseline (down when costs exceed revenue), the current month is the only
 * emphasised bar, and every bar is focusable with the full breakdown in a
 * tooltip. The table under the chart carries the same numbers as text.
 */
export async function MonthChart({
  summaries,
  current,
  currency,
  unit = "month",
}: {
  summaries: MonthSummary[];
  current: Month;
  currency: string;
  /** With "year", each summary is a whole year and its `month` is the year itself. */
  unit?: "month" | "year";
}) {
  const highest = Math.max(0, ...summaries.map((s) => s.net));
  const lowest = Math.max(0, ...summaries.map((s) => -s.net));
  const range = highest + lowest || 1;
  const above = Math.round((HEIGHT * highest) / range);
  const { locale, m, fmt } = await getI18n();
  const t = m.revenue.months;
  const money = (value: number) => fmt.money(value, currency, { cents: false });
  const monthName = (month: Month) =>
    unit === "year" ? month : formatMonth(month, "long", INTL_LOCALE[locale]);
  const shortName = (month: Month) =>
    unit === "year" ? month : formatMonth(month, "short", INTL_LOCALE[locale]);

  return (
    <div
      className="flex gap-2 px-4 pt-10 pb-3 sm:gap-4"
      role="group"
      aria-label={unit === "year" ? m.revenue.years.title : t.title}
    >
      {summaries.map((summary) => {
        const isCurrent = summary.month === current;
        const size = Math.max(2, Math.round((Math.abs(summary.net) / range) * HEIGHT));
        const negative = summary.net < 0;
        return (
          <div
            key={summary.month}
            tabIndex={0}
            role="img"
            aria-label={t.bar(
              monthName(summary.month),
              money(summary.net),
              money(summary.gross),
              money(summary.charges),
            )}
            className="group relative flex min-w-0 flex-1 flex-col items-center rounded-md outline-offset-4"
          >
            <div className="relative w-full" style={{ height: HEIGHT }}>
              {/* Zero baseline */}
              <div className="absolute inset-x-0 border-t border-line-strong" style={{ top: above }} />
              <div
                className={cn(
                  "absolute left-1/2 w-full max-w-10 -translate-x-1/2 transition-colors",
                  negative ? "rounded-b" : "rounded-t",
                  isCurrent ? "bg-ink" : "bg-ink/25 group-hover:bg-ink/45 group-focus-visible:bg-ink/45",
                )}
                style={negative ? { top: above, height: size } : { top: above - size, height: size }}
              />
              {isCurrent && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap tabular-nums"
                  style={{ top: (negative ? above : above - size) - 20 }}
                >
                  {money(summary.net)}
                </span>
              )}
              <div
                role="presentation"
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden w-44 -translate-x-1/2 rounded-md bg-bg p-2.5 text-xs shadow-pop group-hover:block group-focus-visible:block"
              >
                <p className="mb-1.5 font-medium">{t.label(monthName(summary.month))}</p>
                <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 tabular-nums">
                  <dt className="text-muted">{t.revenue}</dt>
                  <dd className="text-right">{money(summary.gross)}</dd>
                  <dt className="text-muted">{t.costs}</dt>
                  <dd className="text-right">−{money(summary.charges)}</dd>
                  <dt className="font-medium">{t.net}</dt>
                  <dd className="text-right font-medium">{money(summary.net)}</dd>
                </dl>
              </div>
            </div>
            <span className={cn("mt-2 text-xs", isCurrent ? "font-medium text-ink" : "text-muted")}>
              {t.label(shortName(summary.month))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
