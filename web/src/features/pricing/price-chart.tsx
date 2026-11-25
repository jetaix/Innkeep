import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import type { Night } from "@/features/pricing/compute";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { SourceDot } from "../../ui/primitives";

const WIDTH = 1000;
const HEIGHT = 180;

export type ChartNight = Pick<Night, "date" | "takenBy" | "airbnb" | "booking">;

const styles = stylex.create({
  figure: { margin: 0, padding: "1rem 1rem 0.75rem" },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "1rem",
    rowGap: "0.25rem",
    minHeight: "2.5rem",
    marginBottom: "0.75rem",
    fontSize: text.sm,
  },
  strong: { fontWeight: 600 },
  muted: { color: color.muted },
  series: { display: "flex", alignItems: "center", gap: "0.375rem" },
  figures: { fontVariantNumeric: "tabular-nums" },
  plot: {
    position: "relative",
    borderRadius: radius.md,
    outlineOffset: 4,
    cursor: "crosshair",
    touchAction: "pan-y",
  },
  svg: { display: "block", width: "100%", height: "11rem", overflow: "visible" },
  taken: { fill: color.sunken },
  base: { stroke: color.lineStrong },
  airbnbLine: { stroke: color.airbnb },
  bookingLine: { stroke: color.booking },
  cursor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: `color-mix(in oklab, ${color.ink} 60%, transparent)`,
    pointerEvents: "none",
  },
  marker: {
    position: "absolute",
    width: "0.625rem",
    height: "0.625rem",
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: color.bg,
    borderRadius: radius.full,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
  },
  airbnbMarker: { backgroundColor: color.airbnb },
  bookingMarker: { backgroundColor: color.booking },
  left: (ratio: number) => ({ left: `${ratio * 100}%` }),
  top: (ratio: number) => ({ top: `${ratio * 100}%` }),
  axis: { position: "relative", height: "1rem", marginTop: "0.25rem", color: color.muted, fontSize: text.xs },
  month: { position: "absolute", whiteSpace: "nowrap" },
});

/**
 * Nightly price on each platform as two stepped lines the host can explore.
 *
 * Two series, coloured with the booking-source tokens and named in a legend,
 * so colour is never the only cue. Nights that are taken are shaded and carry
 * no price, which is how the platforms' own calendars show them. Pointing at
 * a night, touching it, or moving with the arrow keys shows that night's
 * prices in the line above the chart. The table under the chart holds the
 * same numbers as text.
 */
