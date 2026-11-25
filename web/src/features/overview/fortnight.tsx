import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { Property, Reservation } from "@/db/schema";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Hidden, SectionTitle, SourceDot } from "../../ui/primitives";
import { slabStyle } from "../../ui/slab";

const NIGHTS = 14;
const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  strip: { padding: { default: "1rem", [WIDE]: "1.25rem 1.5rem 1.5rem" } },
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: "1.5rem",
    rowGap: "0.375rem",
    marginBottom: "0.75rem",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: "0.875rem",
    rowGap: "0.25rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
    color: color.muted,
    fontSize: text.sm,
  },
  key: { display: "inline-flex", alignItems: "center", gap: "0.375rem" },
  swatch: { width: "0.875rem", height: "0.5rem", borderRadius: "3px", boxShadow: "none" },
  // The property's name beside its fourteen nights; above them on a phone.
  line: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [WIDE]: "9rem minmax(0, 1fr)" },
    alignItems: "center",
    columnGap: "1rem",
    rowGap: "0.25rem",
  },
  row: {
    marginInline: "-0.5rem",
    padding: "0.375rem 0.5rem",
    borderRadius: radius.lg,
    backgroundColor: { default: "transparent", ":hover": color.subtle },
    color: color.ink,
    textDecoration: "none",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  days: { marginBottom: "0.125rem" },
  spacer: { display: { default: "none", [WIDE]: "block" } },
  name: {
    overflow: "hidden",
    fontSize: text.base,
    fontWeight: 500,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  track: {
    display: "grid",
    gridTemplateColumns: `repeat(${NIGHTS}, minmax(0, 1fr))`,
    gridTemplateRows: "2.25rem",
    alignItems: "center",
  },
  dayTrack: { display: "grid", gridTemplateColumns: `repeat(${NIGHTS}, minmax(0, 1fr))` },
  day: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.125rem",
    color: color.muted,
    fontSize: text.xs,
    lineHeight: 1.2,
    fontVariantNumeric: "tabular-nums",
  },
  number: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "1.375rem",
    height: "1.375rem",
    borderRadius: radius.full,
    color: color.ink,
    fontSize: text.sm,
    fontWeight: 500,
  },
  today: { backgroundColor: color.ink, color: color.inverse },
  // One night: a hairline to its left, so an empty row still reads as fourteen nights.
  cell: {
    gridRow: 1,
    alignSelf: "stretch",
    borderInlineStartWidth: 1,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.line,
  },
  weekend: { backgroundColor: `color-mix(in oklab, ${color.subtle} 70%, transparent)` },
  slab: {
    gridRow: 1,
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    height: "1.75rem",
    marginInline: "2px",
    paddingInline: "0.5rem",
    overflow: "hidden",
    fontSize: text.sm,
    fontWeight: 500,
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  label: { overflow: "hidden", textOverflow: "ellipsis" },
  // A stay that began before today, or runs past the fortnight, is cut square on that side.
  cutStart: { borderStartStartRadius: 0, borderEndStartRadius: 0, marginInlineStart: 0 },
  cutEnd: { borderStartEndRadius: 0, borderEndEndRadius: 0, marginInlineEnd: 0 },
  clash: { zIndex: 2, paddingInline: 0 },
  span: (from: number, to: number) => ({ gridColumnStart: from, gridColumnEnd: to }),
  at: (column: number) => ({ gridColumnStart: column }),
});

type Bar = { stay: Reservation; from: number; to: number; cutStart: boolean; cutEnd: boolean };

/** The nights of the fortnight, counted from zero, that two stays of one property share. */
function sharedNights(bars: Bar[]): [number, number][] {
  const shared: [number, number][] = [];
  for (const [index, a] of bars.entries()) {
    for (const b of bars.slice(index + 1)) {
      const from = Math.max(a.from, b.from);
      const to = Math.min(a.to, b.to);
      if (from < to) shared.push([from, to]);
    }
  }
  return shared;
}

/**
 * The next fourteen nights, one row per property: each stay is a slab of
 * glass in its source's colour, closed dates are hatched, and a night two
 * stays share is violet. A row opens the calendar on those weeks, and reads
 * out as a sentence.
 */
