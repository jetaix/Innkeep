import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type FormEvent, lazy, Suspense, useEffect } from "react";
import { isView, VIEWS, type View } from "@/features/calendar/compute";
import { addDays, type ISODate, isISODate, today } from "@/lib/dates";
import { sync } from "../../api/mutations";
import { feedsQuery, propertiesQuery, staysQuery } from "../../api/queries";
import { bars } from "../../features/calendar/bars";
import { MonthGrid, WeeksGrid, YearGrid } from "../../features/calendar/grids";
import { period, step } from "../../features/calendar/period";
import { loadMessages, useI18n } from "../../i18n";
import { color, radius, shadow, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Badge, EmptyState, Kbd, Notice, PageHeader } from "../../ui/primitives";

export type CalendarSearch = {
  view?: View;
  /** First day shown. */
  start?: string;
  /** The stay that is open. */
  r?: number;
  /** Opens the form that adds a booking or blocks dates: "1", or "<property>:<date>" to start from a cell. */
  new?: string;
};

// The side panels are only needed after a click: their code is fetched apart, so the grid shows first.
const loadPanels = () => import("../../features/calendar/panels");
const StayPanel = lazy(() => loadPanels().then((file) => ({ default: file.StayPanel })));
const NewStayPanel = lazy(() => loadPanels().then((file) => ({ default: file.NewStayPanel })));

/**
 * Fetches the panels' code as soon as a pointer, the keyboard or a finger
 * reaches a link that opens one, so the panel is there by the time the click lands.
 */
function useWarmPanels() {
  useEffect(() => {
    const warm = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || !/[?&](r|new)=/.test(link.search)) return;
      void loadPanels();
      for (const type of INTENT) document.removeEventListener(type, warm, true);
    };
    for (const type of INTENT) document.addEventListener(type, warm, { capture: true, passive: true });
    return () => {
      for (const type of INTENT) document.removeEventListener(type, warm, true);
    };
  }, []);
}
const INTENT = ["pointerover", "focusin", "touchstart"] as const;

/** The stays on screen, from the eve of the first day so a departure that morning is drawn. */
const staysOf = (start: ISODate, end: ISODate) => staysQuery({ from: addDays(start, -1), to: end });

export const Route = createFileRoute("/_app/calendar")({
  validateSearch: (search: Record<string, unknown>): CalendarSearch => ({
    view: isView(search.view) ? search.view : undefined,
    start: isISODate(search.start) ? search.start : undefined,
    r: Number.isInteger(Number(search.r)) && Number(search.r) > 0 ? Number(search.r) : undefined,
    new: search.new === undefined ? undefined : String(search.new),
  }),
  // Opening or closing a panel reads nothing new; only the period does.
  loaderDeps: ({ search }) => ({ view: search.view, start: search.start }),
  // Started while this route's code downloads; the components read the same queries.
  loader: ({ context: { queryClient }, deps, location }) => {
    void loadMessages("calendar");
    // The address already asks for a panel: fetch its code beside the data.
    const asked = location.search as CalendarSearch;
    if (asked.r || asked.new) void loadPanels();
    const { start, end } = period(deps.view ?? "month", deps.start, today());
    return Promise.all([
      queryClient.ensureQueryData(propertiesQuery),
      queryClient.ensureQueryData(staysOf(start, end)),
      queryClient.ensureQueryData(feedsQuery),
    ]);
  },
  component: Calendar,
});

