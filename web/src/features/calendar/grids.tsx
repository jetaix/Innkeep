import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { Layers2 } from "lucide-react";
import { useState } from "react";
import type { Property, Reservation } from "@/db/schema";
import { addMonths, bookedNights, monthWeeks, nightsOf } from "@/features/calendar/compute";
import { stayValue } from "@/features/revenue/compute";
import type { Messages } from "@/i18n/messages";
import { addDays, dayOfWeek, diffDays, type ISODate } from "@/lib/dates";
import { useI18n } from "../../i18n";
import { color, font, radius, shadow, text } from "../../tokens.stylex";
import { Card } from "../../ui/primitives";
import { barOf, bars, overlapsOf, sharedNights } from "./bars";
import { DAYS, type SearchFor } from "./period";

const CELL = 44; // px per day
const NAME_COL = 176; // px

const COARSE = "@media (pointer: coarse)";
const FAINT_LINE = `color-mix(in oklab, ${color.line} 55%, transparent)`;

/** Monday to Sunday, from a week known to start on a Monday. */
const WEEK = Array.from({ length: 7 }, (_, index) => addDays("2026-11-02", index));

const isWeekend = (day: ISODate) => [0, 6].includes(dayOfWeek(day));

/** What a bar or a chip says: the guest, or why the dates are closed. */
function labelOf(stay: Reservation, grid: Messages["calendar"]["grid"], source: string): string {
  return stay.kind === "block"
    ? stay.notes || (stay.source === "booking" ? grid.closedOnBooking : grid.blocked)
    : stay.guestName || source;
}

