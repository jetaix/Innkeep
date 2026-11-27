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
  piece: {
    position: "absolute",
    width: "calc(50% - 1px)",
    maxWidth: "1.5rem",
    transitionProperty: "background-color, opacity",
    transitionDuration: "150ms",
  },
  // The pair meets in the middle of its column: revenue on the left, costs on the right.
  left: { right: "calc(50% + 1px)" },
  right: { left: "calc(50% + 1px)" },
  pieceAt: (top: number, height: number) => ({ top, height }),
  // What came in.
  net: {
    backgroundColor: `color-mix(in oklab, ${color.ink} 62%, ${color.panel})`,
    boxShadow: `inset 0 1px 0 ${color.glassHi}, 0 10px 14px -12px ${color.ink}`,
  },
  // A month that is not over: booked, not earned yet.
  ahead: { backgroundColor: `color-mix(in oklab, ${color.ink} 26%, ${color.panel})`, boxShadow: "none" },
  current: { backgroundColor: color.ink },
  pointed: { backgroundColor: `color-mix(in oklab, ${color.ink} 82%, ${color.panel})` },
  // What went out.
  cut: {
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in oklab, ${color.ink} 34%, transparent) 4px 5px)`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color.ink} 26%, transparent)`,
  },
  // Costs above the month's revenue.
  loss: { backgroundColor: `color-mix(in oklab, ${color.critical} 72%, ${color.panel})` },
  up: { borderStartStartRadius: radius.md, borderStartEndRadius: radius.md },
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
 * What comes in and what goes out, month by month, as two bars side by side
 * on one scale: revenue in ink, costs (charges and loans) hatched. A month
 * whose costs are above its revenue has its costs in the loss colour. The
 * current month is the darkest, the months still to come are paler. Every
 * pair is focusable with the full breakdown in a tooltip, and the table under
 * the chart carries the same numbers as text.
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

  // One scale for both bars, from zero: the taller of the two, over every month.
  const range = Math.max(1, ...summaries.flatMap((s) => [s.gross, s.charges]));
  const above = HEIGHT;
  const px = (amount: number) => (amount > 0 ? Math.max(2, Math.round((amount / range) * HEIGHT)) : 0);
  const anyLoss = summaries.some((s) => s.charges > s.gross && s.gross > 0);
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
          const earned = px(Math.max(0, summary.gross));
          const spent = px(summary.charges);
          // A loss is a state only where there were stays to pay for the costs.
          const over = summary.charges > summary.gross && summary.gross > 0;
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
                {earned > 0 && (
                  <div
                    {...stylex.props(
                      styles.piece,
                      styles.left,
                      styles.net,
                      styles.up,
                      summary.month > current && styles.ahead,
                      pointed && styles.pointed,
                      isCurrent && styles.current,
                      styles.pieceAt(above - earned, earned),
                    )}
                  />
                )}
                {spent > 0 && (
                  <div
                    {...stylex.props(
                      styles.piece,
                      styles.right,
                      over ? styles.loss : styles.cut,
                      styles.up,
                      styles.pieceAt(above - spent, spent),
                    )}
                  />
                )}
                {/* Zero baseline */}
                <div {...stylex.props(styles.baseline, styles.top(above))} />
                {isCurrent && (
                  <span {...stylex.props(styles.value, styles.top(above - Math.max(earned, spent) - 22))}>
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
          {t.revenue}
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
