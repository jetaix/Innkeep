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
    gap: { default: "0.375rem", [WIDE]: "0.875rem" },
    paddingTop: "2.25rem",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "1.25rem",
    rowGap: "0.375rem",
    margin: "1rem 0 0",
    padding: 0,
    listStyle: "none",
    color: color.muted,
    fontSize: text.sm,
  },
  key: { display: "flex", alignItems: "center", gap: "0.5rem" },
  swatch: { width: "0.875rem", height: "0.875rem", borderRadius: radius.sm },
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
  // A bar is a sheet of ink glass as tall as the month's revenue.
  piece: {
    position: "absolute",
    left: "50%",
    width: "100%",
    maxWidth: "2.5rem",
    transform: "translateX(-50%)",
    transitionProperty: "background-color, opacity",
    transitionDuration: "150ms",
  },
  pieceAt: (top: number, height: number) => ({ top, height }),
  // What is left once the costs are paid.
  net: {
    backgroundColor: `color-mix(in oklab, ${color.ink} 62%, ${color.panel})`,
    boxShadow: `inset 0 1px 0 ${color.glassHi}, 0 10px 14px -12px ${color.ink}`,
  },
  // A month that is not over: booked, not earned yet.
  ahead: { backgroundColor: `color-mix(in oklab, ${color.ink} 26%, ${color.panel})`, boxShadow: "none" },
  current: { backgroundColor: color.ink },
  pointed: { backgroundColor: `color-mix(in oklab, ${color.ink} 82%, ${color.panel})` },
  // The costs: the top of the bar, cut away.
  cut: {
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in oklab, ${color.ink} 34%, transparent) 4px 5px)`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color.ink} 26%, transparent)`,
  },
  // Costs that revenue did not cover hang under the baseline.
  loss: { backgroundColor: `color-mix(in oklab, ${color.critical} 72%, ${color.panel})` },
  up: { borderStartStartRadius: radius.md, borderStartEndRadius: radius.md },
  down: { borderEndStartRadius: radius.md, borderEndEndRadius: radius.md },
  value: {
    position: "absolute",
    left: "50%",
    // Over the bars beside it, on the panel's own colour, so no figure is cut by a neighbour.
    zIndex: 1,
    paddingInline: "0.125rem",
    borderRadius: radius.sm,
    backgroundColor: color.panel,
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
    backgroundColor: color.panel,
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
  label: {
    marginTop: "0.5rem",
    color: color.muted,
    fontSize: { default: text.xs, [WIDE]: text.sm },
    whiteSpace: "nowrap",
  },
  labelCurrent: { color: color.ink, fontWeight: 600 },
  // On a phone every other month is named, so no name is cut short.
  sparse: { visibility: { default: "hidden", [WIDE]: "visible" } },
});

/**
 * What each month pays, as bars of ink glass.
 *
 * A bar is as tall as the month's revenue. Its top is cut away by the costs,
 * so the solid part is what is left; costs that revenue did not cover hang
 * under the baseline. The current month is the darkest bar, the months still
 * to come are paler. Every bar is focusable with the full breakdown in a
 * tooltip, and the table under the chart carries the same numbers as text.
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

  const highest = Math.max(0, ...summaries.map((s) => s.gross));
  const lowest = Math.max(0, ...summaries.map((s) => -s.net));
  const range = highest + lowest || 1;
  const above = Math.round((HEIGHT * highest) / range);
  const px = (amount: number) => (amount > 0 ? Math.max(2, Math.round((amount / range) * HEIGHT)) : 0);
  const anyLoss = lowest > 0;
  const nowIndex = Math.max(
    0,
    summaries.findIndex((s) => s.month === current),
  );
  const anyAhead = summaries.some((s) => s.month > current);
  const t = m.revenue.months;
  const money = (value: number) => fmt.money(value, currency, { cents: false });
  const monthName = (month: Month) =>
    unit === "year" ? month : formatMonth(month, "long", INTL_LOCALE[locale]);
  const shortName = (month: Month) =>
    unit === "year" ? month : formatMonth(month, "short", INTL_LOCALE[locale]);

  return (
    <div>
      <div
        role="group"
        aria-label={unit === "year" ? m.revenue.years.title : t.title}
        {...stylex.props(styles.chart)}
      >
        {summaries.map((summary, index) => {
          const isCurrent = summary.month === current;
          const kept = px(Math.max(0, summary.net));
          const cut = px(Math.min(summary.charges, Math.max(0, summary.gross)));
          const lost = px(-summary.net);
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
                {cut > 0 && (
                  <div
                    {...stylex.props(
                      styles.piece,
                      styles.cut,
                      styles.up,
                      styles.pieceAt(above - kept - cut, cut),
                    )}
                  />
                )}
                {kept > 0 && (
                  <div
                    {...stylex.props(
                      styles.piece,
                      styles.net,
                      cut === 0 && styles.up,
                      summary.month > current && styles.ahead,
                      pointed && styles.pointed,
                      isCurrent && styles.current,
                      styles.pieceAt(above - kept, kept),
                    )}
                  />
                )}
                {lost > 0 && (
                  <div
                    {...stylex.props(styles.piece, styles.loss, styles.down, styles.pieceAt(above, lost))}
                  />
                )}
                {/* Zero baseline */}
                <div {...stylex.props(styles.baseline, styles.top(above))} />
                {isCurrent && (
                  <span {...stylex.props(styles.value, styles.top(above - kept - cut - 22))}>
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
              <span
                {...stylex.props(
                  styles.label,
                  isCurrent && styles.labelCurrent,
                  // Counted from the current month, which is always named.
                  (index - nowIndex) % 2 !== 0 && styles.sparse,
                )}
              >
                {t.label(shortName(summary.month))}
              </span>
            </div>
          );
        })}
      </div>
      <ul {...stylex.props(styles.legend)}>
        <li {...stylex.props(styles.key)}>
          <span aria-hidden {...stylex.props(styles.swatch, styles.net)} />
          {t.net}
        </li>
        <li {...stylex.props(styles.key)}>
          <span aria-hidden {...stylex.props(styles.swatch, styles.cut)} />
          {t.costs}
        </li>
        {anyAhead && (
          <li {...stylex.props(styles.key)}>
            <span aria-hidden {...stylex.props(styles.swatch, styles.net, styles.ahead)} />
            {t.upcoming}
          </li>
        )}
        {anyLoss && (
          <li {...stylex.props(styles.key)}>
            <span aria-hidden {...stylex.props(styles.swatch, styles.loss)} />
            {t.loss}
          </li>
        )}
      </ul>
    </div>
  );
}