const styles = stylex.create({
  // The grid is wider than a phone: it scrolls inside its card, not the page.
  scroller: {
    position: "relative",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    minWidth: 0,
    overflowX: "auto",
  },
  width: (width: number) => ({ width }),
  // Saturdays and Sundays are told apart by a breath of the ground's colour.
  weekend: { backgroundColor: `color-mix(in oklab, ${color.subtle} 55%, ${color.panel})` },
  // Days of another month fall back to the ground the panel floats over.
  outside: { backgroundColor: color.bg },
  selected: { outlineWidth: 2, outlineStyle: "solid", outlineColor: color.ink, outlineOffset: 1 },
  // A stay drawn a day at a time is marked along its two long edges, so it still reads as one slab.
  selectedPiece: { boxShadow: `inset 0 2px 0 ${color.ink}, inset 0 -2px 0 ${color.ink}` },
  clip: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },

  // Weeks
  head: {
    display: "flex",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    color: color.muted,
    fontSize: text.sm,
  },
  corner: {
    position: "sticky",
    left: 0,
    zIndex: 20,
    flexShrink: 0,
    width: NAME_COL,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: color.line,
    backgroundColor: color.panel,
  },
  dayHead: { flexShrink: 0, width: CELL, paddingBlock: "0.375rem", textAlign: "center" },
  monthName: { height: "1rem", color: color.ink, fontSize: text.xs, fontWeight: 600, textAlign: "left" },
  monthText: { paddingLeft: "0.5rem", whiteSpace: "nowrap" },
  weekday: { fontSize: text.xs },
  dayNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.5rem",
    height: "1.5rem",
    marginTop: "0.125rem",
    marginInline: "auto",
    borderRadius: radius.full,
    color: color.ink,
    fontVariantNumeric: "tabular-nums",
  },
  now: { backgroundColor: color.ink, color: color.inverse, fontWeight: 600 },
  row: {
    position: "relative",
    display: "flex",
    height: "3.5rem",
    borderBottomWidth: { default: 1, ":last-child": 0 },
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  name: {
    position: "sticky",
    left: 0,
    zIndex: 20,
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    width: NAME_COL,
    paddingInline: "0.75rem",
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: color.line,
    backgroundColor: color.panel,
    color: color.ink,
    fontWeight: 500,
    textDecoration: { default: "none", ":hover": "underline" },
  },
  cell: {
    flexShrink: 0,
    width: CELL,
    borderRightWidth: 1,
    borderRightStyle: "solid",
    borderRightColor: FAINT_LINE,
    backgroundColor: { default: "transparent", ":hover": color.sunken },
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  cellWeekend: {
    backgroundColor: {
      default: `color-mix(in oklab, ${color.subtle} 55%, ${color.panel})`,
      ":hover": color.sunken,
    },
  },
  bar: {
    position: "absolute",
    top: "0.625rem",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    height: "2.25rem",
    overflow: "hidden",
    paddingInline: "0.75rem",
    borderRadius: radius.slab,
    color: color.ink,
    fontSize: text.sm,
    fontWeight: 500,
    textDecoration: "none",
    filter: { default: null, ":hover": "brightness(1.04) saturate(1.08)" },
    transitionProperty: "filter",
    transitionDuration: "150ms",
  },
  // A stay that began before, or runs past, the days on screen is cut square on that side.
  cutStart: { borderStartStartRadius: 0, borderEndStartRadius: 0 },
  cutEnd: { borderStartEndRadius: 0, borderEndEndRadius: 0 },
  // The nights two stays share, drawn over both in the overlap's violet.
  shared: {
    position: "absolute",
    top: "0.625rem",
    zIndex: 11,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "2.25rem",
    borderRadius: 6,
    pointerEvents: "none",
  },
  place: (left: number, width: number) => ({ left, width }),

  // Month
  monthWidth: { minWidth: "42rem" },
  seven: { display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" },
  weekdays: {
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    color: color.muted,
    fontSize: text.sm,
  },
  weekdayName: { padding: "0.375rem 0.5rem" },
  week: {
    borderBottomWidth: { default: 1, ":last-child": 0 },
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  // No rules between the days of a week: a slab crosses them unbroken.
  day: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: 0,
    minHeight: "6.5rem",
    paddingBlock: "0.375rem 0.5rem",
  },
  date: {
    display: "flex",
    alignSelf: "flex-start",
    marginInlineStart: "0.375rem",
    alignItems: "center",
    justifyContent: "center",
    width: { default: "1.5rem", [COARSE]: "2rem" },
    height: { default: "1.5rem", [COARSE]: "2rem" },
    borderRadius: radius.full,
    backgroundColor: { default: "transparent", ":hover": color.sunken },
    color: color.ink,
    fontSize: text.sm,
    fontVariantNumeric: "tabular-nums",
    textDecoration: "none",
  },
  dateNow: { backgroundColor: color.ink, color: color.inverse, fontWeight: 600 },
  chip: {
    display: "block",
    flexShrink: 0,
    height: { default: "1.375rem", [COARSE]: "1.75rem" },
    overflow: "hidden",
    paddingInline: "0.5rem",
    color: color.ink,
    fontSize: text.xs,
    fontWeight: 500,
    lineHeight: { default: "1.375rem", [COARSE]: "1.75rem" },
    textDecoration: "none",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    filter: { default: null, ":hover": "brightness(1.04) saturate(1.08)" },
    transitionProperty: "filter",
    transitionDuration: "150ms",
  },
  // Rounded only where the stay begins and where it ends.
  chipStart: { marginInlineStart: "0.25rem", borderStartStartRadius: 11, borderEndStartRadius: 11 },
  chipEnd: { marginInlineEnd: "0.25rem", borderStartEndRadius: 11, borderEndEndRadius: 11 },
  // Keeps a property's line of the week in place on a night it is free.
  gap: { flexShrink: 0, height: { default: "1.375rem", [COARSE]: "1.75rem" } },

  // Year
  year: {
    display: "flex",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    flexDirection: "column",
    gap: "1.5rem",
    minWidth: 0,
  },
  yearTitle: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: "0.75rem",
    margin: "0 0 0.5rem",
    paddingInline: "0.25rem",
    fontSize: text.base,
    fontWeight: 400,
  },
  yearName: { fontFamily: font.display, fontSize: "1.375rem", letterSpacing: "-0.02em" },
  small: { color: color.muted, fontSize: text.sm },
  months: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 40rem)": "repeat(2, minmax(0, 1fr))",
      "@media (min-width: 64rem)": "repeat(3, minmax(0, 1fr))",
      "@media (min-width: 96rem)": "repeat(4, minmax(0, 1fr))",
    },
    gap: "1rem",
  },
  monthCard: { padding: "0.875rem" },
  monthHead: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  monthLink: {
    color: color.ink,
    fontWeight: 500,
    textDecoration: { default: "none", ":hover": "underline" },
    textTransform: "capitalize",
  },
  count: { color: color.muted, fontSize: text.sm, fontVariantNumeric: "tabular-nums" },
  squares: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "0.125rem",
    fontSize: "0.625rem",
    fontVariantNumeric: "tabular-nums",
  },
  square: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "1.5rem",
    borderRadius: 5,
  },
  free: { color: color.muted },
  taken: { position: "relative", color: color.ink, fontWeight: 500 },
  squareNow: { outlineWidth: 2, outlineStyle: "solid", outlineColor: color.ink, outlineOffset: 1 },
  raised: { zIndex: 30 },
  tip: {
    position: "absolute",
    bottom: "100%",
    marginBottom: "0.25rem",
    padding: "0.25rem 0.5rem",
    borderRadius: radius.md,
    backgroundColor: color.ink,
    backgroundImage: "none",
    boxShadow: shadow.pop,
    color: color.inverse,
    fontSize: text.xs,
    fontWeight: 400,
    whiteSpace: "nowrap",
    pointerEvents: "none",
  },
  tipLeft: { left: 0 },
  tipRight: { right: 0 },
  tipCentred: { left: "50%", transform: "translateX(-50%)" },
});

