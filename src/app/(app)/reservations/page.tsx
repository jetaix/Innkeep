import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui/button";
import { Card, EmptyState, Kbd, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { findConflicts, getProperties, getStays } from "@/features/reservations/queries";
import { DetailsRefresh } from "@/features/reservations/details-refresh";
import { StayList } from "@/features/reservations/stay-list";
import { stayValue } from "@/features/revenue/compute";
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

  return (
    <div className="max-w-4xl space-y-6">
      <DetailsRefresh />
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
