import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { buttonClass } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Card, EmptyState, PageHeader, SectionTitle, SourceDot } from "@/components/ui/primitives";
import type { OtaChannel, Property } from "@/db/schema";
import type { Night, PriceSuggestion } from "@/features/pricing/compute";
import { PriceChart } from "@/features/pricing/price-chart";
import { getPricing, PRICING_WINDOWS, type Pricing } from "@/features/pricing/queries";
import { calendarLinks, guestViewLinks } from "@/features/reservations/platform-links";
import { getProperties } from "@/features/reservations/queries";
import { SyncCta } from "@/features/extension/sync-cta";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.pricing.title };
}

export default async function PricingPage({ searchParams }: PageProps<"/pricing">) {
  const t = (await getI18n()).m.pricing;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <PricingView searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function PricingView({ searchParams }: Pick<PageProps<"/pricing">, "searchParams">) {
  await connection();
  const { m } = await getI18n();
  const t = m.pricing;
  const params = await searchParams;
  const properties = await getProperties();
  if (properties.length === 0) {
    return <EmptyState title={t.noProperty.title}>{t.noProperty.body}</EmptyState>;
  }
  const property = properties.find((p) => p.id === Number(one(params.property))) ?? properties[0];
  const days = PRICING_WINDOWS.find((window) => window === Number(one(params.days))) ?? PRICING_WINDOWS[0];
  const pricing = await getPricing(property.id, one(params.plan), days);
  const hasPrices = pricing.coverage.airbnb != null || pricing.coverage.booking != null;
  const href = (next: { property?: number; plan?: string; days?: number }) => {
    const query = new URLSearchParams();
    const propertyId = next.property ?? property.id;
    if (propertyId !== properties[0].id) query.set("property", String(propertyId));
    const plan = next.property ? undefined : (next.plan ?? one(params.plan));
    if (plan) query.set("plan", plan);
    const window = next.days ?? days;
    if (window !== PRICING_WINDOWS[0]) query.set("days", String(window));
    return query.size ? `/pricing?${query}` : "/pricing";
  };

  return (
    <div className="max-w-6xl space-y-6">
      {
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Choice
            label={t.period}
            options={PRICING_WINDOWS.map((window) => ({
              label: t.months(Math.round(window / 30)),
              href: href({ days: window }),
              current: window === days,
            }))}
          />
          {properties.length > 1 && (
            <Choice
              label={t.property}
              options={properties.map((p) => ({
                label: p.name,
                href: href({ property: p.id }),
                current: p.id === property.id,
              }))}
            />
          )}
          {pricing.plans.length > 1 && (
            <Choice
              label={t.plan}
              options={pricing.plans.map((plan) => ({
                label: plan,
                href: href({ plan }),
                current: plan === pricing.plan,
              }))}
            />
          )}
        </div>
      }

      <ReadPrices property={property} pricing={pricing} />

      {hasPrices ? (
        <>
          <Tiles pricing={pricing} currency={property.currency} />
          <Card>
            <div className="border-b border-line px-4 py-3">
              <SectionTitle>{t.chart.title}</SectionTitle>
              <p className="mt-0.5 text-xs text-muted">{t.chart.subtitle(Math.round(days / 30))}</p>
            </div>
            <PriceChart
              nights={pricing.nights.map(({ date, takenBy, airbnb, booking }) => ({
                date,
                takenBy,
                airbnb,
                booking,
              }))}
              currency={property.currency}
            />
          </Card>
          <ToAdjust pricing={pricing} currency={property.currency} />
          <GuestChecks property={property} pricing={pricing} />
          <details className="group">
            <summary className="cursor-pointer px-1 text-[13px] font-medium underline underline-offset-2">
              {t.details.nights}
            </summary>
            <div className="mt-3">
              <NightTable pricing={pricing} currency={property.currency} />
            </div>
          </details>
          <details>
            <summary className="cursor-pointer px-1 text-[13px] font-medium underline underline-offset-2">
              {t.details.notes}
            </summary>
            <div className="mt-3">
              <Notes pricing={pricing} />
            </div>
          </details>
        </>
      ) : (
        <EmptyState title={t.empty.title}>
          <p>{t.empty.body}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {t.empty.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </EmptyState>
      )}
    </div>
  );
}

/** A short list of alternatives shown as links, one of them current. */
function Choice({
  label,
  options,
}: {
  label: string;
  options: { label: string; href: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted">{label}</span>
      {options.map((option) => (
        <Link
          key={option.href}
          href={option.href}
          aria-current={option.current ? "true" : undefined}
          className={cn(
            "flex h-7 items-center rounded-md border px-2.5 text-xs font-medium transition-colors",
            option.current
              ? "border-line-strong bg-sunken text-ink"
              : "border-line text-muted hover:text-ink",
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Buttons to the host's own calendars, where the extension reads the prices,
 * and how much each platform has given so far. Plain links, not `noreferrer`,
 * like the other pages the extension reads.
 */
async function ReadPrices({ property, pricing }: { property: Property; pricing: Pricing }) {
  const { m, fmt } = await getI18n();
  const t = m.pricing;
  const links = process.env.EXTENSION_TOKEN ? await calendarLinks(property.id) : [];
  const channels: OtaChannel[] = ["airbnb", "booking"];

  return (
    <Card className="space-y-3 p-4">
      {links.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.read.label}>
          <span className="text-xs text-muted">{t.read.from}</span>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener"
              title={t.read.hint}
              className={buttonClass({ size: "sm" })}
            >
              {t.read.calendar(CHANNELS[link.channel].label)}
              <ExternalLink aria-hidden />
              <span className="sr-only">{m.common.actions.newTab}</span>
            </a>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted">{t.empty.noLinks}</p>
      )}
      <ul className="space-y-0.5 text-xs text-muted">
        {channels.map((channel) => {
          const covered = pricing.coverage[channel];
          const label = CHANNELS[channel].label;
          return (
            <li key={channel} className="flex flex-wrap items-center gap-1.5">
              <SourceDot source={channel} />
              {covered
                ? t.read.covered(
                    label,
                    covered.nights,
                    fmt.date(covered.until, { day: "numeric", month: "short", year: "numeric" }),
                    fmt.timeAgo(covered.seenAt),
                  )
                : t.read.never(label)}
              {!covered && <SyncCta scope="all" />}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

async function Tiles({ pricing, currency }: { pricing: Pricing; currency: string }) {
  const { m, fmt } = await getI18n();
  const t = m.pricing.tiles;
  const { summary } = pricing;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  const toAdjust = summary.bookingLower + summary.bookingHigher;
  const tiles = [
    ...(["airbnb", "booking"] as const).map((channel) => ({
      label: t.average(CHANNELS[channel].label),
      value: summary[channel].average == null ? "–" : money(summary[channel].average),
      hint: summary[channel].nights ? t.freeNights(summary[channel].nights) : t.noPrices,
    })),
    {
      label: t.toAdjust,
      value: String(toAdjust),
      hint: summary.shortfall > 0 ? t.toAdjustHint(money(summary.shortfall)) : t.aligned,
    },
  ];

  return (
    <dl className="grid grid-cols-1 overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3 [&>div]:bg-bg">
      {tiles.map((tile) => (
        <div key={tile.label} className="m-px px-4 py-3">
          <dt className="text-xs text-muted">{tile.label}</dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{tile.value}</dd>
          <dd className="mt-0.5 text-xs text-muted">{tile.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A few sample stays, comparing the calendar's nightly prices with the total
 * each platform shows a guest. Each check is one page the host opens; Innkeep
 * never loads Airbnb or Booking.com by itself.
 */
async function GuestChecks({ property, pricing }: { property: Property; pricing: Pricing }) {
  const { m, fmt } = await getI18n();
  const t = m.pricing.guest;
  if (!pricing.coverage.airbnb) return null;
  const money = (amount: number) => fmt.money(amount, property.currency, { cents: false });
  const canOpen = Boolean(process.env.EXTENSION_TOKEN);
  const channels = ["airbnb", "booking"] as const;
  const rows = await Promise.all(
    pricing.guestChecks.map(async (check) => ({
      ...check,
      links: canOpen
        ? await guestViewLinks(property.id, check.checkIn, check.checkOut, property.maxGuests)
        : {},
    })),
  );

  return (
    <Card>
      <div className="border-b border-line px-4 py-3">
        <SectionTitle>{t.title}</SectionTitle>
        <p className="mt-0.5 max-w-[80ch] text-xs text-muted">{t.subtitle}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-muted">{t.none}</p>
      ) : (
        <div className="relative overflow-x-auto">
          <table className="w-full text-left tabular-nums">
            <thead className="text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">
                  {t.stay}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {t.nightly}
                </th>
                {channels.map((channel) => (
                  <th key={channel} scope="col" className="px-3 py-2 text-right font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <SourceDot source={channel} />
                      {t.shown(CHANNELS[channel].label)}
                    </span>
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {t.difference}
                </th>
                <td className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-t border-line">
              {rows.map((check) => {
                const { airbnb, booking } = check.quotes;
                const gap = airbnb && booking ? booking.total - airbnb.total : null;
                return (
                  <tr key={check.checkIn}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {m.pricing.table.range(fmt.date(check.checkIn), fmt.date(check.checkOut))}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-medium">{money(check.nightly)}</span>
                      <span className="block text-xs text-muted">{t.perNight(money(check.nightly / 3))}</span>
                    </td>
                    {channels.map((channel) => {
                      const quote = check.quotes[channel];
                      return (
                        <td key={channel} className="px-3 py-2 text-right">
                          {quote ? (
                            <>
                              <span className="font-medium">{money(quote.total)}</span>
                              <span className="block text-xs text-muted">
                                {t.perNight(money(quote.total / 3))}
                              </span>
                              <span className="block text-xs text-muted">
                                {quote.original ? `${t.was(money(quote.original))}, ` : ""}
                                {t.read(fmt.timeAgo(quote.seenAt))}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-muted">{t.notChecked}</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right whitespace-nowrap text-muted">
                      {gap == null || !airbnb ? (
                        <span className="text-faint">–</span>
                      ) : (
                        <>
                          {gap >= 0 ? "+" : "−"}
                          {money(Math.abs(gap))} ({gap >= 0 ? "+" : "−"}
                          {fmt.percent(Math.abs(gap) / airbnb.total)})
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="flex flex-wrap justify-end gap-1.5">
                        {channels.map((channel) =>
                          check.links[channel] ? (
                            <a
                              key={channel}
                              href={check.links[channel]}
                              target="_blank"
                              rel="noopener"
                              title={t.hint}
                              className={buttonClass({ size: "sm" })}
                            >
                              {t.check(CHANNELS[channel].label)}
                              <ExternalLink aria-hidden />
                              <span className="sr-only">{m.common.actions.newTab}</span>
                            </a>
                          ) : null,
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {canOpen && rows.length > 0 && !rows[0].links.booking && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">{t.noBookingLink}</p>
      )}
    </Card>
  );
}

/** A suggestion in words: what to do and, when it helps, why. */
async function suggestionText(currency: string) {
  const { m, fmt } = await getI18n();
  const s = m.pricing.suggestion;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  return (suggestion: PriceSuggestion, night: Night): { title: string; why?: string } => {
    switch (suggestion.kind) {
      case "align":
        return suggestion.direction === "raise"
          ? { title: s.raise(money(suggestion.target)), why: s.raiseWhy(money(night.airbnbNet ?? 0)) }
          : { title: s.lower(money(suggestion.target)), why: s.lowerWhy };
      case "lastMinute":
        return { title: s.lastMinute(fmt.percent(suggestion.percent)) };
      case "orphan":
        return { title: s.orphan(suggestion.nights) };
      case "belowHistory":
        return { title: s.belowHistory(money(suggestion.earned)) };
    }
  };
}

const TODO_LIMIT = 10;

/** The free nights worth a change, with nights in a row that call for the same thing shown as one line. */
async function ToAdjust({ pricing, currency }: { pricing: Pricing; currency: string }) {
  const { m, fmt } = await getI18n();
  const t = m.pricing.todo;
  const describe = await suggestionText(currency);
  const day = (date: string) => fmt.date(date, { weekday: "short", day: "numeric", month: "short" });

  const groups: { first: string; last: string; nights: number; title: string; why?: string }[] = [];
  pricing.nights.forEach((night, index) => {
    if (night.takenBy || !night.suggestion) return;
    const text = describe(night.suggestion, night);
    const previous = groups.at(-1);
    if (previous && previous.title === text.title && pricing.nights[index - 1]?.date === previous.last) {
      previous.last = night.date;
      previous.nights++;
    } else groups.push({ first: night.date, last: night.date, nights: 1, ...text });
  });

  return (
    <Card>
      <div className="border-b border-line px-4 py-3">
        <SectionTitle>{t.title}</SectionTitle>
        <p className="mt-0.5 max-w-[80ch] text-xs text-muted">{t.subtitle}</p>
      </div>
      {groups.length === 0 ? (
        <p className="px-4 py-4 text-[13px] text-muted">{t.none}</p>
      ) : (
        <ul className="divide-y divide-line">
          {groups.slice(0, TODO_LIMIT).map((group) => (
            <li
              key={group.first}
              className="grid grid-cols-1 gap-x-4 gap-y-0.5 px-4 py-2.5 sm:grid-cols-[14rem_1fr]"
            >
              <span className="text-[13px] text-muted tabular-nums">
                {group.nights === 1
                  ? day(group.first)
                  : `${m.pricing.table.range(day(group.first), day(group.last))} (${m.common.count.nights(group.nights)})`}
              </span>
              <span className="text-[13px]">
                <span className="font-medium">{group.title}</span>
                {group.why && <span className="text-muted">, {group.why}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      {groups.length > TODO_LIMIT && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          {t.more(groups.length - TODO_LIMIT)}
        </p>
      )}
    </Card>
  );
}

/** Consecutive taken nights held by the same source become one row; free nights stay one each. */
type Row = { kind: "free"; night: Night } | { kind: "taken"; first: Night; last: Night; nights: number };

function toRows(nights: Night[]): Row[] {
  const rows: Row[] = [];
  for (const night of nights) {
    const previous = rows.at(-1);
    if (!night.takenBy) rows.push({ kind: "free", night });
    else if (previous?.kind === "taken" && previous.first.takenBy === night.takenBy) {
      previous.last = night;
      previous.nights++;
    } else rows.push({ kind: "taken", first: night, last: night, nights: 1 });
  }
  return rows;
}

async function NightTable({ pricing, currency }: { pricing: Pricing; currency: string }) {
  const { m, fmt } = await getI18n();
  const t = m.pricing.table;
  const money = (amount: number | null) =>
    amount == null ? <span className="text-faint">–</span> : fmt.money(amount, currency, { cents: false });
  const day = (date: string) => fmt.date(date, { weekday: "short", day: "numeric", month: "short" });

  const describe = await suggestionText(currency);

  return (
    <Card>
      <div className="relative overflow-x-auto">
        <table className="w-full text-left tabular-nums">
          <thead className="text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                {t.night}
              </th>
              {(["airbnb", "booking"] as const).map((channel) => (
                <th key={channel} scope="col" className="px-3 py-2 text-right font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <SourceDot source={channel} />
                    {CHANNELS[channel].label}
                  </span>
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-right font-medium">
                {t.gap}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t.suggestion}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line">
            {toRows(pricing.nights).map((row) =>
              row.kind === "taken" ? (
                <tr key={row.first.date} className="bg-subtle text-muted">
                  <td className="px-4 py-2 whitespace-nowrap">
                    {row.nights === 1
                      ? day(row.first.date)
                      : t.range(day(row.first.date), day(row.last.date))}
                  </td>
                  <td colSpan={4} className="px-3 py-2 text-xs">
                    {t.taken[row.first.takenBy!]}, {m.common.count.nights(row.nights)}
                  </td>
                </tr>
              ) : (
                <FreeNight
                  key={row.night.date}
                  night={row.night}
                  day={day}
                  money={money}
                  describe={describe}
                />
              ),
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

async function FreeNight({
  night,
  day,
  money,
  describe,
}: {
  night: Night;
  day: (date: string) => string;
  money: (amount: number | null) => React.ReactNode;
  describe: (suggestion: PriceSuggestion, night: Night) => { title: string; why?: string };
}) {
  const { m } = await getI18n();
  const suggestion = night.suggestion ? describe(night.suggestion, night) : null;
  const priced = night.airbnb != null || night.booking != null;
  return (
    <tr>
      <td className="px-4 py-2 whitespace-nowrap">
        {day(night.date)}
        {night.note && <span className="ml-2 text-xs text-muted">{night.note}</span>}
      </td>
      <td className="px-3 py-2 text-right">{money(night.airbnb)}</td>
      <td className="px-3 py-2 text-right">{money(night.booking)}</td>
      <td
        className={cn(
          "px-3 py-2 text-right whitespace-nowrap",
          night.suggestion?.kind === "align" ? "font-medium text-warn" : "text-muted",
        )}
      >
        {night.gap == null ? (
          <span className="text-xs text-faint">{priced ? "–" : m.pricing.table.noPrice}</span>
        ) : (
          <>
            {night.gap > 0 ? "+" : night.gap < 0 ? "−" : ""}
            {money(Math.abs(night.gap))}
          </>
        )}
      </td>
      <td className="px-4 py-2 text-[13px]">
        {suggestion ? (
          <>
            <span className="font-medium">{suggestion.title}</span>
            {suggestion.why && <span className="text-muted">, {suggestion.why}</span>}
          </>
        ) : null}
      </td>
    </tr>
  );
}

async function Notes({ pricing }: { pricing: Pricing }) {
  const { m, fmt } = await getI18n();
  const t = m.pricing.notes;
  return (
    <Card className="p-5">
      <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">
        <li>
          {t.fees(
            fmt.percent(pricing.fees.airbnb),
            fmt.percent(pricing.fees.booking),
            pricing.bookingFeeMeasured,
          )}
        </li>
        <li>{t.market}</li>
        {pricing.coverage.airbnb && <li>{pricing.airbnbVaries ? t.smart : t.flat}</li>}
        <li>{t.history}</li>
        <li>{t.rules}</li>
      </ul>
    </Card>
  );
}