/** Five weeks as a timeline: a row per property, a bar per stay. */
export function WeeksGrid({
  start,
  properties,
  stays,
  conflicts,
  today,
  selectedId,
  search,
}: {
  start: ISODate;
  properties: Property[];
  stays: Reservation[];
  conflicts: Set<number>;
  today: ISODate;
  selectedId?: number;
  search: SearchFor;
}) {
  const { m, fmt } = useI18n("calendar");
  const t = m.calendar;
  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));
  const overlaps = overlapsOf(stays, conflicts);

  return (
    <Card xstyle={styles.scroller}>
      <div {...stylex.props(styles.width(NAME_COL + DAYS * CELL))}>
        <div aria-hidden {...stylex.props(styles.head)}>
          <div {...stylex.props(styles.corner)} />
          {days.map((day, index) => {
            const dayNumber = Number(day.slice(8));
            return (
              <div key={day} {...stylex.props(styles.dayHead, isWeekend(day) && styles.weekend)}>
                <div {...stylex.props(styles.monthName)}>
                  {(index === 0 || dayNumber === 1) && (
                    <span {...stylex.props(styles.monthText)}>{fmt.date(day, { month: "long" })}</span>
                  )}
                </div>
                <div {...stylex.props(styles.weekday)}>{fmt.date(day, { weekday: "short" }).slice(0, 2)}</div>
                <div {...stylex.props(styles.dayNumber, day === today && styles.now)}>{dayNumber}</div>
              </div>
            );
          })}
        </div>

        {properties.map((property) => (
          <div key={property.id} {...stylex.props(styles.row)}>
            <Link to="/properties/$id" params={{ id: property.id }} {...stylex.props(styles.name)}>
              <span {...stylex.props(styles.clip)}>{property.name}</span>
            </Link>
            {/* Day cells are pointer targets only; keyboard users add with N. */}
            {days.map((day) => (
              <Link
                key={day}
                to="/calendar"
                search={search({ new: `${property.id}:${day}` })}
                preload={false}
                tabIndex={-1}
                aria-label={t.grid.addTo(property.name, fmt.date(day))}
                {...stylex.props(styles.cell, isWeekend(day) && styles.cellWeekend)}
              />
            ))}
            {stays
              .filter((stay) => stay.propertyId === property.id)
              .map((stay) => {
                // Bars run from the afternoon of check-in to the morning of check-out.
                const begins = diffDays(start, stay.checkIn) + 0.5;
                const ends = diffDays(start, stay.checkOut) + 0.5;
                const from = Math.max(0, begins);
                const to = Math.min(DAYS, ends);
                if (to <= from) return null;
                const source = m.common.sources[stay.source];
                const range = t.grid.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut));
                const label = labelOf(stay, t.grid, source);
                const conflict = conflicts.has(stay.id);
                return (
                  <Link
                    key={stay.id}
                    to="/calendar"
                    search={search({ r: stay.id })}
                    preload={false}
                    aria-label={`${label}, ${source}, ${range}${conflict ? `, ${t.grid.doubleBooking}` : ""}`}
                    title={`${label} · ${range} · ${source}`}
                    {...stylex.props(
                      styles.bar,
                      barOf(stay),
                      styles.place(NAME_COL + from * CELL + 1, (to - from) * CELL - 2),
                      begins < 0 && styles.cutStart,
                      ends > DAYS && styles.cutEnd,
                      selectedId === stay.id && styles.selected,
                    )}
                  >
                    <span {...stylex.props(styles.clip)}>{label}</span>
                  </Link>
                );
              })}
            {overlaps
              .filter((overlap) => overlap.propertyId === property.id)
              .map((overlap) => {
                const from = Math.max(0, diffDays(start, overlap.from) + 0.5);
                const to = Math.min(DAYS, diffDays(start, overlap.to) + 0.5);
                if (to <= from) return null;
                return (
                  // The bars beneath say it in words; this draws it.
                  <span
                    key={`${overlap.from}-${overlap.to}`}
                    aria-hidden
                    title={t.grid.doubleBooking}
                    {...stylex.props(
                      styles.shared,
                      bars.clash,
                      styles.place(NAME_COL + from * CELL + 1, (to - from) * CELL - 2),
                    )}
                  >
                    <Layers2 size={14} />
                  </span>
                );
              })}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** One month as a wall calendar: a chip per property on each night it is taken. */
export function MonthGrid({
  month,
  properties,
  stays,
  conflicts,
  today,
  selectedId,
  search,
}: {
  month: ISODate;
  properties: Property[];
  stays: Reservation[];
  conflicts: Set<number>;
  today: ISODate;
  selectedId?: number;
  search: SearchFor;
}) {
  const { m, fmt } = useI18n("calendar");
  const t = m.calendar;
  const next = addMonths(month, 1);
  const overlaps = overlapsOf(stays, conflicts);
  const nights = properties.map((property) => ({
    property,
    nights: nightsOf(stays, property.id, month, next),
    shared: sharedNights(overlaps, property.id),
  }));

  return (
    <Card xstyle={styles.scroller}>
      <div {...stylex.props(styles.monthWidth)}>
        <div aria-hidden {...stylex.props(styles.seven, styles.weekdays)}>
          {WEEK.map((day) => (
            <div key={day} {...stylex.props(styles.weekdayName)}>
              {fmt.date(day, { weekday: "short" })}
            </div>
          ))}
        </div>
        {monthWeeks(month).map((week) => {
          // A property keeps its line across the week, so its stays run straight from day to day.
          const lines = nights.filter((line) => week.some((day) => day !== null && line.nights.has(day)));
          return (
            <div key={week.find(Boolean)} {...stylex.props(styles.seven, styles.week)}>
              {week.map((day, column) =>
                day === null ? (
                  <div key={column} {...stylex.props(styles.day, styles.outside)} />
                ) : (
                  <div key={day} {...stylex.props(styles.day, isWeekend(day) && styles.weekend)}>
                    <Link
                      to="/calendar"
                      search={search({ new: `${properties[0].id}:${day}` })}
                      preload={false}
                      aria-label={t.grid.addTo(properties[0].name, fmt.date(day))}
                      {...stylex.props(styles.date, day === today && styles.dateNow)}
                    >
                      {Number(day.slice(8))}
                    </Link>
                    {lines.map(({ property, nights, shared }) => {
                      const stay = nights.get(day);
                      if (!stay) return <span key={property.id} aria-hidden {...stylex.props(styles.gap)} />;
                      const source = m.common.sources[stay.source];
                      const label = labelOf(stay, t.grid, source);
                      const range = t.grid.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut));
                      const conflict = conflicts.has(stay.id);
                      // The name is written where the eye lands: on arrival, and again each Monday.
                      const named = day === stay.checkIn || day === month || dayOfWeek(day) === 1;
                      const place = properties.length > 1 ? `${property.name}, ` : "";
                      return (
                        <Link
                          key={property.id}
                          to="/calendar"
                          search={search({ r: stay.id })}
                          preload={false}
                          aria-label={`${place}${label}, ${source}, ${range}${conflict ? `, ${t.grid.doubleBooking}` : ""}`}
                          title={`${place}${label} · ${range} · ${source}`}
                          {...stylex.props(
                            styles.chip,
                            shared.has(day) ? bars.clash : barOf(stay),
                            day === stay.checkIn && styles.chipStart,
                            addDays(day, 1) === stay.checkOut && styles.chipEnd,
                            selectedId === stay.id && styles.selectedPiece,
                          )}
                        >
                          {named ? label : " "}
                        </Link>
                      );
                    })}
                  </div>
                ),
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** Twelve small months per property: which nights are taken, and how many were sold. */
export function YearGrid({
  year,
  properties,
  stays,
  conflicts,
  today,
}: {
  year: ISODate;
  properties: Property[];
  stays: Reservation[];
  conflicts: Set<number>;
  today: ISODate;
}) {
  const { m, fmt } = useI18n("calendar");
  const t = m.calendar;
  const overlaps = overlapsOf(stays, conflicts);
  const months = Array.from({ length: 12 }, (_, index) => addMonths(year, index));
  const end = addMonths(year, 12);
  /** "Léa Martin · 21 Nov to 25 Nov · 4 nights · €480 · Airbnb": just enough to know what a square is. */
  const describe = (stay: Reservation) => {
    const source = m.common.sources[stay.source];
    const who = labelOf(stay, t.grid, source);
    // The payout when it is known; otherwise the nightly rate stands in, and the sign says so.
    const value = stay.kind === "reservation" ? stayValue(stay, properties) : null;
    const currency = properties.find((property) => property.id === stay.propertyId)?.currency ?? "EUR";
    return [
      who,
      t.grid.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut)),
      m.common.count.nights(diffDays(stay.checkIn, stay.checkOut)),
      ...(value
        ? [`${value.estimated ? "≈ " : ""}${fmt.money(value.total, currency, { cents: false })}`]
        : []),
      ...(who === source ? [] : [source]),
    ].join(" · ");
  };

  return (
    <div {...stylex.props(styles.year)}>
      {properties.map((property) => {
        const nights = nightsOf(stays, property.id, year, end);
        const shared = sharedNights(overlaps, property.id);
        const total = months.reduce((sum, month) => sum + bookedNights(nights, month), 0);
        return (
          <section key={property.id} aria-labelledby={`year-${property.id}`}>
            <h2 id={`year-${property.id}`} {...stylex.props(styles.yearTitle)}>
              <span {...stylex.props(styles.yearName)}>{property.name}</span>
              <span {...stylex.props(styles.small)}>{t.year.booked(total)}</span>
            </h2>
            <div {...stylex.props(styles.months)}>
              {months.map((month) => (
                <YearMonth
                  key={month}
                  month={month}
                  nights={nights}
                  shared={shared}
                  today={today}
                  describe={describe}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function YearMonth({
  month,
  nights,
  shared,
  today,
  describe,
}: {
  month: ISODate;
  nights: Map<ISODate, Reservation>;
  shared: Set<ISODate>;
  today: ISODate;
  describe: (stay: Reservation) => string;
}) {
  const { m, fmt } = useI18n("calendar");
  // The square under the pointer: it alone carries a bubble, so a year of squares needs no extra nodes.
  const [pointed, setPointed] = useState<number | null>(null);

  return (
    <Card xstyle={styles.monthCard}>
      <div {...stylex.props(styles.monthHead)}>
        <Link to="/calendar" search={{ start: month }} {...stylex.props(styles.monthLink)}>
          {fmt.date(month, { month: "long" })}
        </Link>
        <span {...stylex.props(styles.count)}>{m.common.count.nights(bookedNights(nights, month))}</span>
      </div>
      {/* The count above says it in words; the squares are for the eye. */}
      <div aria-hidden {...stylex.props(styles.squares)}>
        {monthWeeks(month)
          .flat()
          .map((day, index) => {
            const stay = day ? nights.get(day) : undefined;
            return (
              <span
                key={index}
                onPointerEnter={stay ? () => setPointed(index) : undefined}
                onPointerLeave={stay ? () => setPointed(null) : undefined}
                {...stylex.props(
                  styles.square,
                  day !== null && !stay && styles.free,
                  stay && styles.taken,
                  stay && (day && shared.has(day) ? bars.clash : barOf(stay)),
                  stay && pointed === index && styles.raised,
                  day === today && styles.squareNow,
                )}
              >
                {day ? Number(day.slice(8)) : ""}
                {/* What the square stands for, shown while the pointer is on it. */}
                {stay && pointed === index && (
                  <span
                    {...stylex.props(
                      styles.tip,
                      // Near an edge the bubble opens inwards, so it never leaves the card.
                      index % 7 < 2 ? styles.tipLeft : index % 7 > 4 ? styles.tipRight : styles.tipCentred,
                    )}
                  >
                    {describe(stay)}
                  </span>
                )}
              </span>
            );
          })}
      </div>
    </Card>
  );
}