export function Fortnight({
  properties,
  stays,
  today,
}: {
  properties: Property[];
  stays: Reservation[];
  today: ISODate;
}) {
  const { m, fmt } = useI18n("overview");
  const t = m.overview.fortnight;
  const end = addDays(today, NIGHTS);
  const days = Array.from({ length: NIGHTS }, (_, index) => addDays(today, index));
  const short = (date: ISODate) => fmt.date(date, { day: "numeric", month: "short" });

  const rows = properties.map((property) => {
    const bars: Bar[] = stays
      .filter((stay) => stay.propertyId === property.id && stay.checkIn < end && stay.checkOut > today)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
      .map((stay) => ({
        stay,
        from: Math.max(0, diffDays(today, stay.checkIn)),
        to: Math.min(NIGHTS, diffDays(today, stay.checkOut)),
        cutStart: stay.checkIn < today,
        cutEnd: stay.checkOut > end,
      }));
    const shared = sharedNights(bars);
    const parts = bars.map(({ stay }) =>
      stay.kind === "block"
        ? t.blocked(short(stay.checkIn), short(stay.checkOut))
        : t.stay(
            stay.guestName || t.guest,
            m.common.sources[stay.source],
            short(stay.checkIn),
            short(stay.checkOut),
          ),
    );
    const clashes = shared.reduce((sum, [from, to]) => sum + (to - from), 0);
    if (clashes > 0) parts.unshift(t.clash(clashes));
    return { property, bars, shared, sentence: t.row(property.name, parts.length > 0 ? parts : [t.free]) };
  });

  const sources = (["airbnb", "booking", "direct"] as const).filter((source) =>
    rows.some((row) => row.bars.some((bar) => bar.stay.kind !== "block" && bar.stay.source === source)),
  );
  const anyBlock = rows.some((row) => row.bars.some((bar) => bar.stay.kind === "block"));
  const anyClash = rows.some((row) => row.shared.length > 0);

  return (
    <section aria-labelledby="fortnight" {...stylex.props(styles.strip)}>
      <div {...stylex.props(styles.head)}>
        <SectionTitle id="fortnight">{t.title}</SectionTitle>
        <ul {...stylex.props(styles.legend)}>
          {sources.map((source) => (
            <li key={source} {...stylex.props(styles.key)}>
              <SourceDot source={source} />
              {m.common.sources[source]}
            </li>
          ))}
          {anyBlock && (
            <li {...stylex.props(styles.key)}>
              <span aria-hidden {...stylex.props(slabStyle("block"), styles.swatch)} />
              {t.legendBlocked}
            </li>
          )}
          {anyClash && (
            <li {...stylex.props(styles.key)}>
              <span aria-hidden {...stylex.props(slabStyle("clash"), styles.swatch)} />
              {t.legendClash}
            </li>
          )}
        </ul>
      </div>

      <div aria-hidden {...stylex.props(styles.line, styles.days)}>
        <span {...stylex.props(styles.spacer)} />
        <div {...stylex.props(styles.dayTrack)}>
          {days.map((date, index) => (
            <span key={date} {...stylex.props(styles.day)}>
              {fmt.date(date, { weekday: "narrow" })}
              <span {...stylex.props(styles.number, index === 0 && styles.today)}>
                {Number(date.slice(8))}
              </span>
            </span>
          ))}
        </div>
      </div>

      {rows.map(({ property, bars, shared, sentence }) => (
        <Link
          key={property.id}
          to="/calendar"
          search={{ view: "weeks", start: today }}
          {...stylex.props(styles.line, styles.row)}
        >
          <Hidden>{sentence}</Hidden>
          <span aria-hidden {...stylex.props(styles.name)}>
            {property.name}
          </span>
          <span aria-hidden {...stylex.props(styles.track)}>
            {days.map((date, index) => {
              const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
              return (
                <span
                  key={date}
                  {...stylex.props(
                    styles.cell,
                    styles.at(index + 1),
                    (weekday === 5 || weekday === 6) && styles.weekend,
                  )}
                />
              );
            })}
            {bars.map(({ stay, from, to, cutStart, cutEnd }) => (
              <span
                key={stay.id}
                {...stylex.props(
                  slabStyle(stay.kind === "block" ? "block" : stay.source),
                  styles.slab,
                  styles.span(from + 1, to + 1),
                  cutStart && styles.cutStart,
                  cutEnd && styles.cutEnd,
                )}
              >
                <span {...stylex.props(styles.label)}>{stay.kind === "block" ? "" : stay.guestName}</span>
              </span>
            ))}
            {shared.map(([from, to]) => (
              <span
                key={`${from}-${to}`}
                {...stylex.props(
                  slabStyle("clash"),
                  styles.slab,
                  styles.clash,
                  styles.span(from + 1, to + 1),
                )}
              />
            ))}
          </span>
        </Link>
      ))}
    </section>
  );
}
