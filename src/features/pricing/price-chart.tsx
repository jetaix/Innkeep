import { SourceDot } from "@/components/ui/primitives";
import { getI18n } from "@/i18n/server";
import type { Night } from "./compute";

const WIDTH = 1000;
const HEIGHT = 180;

/**
 * Nightly price on each platform as two stepped lines.
 *
 * Two series, coloured with the booking-source tokens and named in a legend,
 * so colour is never the only cue. Nights that are taken are shaded and carry
 * no price, which is how the platforms' own calendars show them. The table
 * under the chart holds the same numbers as text.
 */
export async function PriceChart({ nights, currency }: { nights: Night[]; currency: string }) {
  const { m, fmt } = await getI18n();
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

  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  // A label at the start of each month keeps the axis readable without a tick per night.
  const months = nights
    .map((night, index) => ({ night, index }))
    .filter(({ night, index }) => index === 0 || night.date.endsWith("-01"));

  return (
    <figure className="px-4 pt-4 pb-3">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <SourceDot source="airbnb" />
          {m.common.sources.airbnb}
        </span>
        <span className="flex items-center gap-1.5">
          <SourceDot source="booking" />
          {m.common.sources.booking}
        </span>
        <span className="ml-auto text-muted tabular-nums">{money(Math.max(...values))}</span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={m.pricing.chart.label}
        className="h-44 w-full overflow-visible"
      >
        {nights.map((night, index) =>
          night.takenBy ? (
            <rect
              key={night.date}
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
      <div className="relative mt-1 h-4 text-[11px] text-muted">
        {months.map(({ night, index }) => (
          <span
            key={night.date}
            className="absolute whitespace-nowrap"
            style={{ left: `${(index / nights.length) * 100}%` }}
          >
            {fmt.date(night.date, index === 0 ? { day: "numeric", month: "short" } : { month: "short" })}
          </span>
        ))}
      </div>
    </figure>
  );
}
