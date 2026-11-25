import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import type { Reservation } from "@/db/schema";
import { type Month, occupancyAhead } from "@/features/revenue/compute";
import { addDays, rangesOverlap, today } from "@/lib/dates";
import { loadSampleData } from "../../api/mutations";
import { propertiesQuery, revenueQuery, staysQuery, suggestionsQuery } from "../../api/queries";
import { SuggestionList } from "../../features/insights/suggestion-list";
import { StayList } from "../../features/reservations/stay-list";
import { currentLocale, loadMessages, useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Card, EmptyState, Loading, Notice, PageHeader, SectionTitle } from "../../ui/primitives";

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

const styles = stylex.create({
  stats: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", [LARGE]: "repeat(4, minmax(0, 1fr))" },
    gap: 1,
    margin: "0 0 1.5rem",
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.lg,
    backgroundColor: color.line,
  },
  stat: {
    display: "block",
    padding: "0.875rem 1rem",
    backgroundColor: { default: color.bg, ":hover": color.subtle },
    color: color.ink,
    textDecoration: "none",
    transitionProperty: "background-color",
    transitionDuration: "150ms",
  },
  label: { color: color.muted, fontSize: text.sm },
  value: {
    margin: "0.25rem 0 0",
    fontSize: "1.5rem",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    lineHeight: 1.333,
    fontVariantNumeric: "tabular-nums",
  },
  detail: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
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
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  all: {
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
  none: { margin: 0, padding: "1.5rem 1rem", color: color.muted },
  welcome: { maxWidth: "36rem", marginTop: "4rem", marginInline: "auto" },
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
      <PageHeader
        title={t.title}
        description={t.today.description(
          fmt.date(now, { weekday: "long", day: "numeric", month: "long" }),
          todayLine,
        )}
      />

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
      <dd {...stylex.props(styles.value)}>{value}</dd>
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
      <EmptyState
        title={t.title}
        action={
          <>
            <Link to="/properties" {...stylex.props(buttonStyle({ variant: "primary" }))}>
              {t.addProperty}
            </Link>
            <form
              {...stylex.props(styles.form)}
              onSubmit={(event) => {
                event.preventDefault();
                load.mutate();
              }}
            >
              <SubmitButton pending={load.isPending} pendingLabel={m.common.loading}>
                {t.loadSample}
              </SubmitButton>
            </form>
          </>
        }
      >
        {t.body}
        {load.error && (
          <Notice tone="critical" role="alert" xstyle={styles.failed}>
            {load.error.message}
          </Notice>
        )}
      </EmptyState>
    </div>
  );
}
