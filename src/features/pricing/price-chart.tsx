"use client";

import { useState } from "react";
import { SourceDot } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import type { Night } from "./compute";

const WIDTH = 1000;
const HEIGHT = 180;

export type ChartNight = Pick<Night, "date" | "takenBy" | "airbnb" | "booking">;

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
  const { m, fmt } = useI18n();
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
    <figure className="px-4 pt-4 pb-3">
      <div className="mb-3 flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 text-xs" aria-live="polite">
        {night ? (
          <>
            <span className="font-semibold">
              {fmt.date(night.date, { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
            </span>
            {night.takenBy ? (
              <span className="text-muted">{m.pricing.table.taken[night.takenBy]}</span>
            ) : (
              <>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <SourceDot source="airbnb" />
                  {m.common.sources.airbnb} <span className="font-semibold">{money(night.airbnb)}</span>
                </span>
                <span className="flex items-center gap-1.5 tabular-nums">
                  <SourceDot source="booking" />
                  {m.common.sources.booking} <span className="font-semibold">{money(night.booking)}</span>
                </span>
              </>
            )}
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <SourceDot source="airbnb" />
              {m.common.sources.airbnb}
            </span>
            <span className="flex items-center gap-1.5">
              <SourceDot source="booking" />
              {m.common.sources.booking}
            </span>
            <span className="text-muted">{t.explore}</span>
          </>
        )}
      </div>
      <div
        role="img"
        aria-label={t.label}
        tabIndex={0}
        className="relative cursor-crosshair touch-pan-y rounded-md outline-offset-4"
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
          className="h-44 w-full overflow-visible"
        >
          {nights.map((entry, index) =>
            entry.takenBy ? (
              <rect
                key={entry.date}
                x={index * step}
                width={step}
                y={0}
                height={HEIGHT}
                className="fill-sunken"
              />
            ) : null,
          )}
          <line x1={0} x2={WIDTH} y1={HEIGHT} y2={HEIGHT} className="stroke-line-strong" strokeWidth={1} />
          {(["booking", "airbnb"] as const).map((key) => (
            <path
              key={key}
              d={path(key)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className={key === "airbnb" ? "stroke-airbnb" : "stroke-booking"}
            />
          ))}
        </svg>
        {active != null && night && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-ink/60"
              style={{ left: `${((active + 0.5) / nights.length) * 100}%` }}
            />
            {(["airbnb", "booking"] as const).map((key) =>
              night[key] == null || night.takenBy ? null : (
                <span
                  key={key}
                  className={`pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg ${key === "airbnb" ? "bg-airbnb" : "bg-booking"}`}
                  style={{
                    left: `${((active + 0.5) / nights.length) * 100}%`,
                    top: `${(y(night[key]) / HEIGHT) * 100}%`,
                  }}
                />
              ),
            )}
          </>
        )}
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-muted">
        {months.map(({ night: first, index }) => (
          <span
            key={first.date}
            className="absolute whitespace-nowrap"
            style={{ left: `${(index / nights.length) * 100}%` }}
          >
            {fmt.date(first.date, index === 0 ? { day: "numeric", month: "short" } : { month: "short" })}
          </span>
        ))}
      </div>
    </figure>
  );
}
