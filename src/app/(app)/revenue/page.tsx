import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ConfirmButton, SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { CHARGE_CATEGORIES, CHARGE_FREQUENCIES, type Charge, type Property } from "@/db/schema";
import { addCharge, deleteCharge } from "@/features/revenue/actions";
import { formatMonth } from "@/features/revenue/compute";
import { MonthChart } from "@/features/revenue/month-chart";
import { getRevenue, getRevenueYears } from "@/features/revenue/queries";
import { INTL_LOCALE } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";
import { today } from "@/lib/dates";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.revenue.title };
}

export default async function RevenuePage({ searchParams }: PageProps<"/revenue">) {
  const t = (await getI18n()).m.revenue;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Revenue searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const REVENUE_VIEWS = ["months", "years"] as const;

async function Revenue({ searchParams }: Pick<PageProps<"/revenue">, "searchParams">) {
  await connection();
  const { locale, m, fmt } = await getI18n();
  const t = m.revenue;
  const view = (await searchParams).view === "years" ? "years" : "months";
  const byYear = view === "years";
  const { currency, charges, properties, ...data } = byYear
    ? await getRevenueYears()
    : await getRevenue({ monthsBack: 12 });
  if (properties.length === 0) {
    return <EmptyState title={t.empty.title}>{t.empty.body}</EmptyState>;
  }
  const { current, summaries } = data;
  // The month or year we are in: its figures head the card and its costs are listed.
  const thisMonth = summaries.find((summary) => summary.month === current) ?? summaries[0];
  const money = (value: number) => fmt.money(value, currency, { cents: false });
  const monthName = (month: string) => (byYear ? month : formatMonth(month, "long", INTL_LOCALE[locale]));

  return (
    <div className="grid grid-cols-1 max-w-6xl items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <SectionTitle>{byYear ? t.years.title : t.months.title}</SectionTitle>
              <p className="mt-0.5 text-xs text-muted">
                {(byYear ? t.years : t.months).summary(
                  monthName(current),
                  money(thisMonth.gross),
                  money(thisMonth.charges),
                  thisMonth.estimated > 0 ? money(thisMonth.estimated) : null,
                )}
              </p>
            </div>
            <nav aria-label={t.view.label} className="flex">
              {REVENUE_VIEWS.map((option, index) => (
                <Link
                  key={option}
                  href={option === "months" ? "/revenue" : `/revenue?view=${option}`}
                  aria-current={option === view ? "page" : undefined}
                  className={buttonClass(
                    { size: "sm" },
                    cn(
                      index === 0 ? "rounded-r-none" : "-ml-px rounded-l-none",
                      option === view && "bg-sunken font-semibold",
                    ),
                  )}
                >
                  {t.view[option]}
                </Link>
              ))}
            </nav>
          </div>
          <MonthChart
            summaries={summaries}
            current={current}
            currency={currency}
            unit={byYear ? "year" : "month"}
          />
          <div className="relative overflow-x-auto border-t border-line">
            <table className="w-full text-left tabular-nums">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    {byYear ? t.years.year : t.months.month}
                  </th>
                  {byYear && (
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      {t.years.stays}
                    </th>
                  )}
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t.months.revenue}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t.months.costs}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t.months.net}
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">
                    {t.months.nights}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    {t.months.occupancy}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {summaries.map((summary) => (
                  <tr key={summary.month} className={summary.month === current ? "bg-subtle" : undefined}>
                    <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">
                      {t.months.label(monthName(summary.month))}
                      {byYear && summary.month === current && (
                        <span className="block text-xs font-normal text-muted">{t.years.inProgress}</span>
                      )}
                    </th>
                    {byYear && <td className="px-3 py-2 text-right text-muted">{summary.arrivals}</td>}
                    <td className="px-3 py-2 text-right">{money(summary.gross)}</td>
                    <td className="px-3 py-2 text-right text-muted">{money(summary.charges)}</td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${summary.net < 0 ? "text-critical" : ""}`}
                    >
                      {money(summary.net)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted">{summary.bookedNights}</td>
                    <td className="px-4 py-2 text-right text-muted">{fmt.percent(summary.occupancy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {thisMonth.chargeLines.length > 0 && (
          <Card>
            <div className="border-b border-line px-4 py-3">
              <SectionTitle>{t.costsIn(monthName(current))}</SectionTitle>
            </div>
            <ul className="divide-y divide-line tabular-nums">
              {[...thisMonth.chargeLines]
                .sort((a, b) => b.amount - a.amount)
                .map((line) => (
                  <li key={line.id} className="flex items-center justify-between gap-4 px-4 py-2">
                    <span>
                      {line.label} <span className="text-xs text-muted">({t.category[line.category]})</span>
                    </span>
                    <span>{fmt.money(line.amount, currency)}</span>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </div>

      <Card>
        <div className="border-b border-line px-4 py-3">
          <SectionTitle>{t.charges.title}</SectionTitle>
          <p className="mt-0.5 text-xs text-muted">{t.charges.hint}</p>
        </div>
        {charges.length > 0 ? (
          <ul className="divide-y divide-line">
            {charges.map((charge) => (
              <ChargeRow key={charge.id} charge={charge} properties={properties} currency={currency} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-5 text-muted">{t.charges.empty}</p>
        )}
        <ChargeForm properties={properties} />
      </Card>
    </div>
  );
}

async function ChargeRow({
  charge,
  properties,
  currency,
}: {
  charge: Charge;
  properties: Property[];
  currency: string;
}) {
  const { m, fmt } = await getI18n();
  const t = m.revenue;
  const fullDate = { day: "numeric", month: "short", year: "numeric" } as const;
  const scope = [
    t.frequency[charge.frequency],
    charge.frequency === "once" && fmt.date(charge.startsOn, fullDate),
    charge.appliesTo !== "all" && t.charges.only(m.common.sources[charge.appliesTo]),
    charge.propertyId ? properties.find((p) => p.id === charge.propertyId)?.name : t.charges.allProperties,
    charge.endsOn && t.charges.until(fmt.date(charge.endsOn, fullDate)),
  ].filter(Boolean);

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{charge.label}</p>
        <p className="truncate text-xs text-muted">{scope.join(", ")}</p>
      </div>
      <span className="font-medium tabular-nums">
        {charge.frequency === "percent" ? `${charge.amount / 100}%` : fmt.money(charge.amount, currency)}
      </span>
      <form action={deleteCharge.bind(null, charge.id)}>
        <ConfirmButton size="sm" message={t.charges.confirmRemove(charge.label)}>
          {t.charges.remove}
        </ConfirmButton>
      </form>
    </li>
  );
}

async function ChargeForm({ properties }: { properties: Property[] }) {
  const { m } = await getI18n();
  const t = m.revenue;
  const form = t.form;
  return (
    <form action={addCharge} className="space-y-3 border-t border-line bg-subtle p-4">
      <h3 className="text-xs font-semibold">{form.title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label={form.name} htmlFor="label" className="col-span-2">
          <Input id="label" name="label" required placeholder={form.namePlaceholder} />
        </Field>
        <Field label={form.frequency} htmlFor="frequency">
          <Select id="frequency" name="frequency" defaultValue="per_stay">
            {CHARGE_FREQUENCIES.map((value) => (
              <option key={value} value={value}>
                {t.frequency[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={form.amount} htmlFor="amount" hint={form.amountHint}>
          <Input id="amount" name="amount" required inputMode="decimal" placeholder="55" />
        </Field>
        <Field label={form.category} htmlFor="category">
          <Select id="category" name="category" defaultValue="cleaning">
            {CHARGE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t.category[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={form.appliesTo} htmlFor="appliesTo">
          <Select id="appliesTo" name="appliesTo" defaultValue="all">
            <option value="all">{form.everyChannel}</option>
            <option value="airbnb">{t.charges.only(m.common.sources.airbnb)}</option>
            <option value="booking">{t.charges.only(m.common.sources.booking)}</option>
            <option value="direct">{t.charges.only(m.common.sources.direct)}</option>
          </Select>
        </Field>
        <Field label={form.property} htmlFor="propertyId" className="col-span-2">
          <Select id="propertyId" name="propertyId" defaultValue="">
            <option value="">{t.charges.allProperties}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={form.startsOn} htmlFor="startsOn">
          <Input
            id="startsOn"
            name="startsOn"
            type="date"
            required
            defaultValue={`${today().slice(0, 8)}01`}
          />
        </Field>
        <Field label={form.endsOn} htmlFor="endsOn">
          <Input id="endsOn" name="endsOn" type="date" />
        </Field>
      </div>
      <SubmitButton variant="primary" pendingLabel={form.submitting}>
        {form.submit}
      </SubmitButton>
    </form>
  );
}