const styles = stylex.create({
  failing: { color: color.critical, fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 2 },
  group: { display: "flex" },
  // The three share one outline: each ring is a pixel outside its box, so a pixel apart they meet.
  first: { borderStartEndRadius: 0, borderEndEndRadius: 0 },
  middle: { marginInlineStart: 1, borderRadius: 0 },
  last: { marginInlineStart: 1, borderStartStartRadius: 0, borderEndStartRadius: 0 },
  // The views are a choice of one: a track, with the chosen view lifted off it.
  views: {
    display: "flex",
    alignItems: "stretch",
    minHeight: "2.125rem",
    padding: 2,
    borderRadius: radius.full,
    backgroundColor: color.sunken,
  },
  view: {
    display: "flex",
    alignItems: "center",
    paddingInline: "0.875rem",
    borderRadius: radius.full,
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "background-color, box-shadow, color",
    transitionDuration: "200ms",
  },
  chosen: { backgroundColor: color.panel, boxShadow: shadow.card, color: color.ink },
  arrow: { paddingInline: "0.5rem" },
  key: {
    borderColor: `color-mix(in oklab, ${color.inverse} 30%, transparent)`,
    backgroundColor: "transparent",
    color: `color-mix(in oklab, ${color.inverse} 80%, transparent)`,
  },
  notice: { marginBottom: "1rem" },
  strong: { fontWeight: 600 },
  body: {
    display: "flex",
    flexDirection: { default: "column", "@media (min-width: 80rem)": "row" },
    alignItems: { default: "stretch", "@media (min-width: 80rem)": "flex-start" },
    gap: "1.25rem",
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "1.25rem",
    rowGap: "0.5rem",
    margin: "1rem 0 0",
    padding: 0,
    listStyle: "none",
    color: color.muted,
    fontSize: text.sm,
  },
  entry: { display: "flex", alignItems: "center", gap: "0.375rem" },
  keys: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.25rem" },
  // A small slab of the same glass as the grid's.
  swatch: { width: "1.5rem", height: "0.875rem", borderRadius: 5 },
  keysEnd: { marginInlineStart: { default: 0, "@media (min-width: 64rem)": "auto" } },
});

