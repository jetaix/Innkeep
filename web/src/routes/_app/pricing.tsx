import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { Property } from "@/db/schema";
import type { Pricing } from "@/features/pricing/queries";
import { pricingQuery, propertiesQuery } from "../../api/queries";
import { NOTABLE, summariseGap } from "../../features/pricing/gap";
import { ReadPrices } from "../../features/pricing/read-prices";
import { GuestChecks, NightTable, ToAdjust } from "../../features/pricing/tables";
import { loadMessages, useI18n } from "../../i18n";
import { color, radius, shadow, text } from "../../tokens.stylex";
import { Card, EmptyState, PageHeader, SourceDot } from "../../ui/primitives";
import { figureStyle } from "../../ui/slab";

// The chart sits below the first screen: its code is fetched apart from the page's, and beside the page's data.
const loadChart = () => import("../../features/pricing/price-chart");
const PriceChart = lazy(() => loadChart().then((file) => ({ default: file.PriceChart })));

const whole = (value: unknown) =>
  Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : undefined;

export type PricingSearch = { property?: number; days?: number; plan?: string };

/** The property asked for, else the first one. */
const chosen = (properties: Property[], search: PricingSearch): Property | undefined =>
  properties.find((property) => property.id === search.property) ?? properties[0];

const pricingOf = (property: Property, search: PricingSearch) =>
  pricingQuery({ property: property.id, plan: search.plan, days: search.days });

export const Route = createFileRoute("/_app/pricing")({
  validateSearch: (search: Record<string, unknown>): PricingSearch => ({
    property: whole(search.property),
    days: whole(search.days),
    plan: typeof search.plan === "string" ? search.plan : undefined,
  }),
  loaderDeps: ({ search }) => search,
  // Waited for, so that a new period, property or rate replaces the page in one go
  // instead of blanking it; the components read the same queries.
  loader: async ({ context: { queryClient }, deps }) => {
    void loadMessages("pricing", "extension");
    // Not waited for: the page shows without the chart, which then has less far to come.
    void loadChart();
    const { properties } = await queryClient.ensureQueryData(propertiesQuery);
    const property = chosen(properties, deps);
    if (property) await queryClient.ensureQueryData(pricingOf(property, deps));
  },
  component: PricingPage,
});

const WIDE = "@media (min-width: 40rem)";

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "72rem" },
  choices: { display: "flex", flexWrap: "wrap", columnGap: "1.5rem", rowGap: "0.5rem" },
  choice: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" },
  choiceLabel: { marginInlineEnd: "0.25rem", color: color.muted, fontSize: text.sm },
  option: {
    display: "flex",
    alignItems: "center",
    height: "1.875rem",
    paddingInline: "0.75rem",
    borderRadius: radius.full,
    backgroundColor: { default: "transparent", ":hover": color.sunken },
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    fontWeight: 500,
    textDecoration: "none",
    transitionProperty: "color, background-color, box-shadow",
    transitionDuration: "200ms",
  },
  current: {
    backgroundColor: { default: color.panel, ":hover": color.panel },
    color: color.ink,
    boxShadow: shadow.card,
  },
  // The one lifted panel of the page: the gap between the two platforms.
  gap: {
    padding: { default: "1.25rem", [WIDE]: "1.75rem" },
    borderRadius: { default: radius.xl, [WIDE]: "28px" },
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  statement: { maxWidth: "40rem", margin: 0, fontWeight: 400 },
  figure: { display: "block", fontSize: { default: "3rem", [WIDE]: "4rem" } },
  sentence: {
    display: "block",
    marginTop: "0.5rem",
    color: color.ink,
    fontSize: text.md,
    lineHeight: 1.55,
    textWrap: "pretty",
  },
  detail: {
    maxWidth: "40rem",
    margin: "0.375rem 0 0",
    color: color.muted,
    fontSize: text.md,
    lineHeight: 1.55,
    textWrap: "pretty",
  },
  chartHead: {
    margin: "1.5rem 0 0.75rem",
    paddingTop: "1.25rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: text.base,
  },
  chartTitle: { display: "inline", margin: 0, color: color.ink, fontSize: text.base, fontWeight: 600 },
  // As tall as the chart with its legend and its axis, so nothing moves when it arrives.
  chartSpace: { minHeight: "16.25rem" },
  summary: {
    paddingInline: "0.25rem",
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "underline",
    textUnderlineOffset: 2,
    cursor: "pointer",
  },
  disclosed: { marginTop: "0.75rem" },
  plain: { margin: 0 },
  steps: { margin: "0.75rem 0 0", paddingInlineStart: "1.25rem", listStyleType: "decimal" },
  step: { marginTop: { default: "0.25rem", ":first-child": 0 } },
  // The tiles
  tiles: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "repeat(3, 1fr)" },
    margin: 0,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: color.panel,
    boxShadow: shadow.card,
  },
  tile: {
    padding: "1rem 1.25rem",
    borderColor: color.line,
    borderStyle: "solid",
    borderWidth: 0,
    borderTopWidth: { default: 1, ":first-child": 0, [WIDE]: 0 },
    borderInlineStartWidth: { default: 0, [WIDE]: 1, ":first-child": 0 },
  },
  tileLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: color.muted,
    fontSize: text.base,
  },
  tileValue: { margin: "0.5rem 0 0", fontSize: "1.75rem" },
  tileHint: { margin: "0.375rem 0 0", color: color.muted, fontSize: text.sm, lineHeight: 1.45 },
  // The notes
  notes: { padding: "1.25rem" },
  noteList: {
    margin: 0,
    paddingInlineStart: "1.25rem",
    listStyleType: "disc",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  noteItem: { marginTop: { default: "0.375rem", ":first-child": 0 } },
});

