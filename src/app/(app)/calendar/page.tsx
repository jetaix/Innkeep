import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { connection } from "next/server";
import { SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, Kbd, Notice, PageHeader } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { getDb, listings } from "@/db";
import { BAR } from "@/features/calendar/bars";
import { addMonths, isView, monthStart, VIEWS, type View, yearStart } from "@/features/calendar/compute";
import { MonthGrid, YearGrid } from "@/features/calendar/grids";
import { NewStayPanel, StayPanel } from "@/features/calendar/panels";
import { syncAllAction } from "@/features/properties/actions";
import { findConflicts, getProperties, getStays } from "@/features/reservations/queries";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";
import { addDays, dayOfWeek, diffDays, isISODate, today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.calendar.title };
}

const DAYS = 35;
const CELL = 44; // px per day
const NAME_COL = 176; // px

export default function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<Loading />}>
      <Calendar searchParams={searchParams} />
    </Suspense>
  );
}

async function Calendar({ searchParams }: Pick<PageProps<"/calendar">, "searchParams">) {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.calendar;
  const params = await searchParams;
  const now = today();
  const view: View = isView(params.view) ? params.view : "month";
  const asked = isISODate(params.start) ? params.start : null;
  // Each view starts where it reads best: a few days back, the first of the month, the first of January.
  const start =
    view === "month"
      ? monthStart(asked ?? now)
      : view === "year"
        ? yearStart(asked ?? now)
        : (asked ?? addDays(now, -3));
  const end =
    view === "month" ? addMonths(start, 1) : view === "year" ? addMonths(start, 12) : addDays(start, DAYS);
  const step = (direction: 1 | -1) =>
    view === "month"
      ? addMonths(start, direction)
      : view === "year"
        ? addMonths(start, 12 * direction)
        : addDays(start, 28 * direction);
  const days = Array.from({ length: DAYS }, (_, i) => addDays(start, i));

  const properties = await getProperties();
  if (properties.length === 0) {
    return (
      <EmptyState
        title={t.empty.title}
        action={
          <Link href="/properties" className={buttonClass({ variant: "primary" })}>
            {t.empty.addProperty}
          </Link>
        }
      >
        {t.empty.body}
      </EmptyState>
    );
  }

  const stays = await getStays(addDays(start, -1), end);
  const conflicts = findConflicts(stays);

  const feeds = (await getDb().select().from(listings).all()).filter((listing) => listing.icalUrl);
  const lastSync = Math.max(0, ...feeds.map((listing) => listing.lastSyncedAt ?? 0));
  const failing = feeds.filter((listing) => listing.lastSyncError).length;

  const href = (extra: Record<string, string> = {}, from = start, as: View = view) =>
    `/calendar?${new URLSearchParams({ ...(as === "month" ? {} : { view: as }), start: from, ...extra })}`;
  const closeHref = href();

  const selected = params.r ? stays.find((stay) => stay.id === Number(params.r)) : undefined;
  const creating = typeof params.new === "string" && !selected;
  const [newProperty, newDate] = typeof params.new === "string" ? params.new.split(":") : [];

  return (
    <>
      <PageHeader
        title={t.title}
        description={
          <>
            {t.header.range(
              fmt.date(start),
              fmt.date(addDays(end, -1), { day: "numeric", month: "short", year: "numeric" }),
            )}{" "}
            {feeds.length === 0
              ? t.header.noCalendars
              : lastSync
                ? t.header.synced(fmt.timeAgo(lastSync))
                : t.header.notSynced}
            {failing > 0 && (
              <>
                {" "}
                <Link href="/suggestions" className="font-medium text-critical underline underline-offset-2">
                  {t.header.failing(failing)}
                </Link>
              </>
            )}
          </>
        }
      >
        <nav aria-label={t.header.view} className="flex">
          {VIEWS.map((option, index) => (
            <Link
              key={option}
              // Keep looking at the same time: the month or year of the day the current view starts on.
              href={href({}, view === "weeks" ? addDays(start, 3) : start, option)}
              aria-current={option === view ? "page" : undefined}
              className={buttonClass(
                {},
                cn(
                  index > 0 && "-ml-px",
                  index === 0
                    ? "rounded-r-none"
                    : index === VIEWS.length - 1
                      ? "rounded-l-none"
                      : "rounded-none",
                  option === view && "bg-sunken font-semibold",
                ),
              )}
            >
              {t.header.views[option]}
            </Link>
          ))}
        </nav>
        <div className="flex">
          <Link
            href={href({}, step(-1))}
            data-shortcut="ArrowLeft"
            aria-label={t.header.previous[view]}
            title={t.header.withKey(t.header.previous[view], "←")}
            className={buttonClass({}, "rounded-r-none px-2")}
          >
            <ChevronLeft aria-hidden />
          </Link>
          <Link
            href={view === "month" ? "/calendar" : `/calendar?view=${view}`}
            data-shortcut="t"
            title={t.header.withKey(t.header.today, "T")}
            className={buttonClass({}, "-ml-px rounded-none")}
          >
            {t.header.today}
          </Link>
          <Link
            href={href({}, step(1))}
            data-shortcut="ArrowRight"
            aria-label={t.header.next[view]}
            title={t.header.withKey(t.header.next[view], "→")}
            className={buttonClass({}, "-ml-px rounded-l-none px-2")}
          >
            <ChevronRight aria-hidden />
          </Link>
        </div>
        <form action={syncAllAction}>
          <SubmitButton pendingLabel={t.header.syncing}>{t.header.syncNow}</SubmitButton>
        </form>
        <Link
          href={href({ new: `${properties[0].id}:${now}` })}
          data-shortcut="n"
          className={buttonClass({ variant: "primary" })}
        >
          {t.header.add} <Kbd className="border-inverse/30 bg-transparent text-inverse/80">N</Kbd>
        </Link>
      </PageHeader>

      {conflicts.size > 0 && (
        <Notice tone="critical" role="alert" className="mb-4">
          <strong className="font-semibold">{t.conflict.title}</strong> {t.conflict.body(conflicts.size)}
        </Notice>
      )}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        {view === "month" && (
          <MonthGrid
            month={start}
            properties={properties}
            stays={stays}
            conflicts={conflicts}
            today={now}
            selectedId={selected?.id}
            href={href}
          />
        )}
        {view === "year" && (
          <YearGrid
            year={start}
            properties={properties}
            stays={stays}
            today={now}
            monthHref={(month) => href({}, month, "month")}
          />
        )}
        {view === "weeks" && (
          <Card className="relative min-w-0 flex-1 overflow-x-auto">
            <div style={{ width: NAME_COL + DAYS * CELL }}>
              <div className="flex border-b border-line text-xs text-muted" aria-hidden>
                <div
                  className="sticky left-0 z-20 shrink-0 border-r border-line bg-bg"
                  style={{ width: NAME_COL }}
                />
                {days.map((day, index) => {
                  const dayNumber = Number(day.slice(8));
                  return (
                    <div
                      key={day}
                      style={{ width: CELL }}
                      className={cn(
                        "shrink-0 pt-1.5 pb-1.5 text-center",
                        [0, 6].includes(dayOfWeek(day)) && "bg-subtle",
                      )}
                    >
                      <div className="h-4 text-left text-[11px] font-semibold text-ink">
                        {(index === 0 || dayNumber === 1) && (
                          <span className="pl-2 whitespace-nowrap">{fmt.date(day, { month: "long" })}</span>
                        )}
                      </div>
                      <div className="text-[11px]">{fmt.date(day, { weekday: "short" }).slice(0, 2)}</div>
                      <div
                        className={cn(
                          "mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full tabular-nums",
                          day === now ? "bg-ink font-semibold text-inverse" : "text-ink",
                        )}
                      >
                        {dayNumber}
                      </div>
                    </div>
                  );
                })}
              </div>

              {properties.map((property) => (
                <div key={property.id} className="relative flex h-14 border-b border-line last:border-b-0">
                  <Link
                    href={`/properties/${property.id}`}
                    className="sticky left-0 z-20 flex shrink-0 items-center border-r border-line bg-bg px-3 font-medium hover:underline"
                    style={{ width: NAME_COL }}
                  >
                    <span className="truncate">{property.name}</span>
                  </Link>
                  {/* Day cells are pointer targets only; keyboard users add with N. */}
                  {days.map((day) => (
                    <Link
                      key={day}
                      href={href({ new: `${property.id}:${day}` })}
                      prefetch={false}
                      tabIndex={-1}
                      aria-label={t.grid.addTo(property.name, fmt.date(day))}
                      style={{ width: CELL }}
                      className={cn(
                        "shrink-0 border-r border-line/70 hover:bg-sunken",
                        [0, 6].includes(dayOfWeek(day)) && "bg-subtle",
                      )}
                    />
                  ))}
                  {stays
                    .filter((stay) => stay.propertyId === property.id)
                    .map((stay) => {
                      // Bars run from the afternoon of check-in to the morning of check-out.
                      const from = Math.max(0, diffDays(start, stay.checkIn) + 0.5);
                      const to = Math.min(DAYS, diffDays(start, stay.checkOut) + 0.5);
                      if (to <= from) return null;
                      const source = m.common.sources[stay.source];
                      const range = t.grid.range(fmt.date(stay.checkIn), fmt.date(stay.checkOut));
                      const label =
                        stay.kind === "block"
                          ? stay.notes ||
                            (stay.source === "booking" ? t.grid.closedOnBooking : t.grid.blocked)
                          : stay.guestName || source;
                      const conflict = conflicts.has(stay.id);
                      return (
                        <Link
                          key={stay.id}
                          href={href({ r: String(stay.id) })}
                          prefetch={false}
                          aria-label={`${label}, ${source}, ${range}${conflict ? `, ${t.grid.doubleBooking}` : ""}`}
                          title={`${label} · ${range} · ${source}`}
                          style={{ left: NAME_COL + from * CELL + 1, width: (to - from) * CELL - 2 }}
                          className={cn(
                            "absolute top-2.5 z-10 flex h-9 items-center gap-1.5 overflow-hidden rounded-[5px] border-l-[3px] px-2 text-xs font-medium text-ink",
                            BAR[stay.kind === "block" ? "block" : stay.source],
                            conflict && "ring-2 ring-critical",
                            selected?.id === stay.id && "ring-2 ring-ink",
                          )}
                        >
                          {conflict && <span aria-hidden>⚠</span>}
                          <span className="truncate">{label}</span>
                        </Link>
                      );
                    })}
                </div>
              ))}
            </div>
          </Card>
        )}

        {selected && (
          <StayPanel
            stay={selected}
            property={properties.find((p) => p.id === selected.propertyId)!}
            conflict={conflicts.has(selected.id)}
            closeHref={closeHref}
          />
        )}
        {creating && (
          <NewStayPanel
            properties={properties}
            propertyId={Number(newProperty) || properties[0].id}
            date={isISODate(newDate) ? newDate : now}
            closeHref={closeHref}
          />
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {(["airbnb", "booking", "direct"] as const).map((source) => (
          <li key={source} className="flex items-center gap-1.5">
            <span className={cn("h-3 w-3.5 rounded-[3px] border-l-[3px]", BAR[source])} aria-hidden />
            {m.common.sources[source]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className={cn("h-3 w-3.5 rounded-[3px] border-l-[3px]", BAR.block)} aria-hidden />
          {t.legend.blocked}
        </li>
        <li className="flex items-center gap-1">
          <Kbd>←</Kbd> <Kbd>→</Kbd> {t.legend.move}, <Kbd>T</Kbd> {t.legend.today}, <Kbd>N</Kbd>{" "}
          {t.legend.new}
        </li>
      </ul>
    </>
  );
}
