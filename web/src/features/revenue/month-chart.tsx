import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { formatMonth, type Month, type MonthSummary } from "@/features/revenue/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { useI18n } from "../../i18n";
import { color, radius, shadow, text } from "../../tokens.stylex";

const HEIGHT = 168; // px of plot area

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  chart: {
    display: "flex",
    gap: { default: "0.5rem", [WIDE]: "1rem" },
    padding: "2.5rem 1rem 0.75rem",
  },
  column: {
    position: "relative",
    display: "flex",
    flexBasis: 0,
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    minWidth: 0,
    borderRadius: radius.md,
    outlineOffset: 4,
  },
  plot: { position: "relative", width: "100%", height: HEIGHT },
  baseline: {
    position: "absolute",
    insetInline: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  top: (px: number) => ({ top: px }),
  bar: {
    position: "absolute",
    left: "50%",
    width: "100%",
    maxWidth: "2.5rem",
    transform: "translateX(-50%)",
    backgroundColor: `color-mix(in oklab, ${color.ink} 25%, transparent)`,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  barAt: (top: number, height: number) => ({ top, height }),
  up: { borderStartStartRadius: radius.sm, borderStartEndRadius: radius.sm },
  down: { borderEndStartRadius: radius.sm, borderEndEndRadius: radius.sm },
  pointed: { backgroundColor: `color-mix(in oklab, ${color.ink} 45%, transparent)` },
  current: { backgroundColor: color.ink },
  value: {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: text.sm,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  tip: {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    zIndex: 10,
    width: "11rem",
    marginBottom: "0.25rem",
    padding: "0.625rem",
    transform: "translateX(-50%)",
    borderRadius: radius.md,
    backgroundColor: color.bg,
    boxShadow: shadow.pop,
    fontSize: text.sm,
    pointerEvents: "none",
  },
  tipTitle: { margin: "0 0 0.375rem", fontWeight: 500 },
  lines: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    columnGap: "0.75rem",
    rowGap: "0.125rem",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  term: { color: color.muted },
  amount: { margin: 0, textAlign: "end" },
  strong: { fontWeight: 500 },
  label: { marginTop: "0.5rem", color: color.muted, fontSize: text.sm },
  labelCurrent: { color: color.ink, fontWeight: 500 },
});

/**
 * Net revenue per month as a bar chart.
 *
 * One series, so no legend: the heading names it. Bars grow from a zero
 * baseline (down when costs exceed revenue), the current month is the only
 * emphasised bar, and every bar is focusable with the full breakdown in a
 * tooltip. The table under the chart carries the same numbers as text.
 */
export function MonthChart({
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
  const { locale, m, fmt } = useI18n("revenue");
  // The bar under the pointer and the bar the keyboard is on: either shows its breakdown.
  const [hovered, setHovered] = useState<Month | null>(null);
  const [focused, setFocused] = useState<Month | null>(null);

  const highest = Math.max(0, ...summaries.map((s) => s.net));
  const lowest = Math.max(0, ...summaries.map((s) => -s.net));
  const range = highest + lowest || 1;
  const above = Math.round((HEIGHT * highest) / range);
  const t = m.revenue.months;
  const money = (value: number) => fmt.money(value, currency, { cents: false });
  const monthName = (month: Month) =>
    unit === "year" ? month : formatMonth(month, "long", INTL_LOCALE[locale]);
  const shortName = (month: Month) =>
    unit === "year" ? month : formatMonth(month, "short", INTL_LOCALE[locale]);

  return (
    <div
      role="group"
      aria-label={unit === "year" ? m.revenue.years.title : t.title}
      {...stylex.props(styles.chart)}
    >
      {summaries.map((summary) => {
        const isCurrent = summary.month === current;
        const size = Math.max(2, Math.round((Math.abs(summary.net) / range) * HEIGHT));
        const negative = summary.net < 0;
        const pointed = hovered === summary.month || focused === summary.month;
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
            onMouseEnter={() => setHovered(summary.month)}
            onMouseLeave={() => setHovered(null)}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible")) setFocused(summary.month);
            }}
            onBlur={() => setFocused(null)}
            {...stylex.props(styles.column)}
          >
            <div {...stylex.props(styles.plot)}>
              {/* Zero baseline */}
              <div {...stylex.props(styles.baseline, styles.top(above))} />
              <div
                {...stylex.props(
                  styles.bar,
                  negative ? styles.down : styles.up,
                  pointed && styles.pointed,
                  isCurrent && styles.current,
                  styles.barAt(negative ? above : above - size, size),
                )}
              />
              {isCurrent && (
                <span {...stylex.props(styles.value, styles.top((negative ? above : above - size) - 20))}>
                  {money(summary.net)}
                </span>
              )}
              {pointed && (
                <div role="presentation" {...stylex.props(styles.tip)}>
                  <p {...stylex.props(styles.tipTitle)}>{t.label(monthName(summary.month))}</p>
                  <dl {...stylex.props(styles.lines)}>
                    <dt {...stylex.props(styles.term)}>{t.revenue}</dt>
                    <dd {...stylex.props(styles.amount)}>{money(summary.gross)}</dd>
                    <dt {...stylex.props(styles.term)}>{t.costs}</dt>
                    <dd {...stylex.props(styles.amount)}>−{money(summary.charges)}</dd>
                    <dt {...stylex.props(styles.strong)}>{t.net}</dt>
                    <dd {...stylex.props(styles.amount, styles.strong)}>{money(summary.net)}</dd>
                  </dl>
                </div>
              )}
            </div>
            <span {...stylex.props(styles.label, isCurrent && styles.labelCurrent)}>
              {t.label(shortName(summary.month))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