function PricingPage() {
  const t = useI18n("pricing").m.pricing;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <PricingView />
    </>
  );
}

function PricingView() {
  const t = useI18n("pricing").m.pricing;
  const search = Route.useSearch();
  const { properties } = useSuspenseQuery(propertiesQuery).data;
  const property = chosen(properties, search);
  if (!property) {
    return <EmptyState title={t.noProperty.title}>{t.noProperty.body}</EmptyState>;
  }
  return <PropertyPricing properties={properties} property={property} />;
}

function PropertyPricing({ properties, property }: { properties: Property[]; property: Property }) {
  const t = useI18n("pricing").m.pricing;
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(pricingOf(property, search));
  const { pricing, windows } = data;
  const { days } = pricing;
  const hasPrices = pricing.coverage.airbnb != null || pricing.coverage.booking != null;
  // The chart draws nothing without a price in the period: no room is kept for it then.
  const charted = pricing.nights.some((night) => night.airbnb != null || night.booking != null);

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.choices)}>
        <Choice
          label={t.period}
          options={windows.map((window) => ({
            id: String(window),
            label: t.months(Math.round(window / 30)),
            search: (previous) => ({ ...previous, days: window === windows[0] ? undefined : window }),
            current: window === days,
          }))}
        />
        {properties.length > 1 && (
          <Choice
            label={t.property}
            options={properties.map((place) => ({
              id: String(place.id),
              label: place.name,
              // Rates belong to a property: another property starts from its own default.
              search: (previous) => ({
                ...previous,
                property: place.id === properties[0].id ? undefined : place.id,
                plan: undefined,
              }),
              current: place.id === property.id,
            }))}
          />
        )}
        {pricing.plans.length > 1 && (
          <Choice
            label={t.plan}
            options={pricing.plans.map((plan) => ({
              id: plan,
              label: plan,
              search: (previous) => ({ ...previous, plan }),
              current: plan === pricing.plan,
            }))}
          />
        )}
      </div>

      <ReadPrices
        pricing={pricing}
        links={data.extensionOn ? data.calendarLinks : []}
        extension={data.extension}
      />

      {hasPrices ? (
        <>
          <section {...stylex.props(styles.gap)}>
            <Gap nights={pricing.nights} currency={property.currency} />
            <div {...stylex.props(styles.chartHead)}>
              <h3 {...stylex.props(styles.chartTitle)}>{t.chart.title}</h3>
              {". "}
              {t.chart.subtitle(Math.round(days / 30))}
            </div>
            {charted && (
              <Suspense fallback={<div {...stylex.props(styles.chartSpace)} />}>
                <PriceChart nights={pricing.nights} currency={property.currency} />
              </Suspense>
            )}
          </section>
          <Tiles summary={pricing.summary} currency={property.currency} />
          <ToAdjust nights={pricing.nights} currency={property.currency} />
          <GuestChecks
            pricing={pricing}
            currency={property.currency}
            links={data.guestLinks}
            canOpen={data.extensionOn}
          />
          <details>
            <summary {...stylex.props(styles.summary)}>{t.details.nights}</summary>
            <div {...stylex.props(styles.disclosed)}>
              <NightTable nights={pricing.nights} currency={property.currency} />
            </div>
          </details>
          <details>
            <summary {...stylex.props(styles.summary)}>{t.details.notes}</summary>
            <div {...stylex.props(styles.disclosed)}>
              <Notes pricing={pricing} />
            </div>
          </details>
        </>
      ) : (
        <EmptyState title={t.empty.title}>
          <p {...stylex.props(styles.plain)}>{t.empty.body}</p>
          <ol {...stylex.props(styles.steps)}>
            {t.empty.steps.map((step) => (
              <li key={step} {...stylex.props(styles.step)}>
                {step}
              </li>
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
  options: {
    id: string;
    label: string;
    /** The address of this alternative: the current one with one parameter changed. */
    search: (previous: PricingSearch) => PricingSearch;
    current: boolean;
  }[];
}) {
  return (
    <nav aria-label={label} {...stylex.props(styles.choice)}>
      <span {...stylex.props(styles.choiceLabel)}>{label}</span>
      {options.map((option) => (
        <Link
          key={option.id}
          from={Route.fullPath}
          to="/pricing"
          search={option.search}
          aria-current={option.current ? "true" : undefined}
          {...stylex.props(styles.option, option.current && styles.current)}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * The difference between the two platforms' prices, said before it is drawn:
 * the average gap as a figure, then which platform is cheaper on how many
 * nights and where the gap is widest.
 */
function Gap({ nights, currency }: { nights: Pricing["nights"]; currency: string }) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.gap;
  const gap = summariseGap(nights);
  if (gap.compared === 0) return <p {...stylex.props(styles.detail)}>{t.none}</p>;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  const { airbnb, booking } = m.common.sources;
  // Whole units of currency: a gap under one is no gap.
  const average = Math.round(gap.average / 100) * 100;
  return (
    <>
      <h2 {...stylex.props(styles.statement)}>
        <span {...stylex.props(figureStyle, styles.figure)}>{money(Math.abs(average))}</span>
        <span {...stylex.props(styles.sentence)}>
          {average === 0
            ? t.same(gap.compared)
            : average > 0
              ? t.more(booking, airbnb, gap.compared)
              : t.more(airbnb, booking, gap.compared)}
        </span>
      </h2>
      <p {...stylex.props(styles.detail)}>
        {t.split(airbnb, gap.airbnbCheaper, booking, gap.bookingCheaper, gap.close, fmt.percent(NOTABLE))}
        {gap.widest &&
          ` ${t.widest(
            money(gap.widest.amount),
            fmt.date(gap.widest.date, { weekday: "short", day: "numeric", month: "short" }),
            m.common.sources[gap.widest.dearer],
          )}`}
      </p>
    </>
  );
}

function Tiles({ summary, currency }: { summary: Pricing["summary"]; currency: string }) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.tiles;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  const toAdjust = summary.bookingLower + summary.bookingHigher;
  const tiles = [
    ...(["airbnb", "booking"] as const).map((channel) => ({
      source: channel,
      label: t.average(m.common.sources[channel]),
      value: summary[channel].average == null ? "–" : money(summary[channel].average),
      hint: summary[channel].nights ? t.freeNights(summary[channel].nights) : t.noPrices,
    })),
    {
      source: null,
      label: t.toAdjust,
      value: String(toAdjust),
      hint: summary.shortfall > 0 ? t.toAdjustHint(money(summary.shortfall)) : t.aligned,
    },
  ];

  return (
    <dl {...stylex.props(styles.tiles)}>
      {tiles.map((tile) => (
        <div key={tile.label} {...stylex.props(styles.tile)}>
          <dt {...stylex.props(styles.tileLabel)}>
            {tile.source && <SourceDot source={tile.source} />}
            {tile.label}
          </dt>
          <dd {...stylex.props(figureStyle, styles.tileValue)}>{tile.value}</dd>
          <dd {...stylex.props(styles.tileHint)}>{tile.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

function Notes({
  pricing,
}: {
  pricing: Pick<Pricing, "fees" | "bookingFeeMeasured" | "coverage" | "airbnbVaries">;
}) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.notes;
  return (
    <Card xstyle={styles.notes}>
      <ul {...stylex.props(styles.noteList)}>
        <li {...stylex.props(styles.noteItem)}>
          {t.fees(
            fmt.percent(pricing.fees.airbnb),
            fmt.percent(pricing.fees.booking),
            pricing.bookingFeeMeasured,
          )}
        </li>
        <li {...stylex.props(styles.noteItem)}>{t.market}</li>
        {pricing.coverage.airbnb && (
          <li {...stylex.props(styles.noteItem)}>{pricing.airbnbVaries ? t.smart : t.flat}</li>
        )}
        <li {...stylex.props(styles.noteItem)}>{t.history}</li>
        <li {...stylex.props(styles.noteItem)}>{t.rules}</li>
      </ul>
    </Card>
  );
}
