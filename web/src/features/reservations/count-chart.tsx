import * as stylex from "@stylexjs/stylex";
import { formatMonth, type Month } from "@/features/revenue/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";

const HEIGHT = 120; // px of plot area

const styles = stylex.create({
  // Wider than a phone when there are many months: it scrolls inside its card.
  scroll: { position: "relative", overflowX: "auto" },
  chart: { padding: "2rem 1rem 0.75rem" },
  width: (months: number) => ({ minWidth: `${months * 2.25}rem` }),
  plot: { position: "relative", height: HEIGHT },
  zero: {
    position: "absolute",
    insetInline: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  lines: { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" },
  // Set here, not as attributes: the plot is stretched to its box, the stroke must not be.
  line: {
    fill: "none",
    stroke: color.ink,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
  },
  ahead: { stroke: color.muted, strokeDasharray: "1 5" },
  points: { position: "absolute", inset: 0, display: "flex" },
  column: { position: "relative", flexBasis: 0, flexGrow: 1 },
  dot: {
    position: "absolute",
    left: "50%",
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: radius.full,
    backgroundColor: color.ink,
    // A ring of the card's own colour lifts the point off the line.
    boxShadow: `0 0 0 2px ${color.panel}`,
    transform: "translate(-50%, -50%)",
  },
  dotAhead: { backgroundColor: color.muted },
  dotNow: { width: "0.625rem", height: "0.625rem" },
  at: (top: string) => ({ top }),
  count: {
    position: "absolute",
    left: "50%",
    color: color.muted,
    fontSize: text.sm,
    fontVariantNumeric: "tabular-nums",
    transform: "translateX(-50%)",
  },
  now: { color: color.ink, fontWeight: 600 },
  labels: { display: "flex", marginTop: "0.5rem" },
  label: {
    flexBasis: 0,
    flexGrow: 1,
    color: color.muted,
    fontSize: text.sm,
    textAlign: "center",
    whiteSpace: "nowrap",
    "::first-letter": { textTransform: "uppercase" },
  },
  year: { display: "block", fontSize: text.xs },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: text.sm,
  },
  swatch: { flexShrink: 0 },
});

/**
 * Reservations per month as a line.
 *
 * One series, so no legend for it: the heading names it. Every point carries
 * its number, so nothing depends on hovering. The line is solid up to the
 * current month and dotted from there on, where bookings are still coming in.
 */
export function CountChart({
  counts,
  current,
}: {
  counts: { month: Month; count: number }[];
  current: Month;
}) {
  const { locale, m } = useI18n("reservations");
  const t = m.reservations.chart;
  const highest = Math.max(1, ...counts.map((entry) => entry.count));
  // Top of the plot is the highest month; the bottom line is zero.
  const y = (count: number) => 100 - (count / highest) * 100;
  const now = counts.findIndex((entry) => entry.month === current);
  const point = (entry: { count: number }, index: number) => `${index + 0.5},${y(entry.count)}`;
  const past = counts
    .slice(0, now + 1)
    .map(point)
    .join(" ");
  const ahead = counts
    .slice(now)
    .map((entry, index) => point(entry, index + now))
    .join(" ");
  const hasAhead = now < counts.length - 1;

  return (
    <div {...stylex.props(styles.scroll)}>
      <div role="group" aria-label={t.title} {...stylex.props(styles.chart, styles.width(counts.length))}>
        <div {...stylex.props(styles.plot)}>
          <div {...stylex.props(styles.zero)} />
          <svg
            aria-hidden
            viewBox={`0 0 ${counts.length} 100`}
            preserveAspectRatio="none"
            {...stylex.props(styles.lines)}
          >
            <polyline points={past} {...stylex.props(styles.line)} />
            {hasAhead && <polyline points={ahead} {...stylex.props(styles.line, styles.ahead)} />}
          </svg>
          <div {...stylex.props(styles.points)}>
            {counts.map((entry, index) => (
              <div
                key={entry.month}
                role="img"
                aria-label={t.point(formatMonth(entry.month, "long", INTL_LOCALE[locale]), entry.count)}
                {...stylex.props(styles.column)}
              >
                <span
                  {...stylex.props(
                    styles.dot,
                    index > now && styles.dotAhead,
                    entry.month === current && styles.dotNow,
                    styles.at(`${y(entry.count)}%`),
                  )}
                />
                <span
                  {...stylex.props(
                    styles.count,
                    entry.month === current && styles.now,
                    styles.at(`calc(${y(entry.count)}% - 1.5rem)`),
                  )}
                >
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden {...stylex.props(styles.labels)}>
          {counts.map((entry) => (
            <span key={entry.month} {...stylex.props(styles.label, entry.month === current && styles.now)}>
              {formatMonth(entry.month, "short", INTL_LOCALE[locale])}
              {entry.month.endsWith("-01") && (
                <span {...stylex.props(styles.year)}>{entry.month.slice(0, 4)}</span>
              )}
            </span>
          ))}
        </div>
        {hasAhead && (
          <p {...stylex.props(styles.legend)}>
            <svg aria-hidden width="24" height="4" {...stylex.props(styles.swatch)}>
              <line x1="2" y1="2" x2="22" y2="2" {...stylex.props(styles.line, styles.ahead)} />
            </svg>
            {t.upcoming}
          </p>
        )}
      </div>
    </div>
  );
}
