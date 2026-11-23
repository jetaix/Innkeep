import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/actions";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { getSuggestions } from "@/features/insights/queries";
import { SuggestionList } from "@/features/insights/suggestion-list";
import { loadDemoData } from "@/features/properties/actions";
import { findConflicts, getProperties, getStays } from "@/features/reservations/queries";
import { StayList } from "@/features/reservations/stay-list";
import { occupancyAhead, type Month } from "@/features/revenue/compute";
import { getRevenue } from "@/features/revenue/queries";
import { getI18n } from "@/i18n/server";
import { addDays, today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.overview.title };
}

export default function OverviewPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  await connection();
  const properties = await getProperties();
  if (properties.length === 0) return <Welcome />;
  const { locale, m, fmt } = await getI18n();
  const t = m.overview;

  const now = today();
  // Asking from yesterday keeps the stays that end today, for the departures line.
  const recent = await getStays(addDays(now, -1));
  const stays = recent.filter((stay) => stay.checkOut > now);
  const conflicts = findConflicts(stays);
  const guests = stays.filter((stay) => stay.kind === "reservation");
  const arriving = guests.filter((stay) => stay.checkIn === now);
  const departures = recent.filter((stay) => stay.kind === "reservation" && stay.checkOut === now);
  const inHouse = guests.filter((stay) => stay.checkIn < now);

  const revenue = await getRevenue({ monthsBack: 0, monthsAhead: 1 });
  const [thisMonth, nextMonth] = revenue.summaries;
  const occupancy =
    properties.reduce((sum, property) => sum + occupancyAhead(property.id, guests, now, 30), 0) /
    properties.length;
  const { active: suggestions } = await getSuggestions(locale);

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

      <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        <Stat
          label={t.stats.netRevenue(monthName(thisMonth.month))}
          value={money(thisMonth.net)}
          detail={t.stats.beforeCosts(money(thisMonth.gross), money(thisMonth.charges))}
          href="/revenue"
        />
        <Stat
          label={t.stats.netRevenue(monthName(nextMonth.month))}
          value={money(nextMonth.net)}
          detail={t.stats.arrivalsBooked(nextMonth.arrivals)}
          href="/revenue"
        />
        <Stat
          label={t.stats.booked}
          value={fmt.percent(occupancy)}
          detail={t.stats.acrossProperties(properties.length)}
          href="/calendar"
        />
        <Stat
          label={t.stats.needsAttention}
          value={String(suggestions.filter((s) => s.severity !== "idea").length)}
          detail={t.stats.moreIdeas(suggestions.filter((s) => s.severity === "idea").length)}
          href="/suggestions"
        />
      </dl>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <SectionTitle>{t.reservations.title}</SectionTitle>
            <Link
              href="/reservations"
              className="text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              {t.reservations.all}
            </Link>
          </div>
          {guests.length > 0 ? (
            <StayList stays={guests.slice(0, 6)} properties={properties} conflicts={conflicts} today={now} />
          ) : (
            <p className="px-4 py-6 text-muted">{t.reservations.empty}</p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <SectionTitle>{t.suggestions.title}</SectionTitle>
            <Link
              href="/suggestions"
              className="text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              {t.suggestions.all(suggestions.length)}
            </Link>
          </div>
          {suggestions.length > 0 ? (
            <SuggestionList suggestions={suggestions.slice(0, 4)} compact />
          ) : (
            <p className="px-4 py-6 text-muted">{t.suggestions.empty}</p>
          )}
        </Card>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} className="block bg-bg px-4 py-3.5 transition-colors hover:bg-subtle">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
      <dd className="mt-0.5 text-xs text-muted">{detail}</dd>
    </Link>
  );
}

async function Welcome() {
  const { m } = await getI18n();
  const t = m.overview.welcome;
  return (
    <div className="mx-auto mt-16 max-w-xl">
      <EmptyState
        title={t.title}
        action={
          <>
            <Link href="/properties" className={buttonClass({ variant: "primary" })}>
              {t.addProperty}
            </Link>
            <form action={loadDemoData}>
              <SubmitButton pendingLabel={m.common.loading}>{t.loadSample}</SubmitButton>
            </form>
          </>
        }
      >
        {t.body}
      </EmptyState>
    </div>
  );
}