function Calendar() {
  const { m, fmt } = useI18n("calendar");
  const t = m.calendar;
  const params = Route.useSearch();
  useWarmPanels();
  const now = today();
  const view: View = params.view ?? "month";
  const { start, end } = period(view, params.start, now);

  const { properties } = useSuspenseQuery(propertiesQuery).data;
  const { data } = useSuspenseQuery(staysOf(start, end));
  const feeds = useSuspenseQuery(feedsQuery).data;
  const syncAll = useMutation(sync);

  if (properties.length === 0) {
    return (
      <EmptyState
        title={t.empty.title}
        action={
          <Link to="/properties" {...stylex.props(buttonStyle({ variant: "primary" }))}>
            {t.empty.addProperty}
          </Link>
        }
      >
        {t.empty.body}
      </EmptyState>
    );
  }

  const stays = data.stays;
  const conflicts = new Set(data.conflicts);

  const search = (
    extra: Pick<CalendarSearch, "r" | "new"> = {},
    from: ISODate = start,
    as: View = view,
  ): CalendarSearch => ({ view: as === "month" ? undefined : as, start: from, ...extra });
  const close = search();

  const selected = params.r ? stays.find((stay) => stay.id === params.r) : undefined;
  const creating = typeof params.new === "string" && !selected;
  const [newProperty, newDate] = typeof params.new === "string" ? params.new.split(":") : [];

  function syncNow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    syncAll.mutate(false);
  }

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
            {feeds.count === 0
              ? t.header.noCalendars
              : feeds.lastSync
                ? t.header.synced(fmt.timeAgo(feeds.lastSync))
                : t.header.notSynced}
            {feeds.failing > 0 && (
              <>
                {" "}
                <Link to="/suggestions" {...stylex.props(styles.failing)}>
                  {t.header.failing(feeds.failing)}
                </Link>
              </>
            )}
          </>
        }
      >
        <nav aria-label={t.header.view} {...stylex.props(styles.views)}>
          {VIEWS.map((option) => (
            <Link
              key={option}
              to="/calendar"
              // Keep looking at the same time: the month or year of the day the current view starts on.
              search={search({}, view === "weeks" ? addDays(start, 3) : start, option)}
              aria-current={option === view ? "page" : undefined}
              {...stylex.props(styles.view, option === view && styles.chosen)}
            >
              {t.header.views[option]}
            </Link>
          ))}
        </nav>
        <div {...stylex.props(styles.group)}>
          <Link
            to="/calendar"
            search={search({}, step(view, start, -1))}
            data-shortcut="ArrowLeft"
            aria-label={t.header.previous[view]}
            title={t.header.withKey(t.header.previous[view], "←")}
            {...stylex.props(buttonStyle(), styles.first, styles.arrow)}
          >
            <ChevronLeft aria-hidden size={16} />
          </Link>
          <Link
            to="/calendar"
            search={{ view: view === "month" ? undefined : view }}
            data-shortcut="t"
            title={t.header.withKey(t.header.today, "T")}
            {...stylex.props(buttonStyle(), styles.middle)}
          >
            {t.header.today}
          </Link>
          <Link
            to="/calendar"
            search={search({}, step(view, start, 1))}
            data-shortcut="ArrowRight"
            aria-label={t.header.next[view]}
            title={t.header.withKey(t.header.next[view], "→")}
            {...stylex.props(buttonStyle(), styles.last, styles.arrow)}
          >
            <ChevronRight aria-hidden size={16} />
          </Link>
        </div>
        <form onSubmit={syncNow}>
          <SubmitButton pending={syncAll.isPending} pendingLabel={t.header.syncing}>
            {t.header.syncNow}
          </SubmitButton>
        </form>
        <Link
          to="/calendar"
          search={search({ new: `${properties[0].id}:${now}` })}
          data-shortcut="n"
          {...stylex.props(buttonStyle({ variant: "primary" }))}
        >
          {t.header.add} <Kbd xstyle={styles.key}>N</Kbd>
        </Link>
      </PageHeader>

      {syncAll.error && (
        <Notice tone="critical" role="alert" xstyle={styles.notice}>
          {syncAll.error.message}
        </Notice>
      )}
      {conflicts.size > 0 && (
        <Notice tone="clash" role="alert" xstyle={styles.notice}>
          <strong {...stylex.props(styles.strong)}>{t.conflict.title}</strong>{" "}
          {t.conflict.body(conflicts.size)}
        </Notice>
      )}

      <div {...stylex.props(styles.body)}>
        {view === "month" && (
          <MonthGrid
            month={start}
            properties={properties}
            stays={stays}
            conflicts={conflicts}
            today={now}
            selectedId={selected?.id}
            search={search}
          />
        )}
        {view === "year" && (
          <YearGrid year={start} properties={properties} stays={stays} conflicts={conflicts} today={now} />
        )}
        {view === "weeks" && (
          <WeeksGrid
            start={start}
            properties={properties}
            stays={stays}
            conflicts={conflicts}
            today={now}
            selectedId={selected?.id}
            search={search}
          />
        )}

        <Suspense fallback={null}>
          {selected && (
            <StayPanel
              stay={selected}
              // A stay always belongs to a property that is listed.
              property={properties.find((p) => p.id === selected.propertyId) ?? properties[0]}
              conflict={conflicts.has(selected.id)}
              close={{ to: "/calendar", search: close }}
            />
          )}
          {creating && (
            <NewStayPanel
              properties={properties}
              propertyId={Number(newProperty) || properties[0].id}
              date={isISODate(newDate) ? newDate : now}
              close={{ to: "/calendar", search: close }}
            />
          )}
        </Suspense>
      </div>

      <ul {...stylex.props(styles.legend)}>
        {(["airbnb", "booking", "direct"] as const).map((source) => (
          <li key={source} {...stylex.props(styles.entry)}>
            <span aria-hidden {...stylex.props(styles.swatch, bars[source])} />
            {m.common.sources[source]}
          </li>
        ))}
        <li {...stylex.props(styles.entry)}>
          <span aria-hidden {...stylex.props(styles.swatch, bars.block)} />
          {t.legend.blocked}
        </li>
        <li {...stylex.props(styles.entry)}>
          <span aria-hidden {...stylex.props(styles.swatch, bars.clash)} />
          {conflicts.size > 0 ? <Badge tone="clash">{t.legend.clash}</Badge> : t.legend.clash}
        </li>
        <li {...stylex.props(styles.keys, styles.keysEnd)}>
          <Kbd>←</Kbd> <Kbd>→</Kbd> {t.legend.move}, <Kbd>T</Kbd> {t.legend.today}, <Kbd>N</Kbd>{" "}
          {t.legend.new}
        </li>
      </ul>
    </>
  );
}
