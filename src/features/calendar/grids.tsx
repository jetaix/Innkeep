import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import type { Property, Reservation } from "@/db/schema";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { addDays, dayOfWeek, diffDays, type ISODate } from "@/lib/dates";
import { barOf } from "./bars";
import { addMonths, bookedNights, monthWeeks, nightsOf } from "./compute";

/**
 * A small bubble above a square while the pointer is on it, written from its
 * `data-tip`. Pure CSS: a year of squares needs no script and no extra nodes.
 */
const TIP =
  "relative hover:z-30 hover:after:absolute hover:after:bottom-full hover:after:mb-1 hover:after:rounded-md hover:after:bg-ink hover:after:px-2 hover:after:py-1 hover:after:text-[11px] hover:after:font-normal hover:after:whitespace-nowrap hover:after:text-inverse hover:after:shadow-pop hover:after:content-[attr(data-tip)]";
const TIP_CENTRED = "after:left-1/2 after:-translate-x-1/2";

/** Monday to Sunday, from a week known to start on a Monday. */
const WEEK = Array.from({ length: 7 }, (_, index) => addDays("2026-11-02", index));

type Href = (extra?: Record<string, string>) => string;

/** One month as a wall calendar: a chip per property on each night it is taken. */
export async function MonthGrid({
  month,
  properties,
  stays,
  conflicts,
  today,
  selectedId,
  href,
}: {
  month: ISODate;
  properties: Property[];
  stays: Reservation[];
  conflicts: Set<number>;
  today: ISODate;
  selectedId?: number;
  href: Href;
}) {
  const { m, fmt } = await getI18n();
  const t = m.calendar;
  const next = addMonths(month, 1);
  const nights = properties.map((property) => ({
    property,
    nights: nightsOf(stays, property.id, month, next),
  }));

  return (
    <Card className="relative min-w-0 flex-1 overflow-x-auto">
      <div className="min-w-[42rem]">
        <div className="grid grid-cols-7 border-b border-line text-xs text-muted" aria-hidden>
          {WEEK.map((day) => (
            <div key={day} className="px-2 py-1.5">
              {fmt.date(day, { weekday: "short" })}
            </div>
          ))}
        </div>
        {monthWeeks(month).map((week) => (
          <div key={week.find(Boolean)} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {week.map((day, column) =>
              day === null ? (
                <div key={column} className="min-h-24 border-r border-line/70 bg-subtle last:border-r-0" />
              ) : (
                <div
                  key={day}
                  className={cn(
                    "min-h-24 space-y-1 border-r border-line/70 p-1 last:border-r-0",
                    [0, 6].includes(dayOfWeek(day)) && "bg-subtle",
                  )}
                >
                  <Link
                    href={href({ new: `${properties[0].id}:${day}` })}
                    prefetch={false}
                    aria-label={t.grid.addTo(properties[0].name, fmt.date(day))}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs tabular-nums hover:bg-sunken pointer-coarse:size-8",
                      day === today && "bg-ink font-semibold text-inverse hover:bg-ink",
                    )}
                  >
                    {Number(day.slice(8))}
                  </Link>
                  {nights.map(({ property, nights }) => {
                    const stay = nights.get(day);
                    if (!stay) return null;
                    const source = m.common.sources[stay.source];
                    const label =
                      stay.kind === "block"
                        ? stay.notes || (stay.source === "booking" ? t.grid.closedOnBooking : t.grid.blocked)
                        : stay.guestName || source;
                    const range = t.grid.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut));
                    const conflict = conflicts.has(stay.id);
                    // The name is written where the eye lands: on arrival, and again each Monday.
                    const named = day === stay.checkIn || day === month || dayOfWeek(day) === 1;
                    const place = properties.length > 1 ? `${property.name}, ` : "";
                    return (
                      <Link
                        key={property.id}
                        href={href({ r: String(stay.id) })}
                        prefetch={false}
                        aria-label={`${place}${label}, ${source}, ${range}${conflict ? `, ${t.grid.doubleBooking}` : ""}`}
                        title={`${place}${label} · ${range} · ${source}`}
                        className={cn(
                          "block h-5 truncate rounded-[4px] border-l-[3px] px-1.5 text-[11px] leading-5 font-medium text-ink pointer-coarse:h-7 pointer-coarse:leading-7",
                          barOf(stay),
                          conflict && "ring-2 ring-critical",
                          selectedId === stay.id && "ring-2 ring-ink",
                        )}
                      >
                        {named ? label : " "}
                      </Link>
                    );
                  })}
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Twelve small months per property: which nights are taken, and how many were sold. */
export async function YearGrid({
  year,
  properties,
  stays,
  today,
  monthHref,
}: {
  year: ISODate;
  properties: Property[];
  stays: Reservation[];
  today: ISODate;
  monthHref: (month: ISODate) => string;
}) {
  const { m, fmt } = await getI18n();
  const t = m.calendar;
  const months = Array.from({ length: 12 }, (_, index) => addMonths(year, index));
  const end = addMonths(year, 12);
  /** "Léa Martin · 21 Nov to 25 Nov · 4 nights · Airbnb": just enough to know what a square is. */
  const describe = (stay: Reservation) => {
    const source = m.common.sources[stay.source];
    const who =
      stay.kind === "block"
        ? stay.notes || (stay.source === "booking" ? t.grid.closedOnBooking : t.grid.blocked)
        : stay.guestName || source;
    return [
      who,
      t.grid.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut)),
      m.common.count.nights(diffDays(stay.checkIn, stay.checkOut)),
      ...(who === source ? [] : [source]),
    ].join(" · ");
  };

  return (
    <div className="min-w-0 flex-1 space-y-6">
      {properties.map((property) => {
        const nights = nightsOf(stays, property.id, year, end);
        const total = months.reduce((sum, month) => sum + bookedNights(nights, month), 0);
        return (
          <section key={property.id} aria-labelledby={`year-${property.id}`}>
            <h2 id={`year-${property.id}`} className="mb-2 flex flex-wrap items-baseline gap-x-3 px-1">
              <span className="font-semibold">{property.name}</span>
              <span className="text-xs text-muted">{t.year.booked(total)}</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {months.map((month) => (
                <Card key={month} className="p-3">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <Link href={monthHref(month)} className="font-medium capitalize hover:underline">
                      {fmt.date(month, { month: "long" })}
                    </Link>
                    <span className="text-xs text-muted tabular-nums">
                      {m.common.count.nights(bookedNights(nights, month))}
                    </span>
                  </div>
                  {/* The count above says it in words; the squares are for the eye. */}
                  <div className="grid grid-cols-7 gap-0.5 text-[10px] tabular-nums" aria-hidden>
                    {monthWeeks(month)
                      .flat()
                      .map((day, index) => {
                        const stay = day ? nights.get(day) : undefined;
                        return (
                          <span
                            key={index}
                            // What the square stands for, shown on hover.
                            data-tip={stay ? describe(stay) : undefined}
                            className={cn(
                              "flex h-6 items-center justify-center rounded-[3px]",
                              day && !stay && "text-muted",
                              stay && cn("border-l-2 font-medium text-ink", barOf(stay), TIP),
                              // Near an edge the bubble opens inwards, so it never leaves the card.
                              stay &&
                                (index % 7 < 2
                                  ? "after:left-0"
                                  : index % 7 > 4
                                    ? "after:right-0"
                                    : TIP_CENTRED),
                              day === today && "ring-2 ring-ink",
                            )}
                          >
                            {day ? Number(day.slice(8)) : ""}
                          </span>
                        );
                      })}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
