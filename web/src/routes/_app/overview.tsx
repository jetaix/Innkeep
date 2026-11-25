import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import type { Reservation } from "@/db/schema";
import { type Month, occupancyAhead } from "@/features/revenue/compute";
import { addDays, rangesOverlap, today } from "@/lib/dates";
import { loadSampleData } from "../../api/mutations";
import { propertiesQuery, revenueQuery, staysQuery, suggestionsQuery } from "../../api/queries";
import { Glass } from "../../brand/glass";
import { LogoMark } from "../../brand/logo";
import { SuggestionList } from "../../features/insights/suggestion-list";
import { Fortnight } from "../../features/overview/fortnight";
import { StayList } from "../../features/reservations/stay-list";
import { currentLocale, loadMessages, useI18n } from "../../i18n";
import { color, font, shadow, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Card, Loading, Notice, PageHeader, SectionTitle } from "../../ui/primitives";
import { figureStyle } from "../../ui/slab";

// Asking from yesterday keeps the stays that end today, for the departures line.
const recentStays = () => staysQuery({ from: addDays(today(), -1) });
const twoMonths = revenueQuery({ back: 0, ahead: 1 });

export const Route = createFileRoute("/_app/overview")({
  // Started while this route's code downloads; the components read the same queries.
  loader: ({ context: { queryClient } }) => {
    void loadMessages("overview", "reservations", "insights");
    return Promise.all([
      queryClient.ensureQueryData(propertiesQuery),
      queryClient.ensureQueryData(recentStays()),
      queryClient.ensureQueryData(twoMonths),
      queryClient.ensureQueryData(suggestionsQuery(currentLocale())),
    ]);
  },
  component: OverviewPage,
});

const LARGE = "@media (min-width: 64rem)";
const XLARGE = "@media (min-width: 80rem)";

const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  // The one panel the page lifts: today, the fortnight, and the four figures.
  lead: {
    marginBottom: "1.5rem",
    overflow: "hidden",
    borderRadius: { default: "1.25rem", [WIDE]: "1.75rem" },
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  today: {
    maxWidth: "46rem",
    margin: 0,
    padding: { default: "1.25rem 1rem 0.25rem", [WIDE]: "1.75rem 1.5rem 0.25rem" },
    fontFamily: font.display,
    fontSize: { default: "1.375rem", [WIDE]: "1.75rem" },
    fontWeight: 400,
    letterSpacing: "-0.025em",
    lineHeight: 1.2,
    textWrap: "balance",
  },
  // The hairlines between the figures are the grid's own background showing through its gaps.
  stats: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", [LARGE]: "repeat(4, minmax(0, 1fr))" },
    gap: 1,
    margin: 0,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    backgroundColor: color.line,
  },
  stat: {
    display: "block",
    padding: { default: "0.875rem 1rem 1rem", [WIDE]: "1rem 1.5rem 1.25rem" },
    backgroundColor: { default: color.panel, ":hover": color.subtle },
    color: color.ink,
    textDecoration: "none",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  label: { color: color.muted, fontSize: text.sm },
  value: { margin: "0.375rem 0 0", fontSize: { default: "1.625rem", [WIDE]: "2rem" } },
  detail: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.sm },
  columns: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [XLARGE]: "minmax(0, 1.4fr) minmax(0, 1fr)" },
    alignItems: "start",
    gap: "1.5rem",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.875rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  all: {
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    textDecorationLine: "underline",
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 3,
  },
  none: { margin: 0, padding: "1.5rem 1rem", color: color.muted },
  // The first run: a door to walk through, the two calendars as glass behind it.
  welcome: {
    position: "relative",
    isolation: "isolate",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "min(40rem, 78dvh)",
    paddingBlock: "2rem",
  },
  glass: {
    position: "absolute",
    zIndex: -1,
    top: "50%",
    left: "50%",
    width: { default: "20rem", [WIDE]: "34rem" },
    height: { default: "28rem", [WIDE]: "36rem" },
    translate: "-50% -50%",
  },
  archOne: { top: 0, left: 0, width: "60%", height: "86%", rotate: "-4deg" },
  archTwo: { bottom: 0, right: 0, width: "60%", height: "86%", rotate: "3deg" },
  door: {
    width: "100%",
    maxWidth: "30rem",
    padding: { default: "1.5rem", [WIDE]: "2.25rem" },
    borderRadius: "1.75rem",
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  mark: { width: "2.25rem", height: "2.25rem" },
  welcomeTitle: {
    margin: "0.875rem 0 0",
    fontFamily: font.display,
    fontSize: { default: "1.75rem", [WIDE]: "2.25rem" },
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    textWrap: "balance",
  },
  welcomeBody: { margin: "0.75rem 0 0", color: color.muted, fontSize: text.md, lineHeight: 1.6 },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" },
  form: { margin: 0 },
  failed: { marginTop: "0.75rem" },
});

function OverviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Overview />
    </Suspense>
  );
}

/** Ids of stays that share a night with another stay on the same property. */
function findConflicts(stays: Reservation[]): Set<number> {
  const conflicts = new Set<number>();
  for (const [index, a] of stays.entries()) {
    for (const b of stays.slice(index + 1)) {
      if (a.propertyId === b.propertyId && rangesOverlap(a, b)) conflicts.add(a.id).add(b.id);
    }
  }
  return conflicts;
}

