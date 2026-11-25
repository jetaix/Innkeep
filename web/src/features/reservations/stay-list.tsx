import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { Property, Reservation } from "@/db/schema";
import { stayValue } from "@/features/revenue/compute";
import type { Messages } from "@/i18n/messages";
import { addDays, diffDays, type ISODate } from "@/lib/dates";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { Badge, SourceDot } from "../../ui/primitives";

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  list: { margin: 0, padding: 0, listStyle: "none" },
  item: {
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  // Two lines on a phone (who and how much, then when); one row of four on a wider screen.
  row: {
    display: "grid",
    gridTemplateColumns: { default: "1fr auto", [WIDE]: "7rem 1fr 12.5rem 5.5rem" },
    alignItems: "center",
    columnGap: "1rem",
    rowGap: "0.125rem",
    padding: "0.625rem 1rem",
    backgroundColor: { default: "transparent", ":hover": color.subtle },
    color: color.ink,
    textDecoration: "none",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  when: { display: { default: "none", [WIDE]: "block" }, color: color.muted, fontSize: text.sm },
  who: { minWidth: 0 },
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
    gridColumnStart: { default: 1, [WIDE]: "auto" },
    color: { default: color.muted, [WIDE]: color.ink },
    fontSize: { default: text.sm, [WIDE]: text.base },
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
  muted: { color: color.muted },
  amount: {
    gridColumnStart: { default: 2, [WIDE]: "auto" },
    gridRowStart: { default: 1, [WIDE]: "auto" },
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    textAlign: "end",
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
        return (
          <li key={stay.id} {...stylex.props(styles.item)}>
            <Link
              to="/calendar"
              search={{ view: "weeks", start: addDays(stay.checkIn, -3), r: stay.id }}
              {...stylex.props(styles.row)}
            >
              <span {...stylex.props(styles.when)}>{when(stay, today, row)}</span>
              <span {...stylex.props(styles.who)}>
                <span {...stylex.props(styles.line)}>
                  <span {...stylex.props(styles.name, !stay.guestName && styles.missing)}>
                    {stay.guestName || row.guestMissing}
                  </span>
                  {conflicts.has(stay.id) && <Badge tone="critical">{row.doubleBooking}</Badge>}
                </span>
                <span {...stylex.props(styles.source)}>
                  <SourceDot source={stay.source} />
                  <span {...stylex.props(styles.clip)}>
                    {m.common.sources[stay.source]}, {property?.name}
                  </span>
                </span>
              </span>
              <span {...stylex.props(styles.dates)}>
                {row.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut))}
                <span {...stylex.props(styles.muted)}> ({m.common.count.nights(nights)})</span>
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
