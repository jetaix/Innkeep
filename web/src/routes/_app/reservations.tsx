import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { lazy, Suspense } from "react";
import {
  isListView,
  LISTS,
  type ListView,
  reservationCounts,
  reservationMonths,
} from "@/features/reservations/months";
import { reservationsOverview, type StaysTotal } from "@/features/reservations/overview";
import { addMonths, formatMonth, monthOf, monthStart, stayValue } from "@/features/revenue/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { addDays, diffDays, today } from "@/lib/dates";
import { chargesQuery, propertiesQuery, staysQuery } from "../../api/queries";
import { CountChart } from "../../features/reservations/count-chart";
import { StayList } from "../../features/reservations/stay-list";
import { loadMessages, useI18n } from "../../i18n";
import { color, font, radius, shadow, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Badge, Card, EmptyState, Hidden, Kbd, PageHeader, SectionTitle } from "../../ui/primitives";
import { figureStyle } from "../../ui/slab";

// The panel of an open reservation is the calendar's own; its code is fetched on the first click.
const StayPanel = lazy(() =>
  import("../../features/calendar/panels").then((file) => ({ default: file.StayPanel })),
);

/** A year back and everything ahead: the lists, the totals and the months are all cut from it. */
const stays = () => staysQuery({ from: addDays(today(), -365) });

export const Route = createFileRoute("/_app/reservations")({
  validateSearch: (search: Record<string, unknown>): { view?: ListView; r?: number } => ({
    view: isListView(search.view) && search.view !== "list" ? search.view : undefined,
    // The reservation open in the panel.
    r: Number.isInteger(Number(search.r)) && Number(search.r) > 0 ? Number(search.r) : undefined,
  }),
  // Started while this route's code downloads; the components read the same queries.
  loader: ({ context: { queryClient } }) => {
    void loadMessages("reservations");
    // The words of the panel a reservation opens in.
    void loadMessages("calendar");
    return Promise.all([
      queryClient.ensureQueryData(stays()),
      queryClient.ensureQueryData(propertiesQuery),
      queryClient.ensureQueryData(chargesQuery),
    ]);
  },
  component: ReservationsPage,
});

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "56rem" },
  key: {
    borderColor: `color-mix(in oklab, ${color.inverse} 30%, transparent)`,
    backgroundColor: "transparent",
    color: `color-mix(in oklab, ${color.inverse} 80%, transparent)`,
  },
  refresh: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  note: { margin: 0, paddingInline: "0.25rem", color: color.muted, fontSize: text.sm },
  small: { color: color.muted, fontSize: text.sm },
  title: { marginBottom: "0.5rem", paddingInline: "0.25rem" },
  inset: { paddingInline: "0.25rem" },
  two: { display: "grid", gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" }, gap: "1rem" },
  // A choice of one: a track, with the chosen list lifted off it.
  views: {
    display: "flex",
    alignSelf: "flex-start",
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
  section: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  // The headings of the ledger are in the display face: a period, then its stays.
  period: {
    fontFamily: font.display,
    fontSize: "1.375rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
  },
  groupHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: "1rem",
    rowGap: "0.125rem",
    marginBottom: "0.625rem",
    paddingInline: "0.25rem",
  },
  figures: { margin: 0, color: color.muted, fontSize: text.sm, fontVariantNumeric: "tabular-nums" },
  month: { display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.875rem 1rem 1rem" },
  between: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: "1rem",
    rowGap: "0.25rem",
  },
  monthName: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.375rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.2,
    "::first-letter": { textTransform: "uppercase" },
  },
  booked: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
  },
  meter: { height: "0.5rem", overflow: "hidden", borderRadius: radius.full, backgroundColor: color.sunken },
  fill: { height: "100%", borderRadius: radius.full, backgroundColor: color.ink },
  width: (ratio: number) => ({ width: `${ratio * 100}%` }),
  under: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  none: { margin: 0, padding: "0.75rem 1rem", color: color.muted },
  // The totals
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  headTitle: { margin: 0, fontSize: text.md, fontWeight: 500 },
  totals: { margin: 0 },
  line: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.625rem 1rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  term: { color: color.muted },
  value: { margin: 0, textAlign: "end", fontVariantNumeric: "tabular-nums" },
  strong: { fontWeight: 500 },
  below: { display: "block", color: color.muted, fontSize: text.sm },
  muted: { color: color.muted },
  link: { color: color.ink, textUnderlineOffset: 2 },
  net: { fontWeight: 500 },
  netLine: { alignItems: "center", paddingBlock: "0.75rem 0.875rem" },
  netValue: { fontSize: "1.625rem" },
  loss: { color: color.critical },
  // An open reservation: a sheet on the right edge, over a dimmed page.
  dim: {
    position: "fixed",
    inset: 0,
    zIndex: 40,
    backgroundColor: "rgb(13 15 19 / 0.45)",
  },
  drawer: {
    position: "fixed",
    insetBlock: 0,
    right: 0,
    zIndex: 50,
    width: "100%",
    maxWidth: "24rem",
    padding: { default: "0.5rem", [WIDE]: "0.75rem" },
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
  sheet: { width: "100%", minHeight: "100%", boxShadow: shadow.panel },
  onward: { marginTop: "1rem" },
});

