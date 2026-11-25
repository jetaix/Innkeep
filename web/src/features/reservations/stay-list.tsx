import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { Property, Reservation } from "@/db/schema";
import { stayValue } from "@/features/revenue/compute";
import type { Messages } from "@/i18n/messages";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Badge, SourceDot } from "../../ui/primitives";
import { figureStyle, washStyle } from "../../ui/slab";

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  list: { margin: 0, padding: 0, listStyle: "none" },
  item: {
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  // A ledger line: the arrival's date on a sheet of its source's colour, then who, when and how much.
  row: {
    display: "grid",
    gridTemplateColumns: {
      default: "2.75rem minmax(0, 1fr) auto",
      [WIDE]: "2.75rem minmax(0, 1fr) 12.5rem 5.5rem",
    },
    alignItems: "center",
    columnGap: { default: "0.75rem", [WIDE]: "1rem" },
    rowGap: "0.25rem",
    padding: "0.625rem 1rem",
    backgroundColor: { default: "transparent", ":hover": color.subtle },
    color: color.ink,
    textDecoration: "none",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  stub: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gridRowEnd: { default: "span 2", [WIDE]: "auto" },
    alignSelf: "start",
    width: "2.75rem",
    height: "2.75rem",
    borderRadius: radius.slab,
  },
  day: { fontSize: "1.25rem" },
  month: { marginTop: "0.0625rem", color: color.muted, fontSize: text.xs, lineHeight: 1 },
  who: {
    gridColumnStart: { default: 2, [WIDE]: "auto" },
    gridRowStart: { default: 1, [WIDE]: "auto" },
    minWidth: 0,
  },
  line: { display: "flex", alignItems: "center", gap: "0.5rem" },
  name: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 },
  missing: { color: color.muted },
  source: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    marginTop: "0.125rem",
    color: color.muted,
    fontSize: text.sm,
  },
  clip: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dates: {
    gridColumnStart: { default: 2, [WIDE]: "auto" },
    gridColumnEnd: { default: "span 2", [WIDE]: "auto" },
    gridRowStart: { default: 2, [WIDE]: "auto" },
    minWidth: 0,
    color: { default: color.muted, [WIDE]: color.ink },
    fontSize: { default: text.sm, [WIDE]: text.base },
    fontVariantNumeric: "tabular-nums",
  },
  range: { whiteSpace: "nowrap" },
  // Under the dates on a wide screen, after them on a phone.
  sub: {
    display: { default: "inline", [WIDE]: "block" },
    marginTop: { default: 0, [WIDE]: "0.125rem" },
    color: color.muted,
    fontSize: text.sm,
  },
  lead: { display: { default: "inline", [WIDE]: "none" } },
  amount: {
    gridColumnStart: { default: 3, [WIDE]: "auto" },
    gridRowStart: { default: 1, [WIDE]: "auto" },
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    textAlign: "end",
    whiteSpace: "nowrap",
  },
  about: { color: color.muted, fontWeight: 400 },
});

/** What the API sends for a stay or a place: the database row, as JSON. */
export type Stay = Reservation;

function when(stay: Stay, today: ISODate, row: Messages["reservations"]["row"]): string {
  if (stay.checkOut <= today) return row.ended;
  const days = diffDays(today, stay.checkIn);
  if (days === 0) return row.arrivesToday;
  if (days < 0) return row.stayingNow;
  if (days === 1) return row.arrivesTomorrow;
  return row.inDays(days);
}

/** Rows of guest stays. Each row opens the reservation in the calendar. */
export function StayList({
  stays,
  properties,
  conflicts,
  today,
}: {
  stays: Stay[];
  properties: Property[];
  conflicts: Set<number>;
  today: ISODate;
}) {
  const { m, fmt } = useI18n("reservations");
  const row = m.reservations.row;
  return (
    <ul {...stylex.props(styles.list)}>
      {stays.map((stay) => {
        const property = properties.find((place) => place.id === stay.propertyId);
        const nights = diffDays(stay.checkIn, stay.checkOut);
        const value = stayValue(stay, properties);
        const clash = conflicts.has(stay.id);
        return (
          <li key={stay.id} {...stylex.props(styles.item)}>
            <Link
              to="/calendar"
              search={{ view: "weeks", start: addDays(stay.checkIn, -3), r: stay.id }}
              {...stylex.props(styles.row)}
            >
              {/* The dates are written out beside it: the stub is for the eye. */}
              <span aria-hidden {...stylex.props(styles.stub, washStyle(clash ? "clash" : stay.source))}>
                <span {...stylex.props(figureStyle, styles.day)}>{Number(stay.checkIn.slice(8))}</span>
                <span {...stylex.props(styles.month)}>{fmt.date(stay.checkIn, { month: "short" })}</span>
              </span>
              <span {...stylex.props(styles.who)}>
                <span {...stylex.props(styles.line)}>
                  <span {...stylex.props(styles.name, !stay.guestName && styles.missing)}>
                    {stay.guestName || row.guestMissing}
                  </span>
                  {clash && <Badge tone="clash">{row.doubleBooking}</Badge>}
                </span>
                <span {...stylex.props(styles.source)}>
                  <SourceDot source={stay.source} />
                  <span {...stylex.props(styles.clip)}>
                    {m.common.sources[stay.source]}, {property?.name}
                  </span>
                </span>
              </span>
              <span {...stylex.props(styles.dates)}>
                <span {...stylex.props(styles.range)}>
                  {row.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut))}
                </span>
                <span {...stylex.props(styles.sub)}>
                  <span {...stylex.props(styles.lead)}> · </span>
                  {m.common.count.nights(nights)} · {when(stay, today, row)}
                </span>
              </span>
              <span {...stylex.props(styles.amount)} title={value.estimated ? row.estimated : row.entered}>
                {value.estimated && <span {...stylex.props(styles.about)}>≈ </span>}
                {fmt.money(value.total, property?.currency ?? "EUR")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