function Overview() {
  const { locale, m, fmt } = useI18n("overview");
  const t = m.overview;
  const { properties } = useSuspenseQuery(propertiesQuery).data;
  const { stays: recent } = useSuspenseQuery(recentStays()).data;
  const revenue = useSuspenseQuery(twoMonths).data;
  const { active: suggestions } = useSuspenseQuery(suggestionsQuery(locale)).data;
  if (properties.length === 0) return <Welcome />;

  const now = today();
  const stays = recent.filter((stay) => stay.checkOut > now);
  const conflicts = findConflicts(stays);
  const guests = stays.filter((stay) => stay.kind === "reservation");
  const arriving = guests.filter((stay) => stay.checkIn === now);
  const departures = recent.filter((stay) => stay.kind === "reservation" && stay.checkOut === now);
  const inHouse = guests.filter((stay) => stay.checkIn < now);

  const [thisMonth, nextMonth] = revenue.summaries;
  const occupancy =
    properties.reduce((sum, property) => sum + occupancyAhead(property.id, guests, now, 30), 0) /
    properties.length;

  const names = (list: typeof guests) =>
    list.map((stay) => stay.guestName || properties.find((p) => p.id === stay.propertyId)?.name).join(", ");
  const todayLine = [
    arriving.length > 0 && t.today.arrive(names(arriving), arriving.length),
    departures.length > 0 && t.today.leave(names(departures), departures.length),
    inHouse.length > 0 && t.today.inProgress(inHouse.length),
  ].filter((part): part is string => Boolean(part));
  const money = (amount: number) => fmt.money(amount, revenue.currency, { cents: false });
  const monthName = (month: Month) => fmt.date(`${month}-01`, { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title={t.title} />

      <div {...stylex.props(styles.lead)}>
        <p {...stylex.props(styles.today)}>
          {t.today.description(fmt.date(now, { weekday: "long", day: "numeric", month: "long" }), todayLine)}
        </p>
        <Fortnight properties={properties} stays={stays} today={now} />
        <dl {...stylex.props(styles.stats)}>
          <Link to="/revenue" {...stylex.props(styles.stat)}>
            <Stat
              label={t.stats.netRevenue(monthName(thisMonth.month))}
              value={money(thisMonth.net)}
              detail={t.stats.beforeCosts(money(thisMonth.gross), money(thisMonth.charges))}
            />
          </Link>
          <Link to="/revenue" {...stylex.props(styles.stat)}>
            <Stat
              label={t.stats.netRevenue(monthName(nextMonth.month))}
              value={money(nextMonth.net)}
              detail={t.stats.arrivalsBooked(nextMonth.arrivals)}
            />
          </Link>
          <Link to="/calendar" {...stylex.props(styles.stat)}>
            <Stat
              label={t.stats.booked}
              value={fmt.percent(occupancy)}
              detail={t.stats.acrossProperties(properties.length)}
            />
          </Link>
          <Link to="/suggestions" {...stylex.props(styles.stat)}>
            <Stat
              label={t.stats.needsAttention}
              value={String(suggestions.filter((s) => s.severity !== "idea").length)}
              detail={t.stats.moreIdeas(suggestions.filter((s) => s.severity === "idea").length)}
            />
          </Link>
        </dl>
      </div>

      <div {...stylex.props(styles.columns)}>
        <Card>
          <div {...stylex.props(styles.head)}>
            <SectionTitle>{t.reservations.title}</SectionTitle>
            <Link to="/reservations" {...stylex.props(styles.all)}>
              {t.reservations.all}
            </Link>
          </div>
          {guests.length > 0 ? (
            <StayList stays={guests.slice(0, 6)} properties={properties} conflicts={conflicts} today={now} />
          ) : (
            <p {...stylex.props(styles.none)}>{t.reservations.empty}</p>
          )}
        </Card>

        <Card>
          <div {...stylex.props(styles.head)}>
            <SectionTitle>{t.suggestions.title}</SectionTitle>
            <Link to="/suggestions" {...stylex.props(styles.all)}>
              {t.suggestions.all(suggestions.length)}
            </Link>
          </div>
          {suggestions.length > 0 ? (
            <SuggestionList suggestions={suggestions.slice(0, 4)} compact />
          ) : (
            <p {...stylex.props(styles.none)}>{t.suggestions.empty}</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <>
      <dt {...stylex.props(styles.label)}>{label}</dt>
      <dd {...stylex.props(figureStyle, styles.value)}>{value}</dd>
      <dd {...stylex.props(styles.detail)}>{detail}</dd>
    </>
  );
}

function Welcome() {
  const { m } = useI18n("overview");
  const t = m.overview.welcome;
  const load = useMutation(loadSampleData);
  return (
    <div {...stylex.props(styles.welcome)}>
      <div aria-hidden {...stylex.props(styles.glass)}>
        <Glass tint="coral" xstyle={styles.archOne} />
        <Glass tint="blue" xstyle={styles.archTwo} />
      </div>
      <div {...stylex.props(styles.door)}>
        <LogoMark tone="color" xstyle={styles.mark} />
        <h1 {...stylex.props(styles.welcomeTitle)}>{t.title}</h1>
        <p {...stylex.props(styles.welcomeBody)}>{t.body}</p>
        <div {...stylex.props(styles.actions)}>
          <Link to="/properties" {...stylex.props(buttonStyle({ variant: "primary", size: "lg" }))}>
            {t.addProperty}
          </Link>
          <form
            {...stylex.props(styles.form)}
            onSubmit={(event) => {
              event.preventDefault();
              load.mutate();
            }}
          >
            <SubmitButton size="lg" pending={load.isPending} pendingLabel={m.common.loading}>
              {t.loadSample}
            </SubmitButton>
          </form>
        </div>
        {load.error && (
          <Notice tone="critical" role="alert" xstyle={styles.failed}>
            {load.error.message}
          </Notice>
        )}
      </div>
    </div>
  );
}