function ReservationsPage() {
  const t = useI18n("reservations").m.reservations;
  return (
    <>
      <PageHeader title={t.title} description={t.description}>
        <Link
          to="/calendar"
          search={{ new: "1" }}
          data-shortcut="n"
          {...stylex.props(buttonStyle({ variant: "primary" }))}
        >
          {t.addBooking} <Kbd xstyle={styles.key}>N</Kbd>
        </Link>
      </PageHeader>
      <Reservations />
    </>
  );
}

function Reservations() {
  const { m, fmt, locale } = useI18n("reservations");
  const t = m.reservations;
  const { view = "list", r } = Route.useSearch();
  const { data } = useSuspenseQuery(stays());
  const { properties } = useSuspenseQuery(propertiesQuery).data;
  const { costs: charges } = useSuspenseQuery(chargesQuery).data;

  const now = today();
  const conflicts = new Set(data.conflicts);
  const ahead = data.stays.filter((stay) => stay.checkOut > now);
  const guests = ahead.filter((stay) => stay.kind === "reservation");
  // Finished stays, most recent first. Calendar links drop them; the extension brings them in.
  const past = data.stays.filter((stay) => stay.kind === "reservation" && stay.checkOut <= now).reverse();

  if (guests.length === 0 && past.length === 0) {
    return <EmptyState title={t.empty.title}>{t.empty.body}</EmptyState>;
  }

  const weekEnd = addDays(now, 7);
  const groups = [
    { id: "now", title: t.groups.now, stays: guests.filter((stay) => stay.checkIn < now) },
    {
      id: "week",
      title: t.groups.week,
      stays: guests.filter((stay) => stay.checkIn >= now && stay.checkIn < weekEnd),
    },
    { id: "later", title: t.groups.later, stays: guests.filter((stay) => stay.checkIn >= weekEnd) },
    { id: "past", title: t.groups.past, stays: past },
  ].filter((group) => group.stays.length > 0);

  const currency = properties[0]?.currency ?? "EUR";
  // Twelve months back, to the first of the month, and everything still ahead.
  const yearStart = monthStart(addMonths(monthOf(now), -11));
  const yearOfStays = data.stays.filter((stay) => stay.checkOut > yearStart);
  const overview = reservationsOverview({ today: now, stays: yearOfStays, charges, properties });
  const months = reservationMonths({ today: now, stays: yearOfStays, properties });
  const counts = reservationCounts({ today: now, stays: data.stays });
  // Any stay on the page can be opened: the year behind, and everything ahead.
  const selected = r ? data.stays.find((stay) => stay.id === r && stay.kind === "reservation") : undefined;
  const selectedProperty = selected && properties.find((place) => place.id === selected.propertyId);
  const close = { to: "/reservations", search: { view: view === "list" ? undefined : view } } as const;
  const monthSections = [
    { id: "months-upcoming", title: t.months.upcoming, rows: months.upcoming },
    { id: "months-past", title: t.months.past, rows: months.past },
  ].filter((section) => section.rows.length > 0);

  return (
    <div {...stylex.props(styles.page)}>
      {data.links.length > 0 && (
        /*
         * One-click refresh of guest names, payouts and past stays. Each button opens the host's
         * own reservations page on the platform in a new tab; the Innkeep Companion extension
         * reads it, sends the details here and closes the tab again. Deliberately not
         * `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
         */
        <div role="group" aria-label={t.refresh.label} {...stylex.props(styles.refresh)}>
          <span {...stylex.props(styles.small)}>{t.refresh.from}</span>
          {data.links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener"
              title={t.refresh.hint}
              {...stylex.props(buttonStyle({ size: "sm" }))}
            >
              {m.common.sources[link.channel]}
              <ExternalLink aria-hidden size={14} />
              <Hidden>{m.common.actions.newTab}</Hidden>
            </a>
          ))}
        </div>
      )}
      <section aria-labelledby="overview-heading">
        <SectionTitle id="overview-heading" xstyle={styles.title}>
          {t.overview.title}
        </SectionTitle>
        <div {...stylex.props(styles.two)}>
          <Totals
            title={t.overview.past}
            totals={overview.past}
            currency={currency}
            hasCosts={charges.length > 0}
          />
          <Totals
            title={t.overview.upcoming}
            totals={overview.upcoming}
            currency={currency}
            hasCosts={charges.length > 0}
            potential
          />
        </div>
      </section>
      <Card>
        <div {...stylex.props(styles.head)}>
          <div>
            <SectionTitle>{t.chart.title}</SectionTitle>
            <p {...stylex.props(styles.small)}>{t.chart.hint}</p>
          </div>
        </div>
        <CountChart counts={counts} current={monthOf(now)} />
      </Card>
      <nav aria-label={t.view.label} {...stylex.props(styles.views)}>
        {LISTS.map((option) => (
          <Link
            key={option}
            to="/reservations"
            search={{ view: option === "list" ? undefined : option }}
            aria-current={option === view ? "page" : undefined}
            {...stylex.props(styles.view, option === view && styles.chosen)}
          >
            {t.view[option]}
          </Link>
        ))}
      </nav>
      {view === "months" &&
        monthSections.map((section) => (
          <section key={section.id} aria-labelledby={section.id} {...stylex.props(styles.section)}>
            <SectionTitle id={section.id} xstyle={styles.inset}>
              {section.title}
            </SectionTitle>
            {section.rows.map((row) => {
              const name = formatMonth(row.month, "long", INTL_LOCALE[locale]);
              const full = row.availableNights > 0 && row.nights >= row.availableNights;
              return (
                <Card key={row.month}>
                  <div {...stylex.props(styles.month)}>
                    <div {...stylex.props(styles.between)}>
                      <h3 {...stylex.props(styles.monthName)}>{name}</h3>
                      <p {...stylex.props(styles.figures)}>
                        {m.common.count.stays(row.stays.length)},{" "}
                        {row.estimated > 0 && <span title={t.row.estimated}>≈ </span>}
                        {fmt.money(row.revenue, currency, { cents: false })}
                      </p>
                    </div>
                    <div {...stylex.props(styles.between)}>
                      <p {...stylex.props(styles.booked)}>
                        {t.months.booked(fmt.percent(row.occupancy))}
                        {full && <Badge tone="good">{t.months.full}</Badge>}
                      </p>
                      <p {...stylex.props(styles.figures)}>
                        {t.months.nights(row.nights, row.availableNights)}
                      </p>
                    </div>
                    <div
                      role="meter"
                      aria-label={`${t.months.occupancy}, ${name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(row.occupancy * 100)}
                      {...stylex.props(styles.meter)}
                    >
                      <div {...stylex.props(styles.fill, styles.width(row.occupancy))} />
                    </div>
                  </div>
                  {row.stays.length > 0 ? (
                    <div {...stylex.props(styles.under)}>
                      <StayList
                        stays={row.stays}
                        properties={properties}
                        conflicts={conflicts}
                        today={now}
                        panel={{ view }}
                        selectedId={selected?.id}
                      />
                    </div>
                  ) : (
                    <p {...stylex.props(styles.none, styles.under)}>{t.months.none}</p>
                  )}
                </Card>
              );
            })}
          </section>
        ))}
      {view === "list" &&
        groups.map((group) => {
          const total = group.stays.reduce((sum, stay) => sum + stayValue(stay, properties).total, 0);
          const nights = group.stays.reduce((sum, stay) => sum + diffDays(stay.checkIn, stay.checkOut), 0);
          return (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div {...stylex.props(styles.groupHead)}>
                <SectionTitle id={`group-${group.id}`} xstyle={styles.period}>
                  {group.title}
                </SectionTitle>
                <p {...stylex.props(styles.figures)}>
                  {m.common.count.stays(group.stays.length)}, {m.common.count.nights(nights)},{" "}
                  {fmt.money(total, currency, { cents: false })}
                </p>
              </div>
              <Card>
                <StayList
                  stays={group.stays}
                  properties={properties}
                  conflicts={conflicts}
                  today={now}
                  panel={{ view }}
                  selectedId={selected?.id}
                />
              </Card>
            </section>
          );
        })}
      <p {...stylex.props(styles.note)}>{t.estimateNote}</p>
      {selected && selectedProperty && (
        <>
          {/* A click beside the panel closes it. Escape and the panel's own button do too. */}
          <Link
            {...close}
            resetScroll={false}
            aria-label={t.details.close}
            tabIndex={-1}
            {...stylex.props(styles.dim)}
          />
          <div {...stylex.props(styles.drawer)}>
            <Suspense fallback={null}>
              <StayPanel
                stay={selected}
                property={selectedProperty}
                conflict={conflicts.has(selected.id)}
                close={close}
                xstyle={styles.sheet}
                more={
                  <Link
                    to="/calendar"
                    search={{ view: "weeks", start: addDays(selected.checkIn, -3), r: selected.id }}
                    {...stylex.props(buttonStyle({ size: "sm" }), styles.onward)}
                  >
                    {t.details.calendar}
                  </Link>
                }
              />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}

/** One side of the overview: the stays of a period, what they bring, what they cost and what is left. */
function Totals({
  title,
  totals,
  currency,
  hasCosts,
  potential = false,
}: {
  title: string;
  totals: StaysTotal;
  currency: string;
  hasCosts: boolean;
  potential?: boolean;
}) {
  const { m, fmt } = useI18n("reservations");
  const t = m.reservations.overview;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });

  return (
    <Card>
      <div {...stylex.props(styles.head)}>
        <h3 {...stylex.props(styles.headTitle)}>{title}</h3>
        {totals.profitable !== null && (
          <Badge tone={totals.profitable ? "good" : "critical"}>
            {totals.profitable ? t.profitable : t.loss}
          </Badge>
        )}
      </div>
      <dl {...stylex.props(styles.totals)}>
        <div {...stylex.props(styles.line)}>
          <dt {...stylex.props(styles.term)}>{t.stays}</dt>
          <dd {...stylex.props(styles.value)}>
            <span {...stylex.props(styles.strong)}>{totals.stays}</span>
            <span {...stylex.props(styles.below)}>{m.common.count.nights(totals.nights)}</span>
          </dd>
        </div>
        <div {...stylex.props(styles.line)}>
          <dt {...stylex.props(styles.term)}>{potential ? t.potential : t.revenue}</dt>
          <dd {...stylex.props(styles.value)}>
            <span {...stylex.props(styles.strong)}>{money(totals.revenue)}</span>
            {totals.estimated > 0 && (
              <span {...stylex.props(styles.below)}>{t.estimated(money(totals.estimated))}</span>
            )}
          </dd>
        </div>
        <div {...stylex.props(styles.line)}>
          <dt {...stylex.props(styles.term)}>{t.fees}</dt>
          <dd {...stylex.props(styles.value)}>
            {totals.platformFees > 0 ? (
              <>
                <span {...stylex.props(styles.strong)}>{money(totals.platformFees)}</span>
                <span {...stylex.props(styles.below)}>{t.feesNote}</span>
              </>
            ) : (
              <span {...stylex.props(styles.muted)}>{t.feesUnknown}</span>
            )}
          </dd>
        </div>
        <div {...stylex.props(styles.line)}>
          <dt {...stylex.props(styles.term)}>{t.costs}</dt>
          <dd {...stylex.props(styles.value)}>
            {hasCosts ? (
              <span {...stylex.props(styles.strong)}>{money(totals.costs)}</span>
            ) : (
              <span {...stylex.props(styles.muted)}>
                {t.noCosts}{" "}
                <Link to="/revenue" {...stylex.props(styles.link)}>
                  {t.addCosts}
                </Link>
              </span>
            )}
          </dd>
        </div>
        <div {...stylex.props(styles.line, styles.netLine)}>
          <dt {...stylex.props(styles.net)}>{t.net}</dt>
          <dd {...stylex.props(styles.value, figureStyle, styles.netValue, totals.net < 0 && styles.loss)}>
            {money(totals.net)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