export function PriceChart({ nights, currency }: { nights: ChartNight[]; currency: string }) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.chart;
  const [active, setActive] = useState<number | null>(null);
  const values = nights.flatMap((night) => [night.airbnb, night.booking]).filter((value) => value != null);
  if (values.length === 0) return null;

  // Leave headroom so the top line never touches the frame.
  const top = Math.max(...values) * 1.1;
  const step = WIDTH / nights.length;
  const y = (amount: number) => HEIGHT - (amount / top) * HEIGHT;

  /** One path per run of consecutive priced nights; a gap (taken night) breaks the line. */
  const path = (key: "airbnb" | "booking") => {
    let d = "";
    let drawing = false;
    nights.forEach((night, index) => {
      const amount = night[key];
      if (amount == null) {
        drawing = false;
        return;
      }
      const x = index * step;
      d += `${drawing ? "L" : "M"}${x.toFixed(1)},${y(amount).toFixed(1)} H${(x + step).toFixed(1)} `;
      drawing = true;
    });
    return d;
  };

  const money = (amount: number | null) =>
    amount == null ? t.noPrice : fmt.money(amount, currency, { cents: false });
  // A label at the start of each month keeps the axis readable without a tick per night.
  const months = nights
    .map((night, index) => ({ night, index }))
    .filter(({ night, index }) => index === 0 || night.date.endsWith("-01"))
    // On a year of nights every month would collide on a phone: every other one is enough.
    .filter((_, position, all) => all.length <= 7 || position % 2 === 0);

  const night = active == null ? null : nights[active];
  const move = (index: number) => setActive(Math.max(0, Math.min(nights.length - 1, index)));
  const at = (clientX: number, element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    move(Math.floor(((clientX - box.left) / box.width) * nights.length));
  };

  return (
    <figure {...stylex.props(styles.figure)}>
      <div aria-live="polite" {...stylex.props(styles.legend)}>
        {night ? (
          <>
            <span {...stylex.props(styles.strong)}>
              {fmt.date(night.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
            </span>
            {night.takenBy ? (
              <span {...stylex.props(styles.muted)}>{m.pricing.table.taken[night.takenBy]}</span>
            ) : (
              <>
                <span {...stylex.props(styles.series, styles.figures)}>
                  <SourceDot source="airbnb" />
                  {m.common.sources.airbnb}{" "}
                  <span {...stylex.props(styles.strong)}>{money(night.airbnb)}</span>
                </span>
                <span {...stylex.props(styles.series, styles.figures)}>
                  <SourceDot source="booking" />
                  {m.common.sources.booking}{" "}
                  <span {...stylex.props(styles.strong)}>{money(night.booking)}</span>
                </span>
              </>
            )}
          </>
        ) : (
          <>
            <span {...stylex.props(styles.series)}>
              <SourceDot source="airbnb" />
              {m.common.sources.airbnb}
            </span>
            <span {...stylex.props(styles.series)}>
              <SourceDot source="booking" />
              {m.common.sources.booking}
            </span>
            <span {...stylex.props(styles.muted)}>{t.explore}</span>
          </>
        )}
      </div>
      <div
        role="img"
        aria-label={t.label}
        tabIndex={0}
        {...stylex.props(styles.plot)}
        onPointerMove={(event) => at(event.clientX, event.currentTarget)}
        onPointerDown={(event) => at(event.clientX, event.currentTarget)}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActive(null);
        }}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          const jump = event.shiftKey ? 7 : 1;
          if (event.key === "ArrowRight") move((active ?? -1) + jump);
          else if (event.key === "ArrowLeft") move((active ?? nights.length) - jump);
          else if (event.key === "Home") move(0);
          else if (event.key === "End") move(nights.length - 1);
          else if (event.key === "Escape") setActive(null);
          else return;
          event.preventDefault();
        }}
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          aria-hidden
          {...stylex.props(styles.svg)}
        >
          {nights.map((entry, index) =>
            entry.takenBy ? (
              <rect
                key={entry.date}
                x={index * step}
                width={step}
                y={0}
                height={HEIGHT}
                {...stylex.props(styles.taken)}
              />
            ) : null,
          )}
          <line x1={0} x2={WIDTH} y1={HEIGHT} y2={HEIGHT} strokeWidth={1} {...stylex.props(styles.base)} />
          {(["booking", "airbnb"] as const).map((key) => (
            <path
              key={key}
              d={path(key)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              {...stylex.props(key === "airbnb" ? styles.airbnbLine : styles.bookingLine)}
            />
          ))}
        </svg>
        {active != null && night && (
          <>
            <div {...stylex.props(styles.cursor, styles.left((active + 0.5) / nights.length))} />
            {(["airbnb", "booking"] as const).map((key) =>
              night[key] == null || night.takenBy ? null : (
                <span
                  key={key}
                  {...stylex.props(
                    styles.marker,
                    key === "airbnb" ? styles.airbnbMarker : styles.bookingMarker,
                    styles.left((active + 0.5) / nights.length),
                    styles.top(y(night[key]) / HEIGHT),
                  )}
                />
              ),
            )}
          </>
        )}
      </div>
      <div {...stylex.props(styles.axis)}>
        {months.map(({ night: first, index }) => (
          <span key={first.date} {...stylex.props(styles.month, styles.left(index / nights.length))}>
            {fmt.date(first.date, index === 0 ? { day: "numeric", month: "short" } : { month: "short" })}
          </span>
        ))}
      </div>
    </figure>
  );
}
