import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui/button";
import { Badge, Card, EmptyState, Kbd, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { findConflicts, getProperties, getStays } from "@/features/reservations/queries";
import { DetailsRefresh } from "@/features/reservations/details-refresh";
import { StayList } from "@/features/reservations/stay-list";
import { reservationsOverview, type StaysTotal } from "@/features/reservations/overview";
import { addMonths, monthOf, monthStart, stayValue } from "@/features/revenue/compute";
import { getCharges } from "@/features/revenue/queries";
import { addDays, diffDays, today } from "@/lib/dates";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.reservations.title };
}

export default async function ReservationsPage() {
  const { m } = await getI18n();
  const t = m.reservations;
  return (
    <>
      <PageHeader title={t.title} description={t.description}>
        <Link href="/calendar?new=1" data-shortcut="n" className={buttonClass({ variant: "primary" })}>
          {t.addBooking} <Kbd className="border-inverse/30 bg-transparent text-inverse/80">N</Kbd>
        </Link>
      </PageHeader>
      <Suspense fallback={<Loading />}>
        <Reservations />
      </Suspense>
    </>
  );
}

async function Reservations() {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.reservations;
  const now = today();
  const properties = await getProperties();
  const stays = await getStays(now);
  const guests = stays.filter((stay) => stay.kind === "reservation");
  const conflicts = findConflicts(stays);
  // Finished stays, most recent first. Calendar links drop them; the extension brings them in.
  const past = (await getStays(addDays(now, -365), now))
    .filter((stay) => stay.kind === "reservation" && stay.checkOut <= now)
    .reverse();

  if (guests.length === 0 && past.length === 0) {
    return <EmptyState title={t.empty.title}>{t.empty.body}</EmptyState>;
  }

  const weekEnd = addDays(now, 7);
  const groups = [
    { title: t.groups.now, stays: guests.filter((stay) => stay.checkIn < now) },
    {
      title: t.groups.week,
      stays: guests.filter((stay) => stay.checkIn >= now && stay.checkIn < weekEnd),
    },
    { title: t.groups.later, stays: guests.filter((stay) => stay.checkIn >= weekEnd) },
    { title: t.groups.past, stays: past },
  ].filter((group) => group.stays.length > 0);

  const currency = properties[0]?.currency ?? "EUR";
  const charges = await getCharges();
  const overview = reservationsOverview({
    today: now,
    // Twelve months back, to the first of the month, and everything still ahead.
    stays: await getStays(monthStart(addMonths(monthOf(now), -11))),
    charges,
    properties,
  });

  return (
    <div className="max-w-4xl space-y-6">
      <DetailsRefresh />
      <section aria-labelledby="overview-heading">
        <SectionTitle id="overview-heading" className="mb-2 px-1">
          {t.overview.title}
        </SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      {groups.map((group) => {
        const total = group.stays.reduce((sum, stay) => sum + stayValue(stay, properties).total, 0);
        const nights = group.stays.reduce((sum, stay) => sum + diffDays(stay.checkIn, stay.checkOut), 0);
        return (
          <section key={group.title} aria-labelledby={`group-${group.title}`}>
            <div className="mb-2 flex items-baseline justify-between gap-4 px-1">
              <SectionTitle id={`group-${group.title}`}>{group.title}</SectionTitle>
              <p className="text-xs text-muted tabular-nums">
                {m.common.count.stays(group.stays.length)}, {m.common.count.nights(nights)},{" "}
                {fmt.money(total, currency, { cents: false })}
              </p>
            </div>
            <Card>
              <StayList stays={group.stays} properties={properties} conflicts={conflicts} today={now} />
            </Card>
          </section>
        );
      })}
      <p className="px-1 text-xs text-muted">{t.estimateNote}</p>
    </div>
  );
}

/** One side of the overview: the stays of a period, what they bring, what they cost and what is left. */
async function Totals({
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
  const { m, fmt } = await getI18n();
  const t = m.reservations.overview;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  const row = "flex items-baseline justify-between gap-4 px-4 py-2.5";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="font-medium">{title}</h3>
        {totals.profitable !== null && (
          <Badge tone={totals.profitable ? "good" : "critical"}>
            {totals.profitable ? t.profitable : t.loss}
          </Badge>
        )}
      </div>
      <dl className="divide-y divide-line">
        <div className={row}>
          <dt className="text-muted">{t.stays}</dt>
          <dd className="text-right tabular-nums">
            <span className="font-medium">{totals.stays}</span>
            <span className="block text-xs text-muted">{m.common.count.nights(totals.nights)}</span>
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted">{potential ? t.potential : t.revenue}</dt>
          <dd className="text-right tabular-nums">
            <span className="font-medium">{money(totals.revenue)}</span>
            {totals.estimated > 0 && (
              <span className="block text-xs text-muted">{t.estimated(money(totals.estimated))}</span>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted">{t.fees}</dt>
          <dd className="text-right tabular-nums">
            {totals.platformFees > 0 ? (
              <>
                <span className="font-medium">{money(totals.platformFees)}</span>
                <span className="block text-xs text-muted">{t.feesNote}</span>
              </>
            ) : (
              <span className="text-muted">{t.feesUnknown}</span>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className="text-muted">{t.costs}</dt>
          <dd className="text-right tabular-nums">
            {hasCosts ? (
              <span className="font-medium">{money(totals.costs)}</span>
            ) : (
              <span className="text-muted">
                {t.noCosts}{" "}
                <Link href="/revenue" className="text-ink underline underline-offset-2">
                  {t.addCosts}
                </Link>
              </span>
            )}
          </dd>
        </div>
        <div className={row}>
          <dt className="font-medium">{t.net}</dt>
          <dd className={`text-right font-semibold tabular-nums ${totals.net < 0 ? "text-critical" : ""}`}>
            {money(totals.net)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
