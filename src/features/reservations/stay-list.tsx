import Link from "next/link";
import { sourceLabel } from "@/channels";
import { Badge, SourceDot } from "@/components/ui/primitives";
import type { Property, Reservation } from "@/db/schema";
import { stayValue } from "@/features/revenue/compute";
import type { Messages } from "@/i18n/messages";
import { getI18n } from "@/i18n/server";
import { addDays, diffDays, type ISODate } from "@/lib/dates";

function when(stay: Reservation, today: ISODate, row: Messages["reservations"]["row"]): string {
  if (stay.checkOut <= today) return row.ended;
  const days = diffDays(today, stay.checkIn);
  if (days === 0) return row.arrivesToday;
  if (days < 0) return row.stayingNow;
  if (days === 1) return row.arrivesTomorrow;
  return row.inDays(days);
}

/** Rows of upcoming guest stays. Each row opens the reservation in the calendar. */
export async function StayList({
  stays,
  properties,
  conflicts,
  today,
}: {
  stays: Reservation[];
  properties: Property[];
  conflicts: Set<number>;
  today: ISODate;
}) {
  const { m, fmt } = await getI18n();
  const row = m.reservations.row;
  return (
    <ul className="divide-y divide-line">
      {stays.map((stay) => {
        const property = properties.find((p) => p.id === stay.propertyId);
        const nights = diffDays(stay.checkIn, stay.checkOut);
        const value = stayValue(stay, properties);
        return (
          <li key={stay.id}>
            <Link
              href={`/calendar?view=weeks&start=${addDays(stay.checkIn, -3)}&r=${stay.id}`}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-0.5 px-4 py-2.5 transition-colors hover:bg-subtle sm:grid-cols-[7rem_1fr_12.5rem_5.5rem]"
            >
              <span className="hidden text-xs text-muted sm:block">{when(stay, today, row)}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className={`truncate font-medium ${stay.guestName ? "" : "text-muted"}`}>
                    {stay.guestName || row.guestMissing}
                  </span>
                  {conflicts.has(stay.id) && <Badge tone="critical">{row.doubleBooking}</Badge>}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <SourceDot source={stay.source} />
                  <span className="truncate">
                    {sourceLabel(stay.source)}, {property?.name}
                  </span>
                </span>
              </span>
              <span className="col-start-1 text-xs whitespace-nowrap text-muted tabular-nums sm:col-start-auto sm:text-[13px] sm:text-ink">
                {row.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut))}
                <span className="text-muted"> ({m.common.count.nights(nights)})</span>
              </span>
              <span
                className="col-start-2 row-start-1 text-right font-medium tabular-nums sm:col-start-auto sm:row-start-auto"
                title={value.estimated ? row.estimated : row.entered}
              >
                {value.estimated && <span className="font-normal text-muted">≈ </span>}
                {fmt.money(value.total, property?.currency ?? "EUR")}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
