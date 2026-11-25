import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { Property } from "@/db/schema";
import type { Pricing } from "@/features/pricing/queries";
import { pricingQuery, propertiesQuery } from "../../api/queries";
import { ReadPrices } from "../../features/pricing/read-prices";
import { GuestChecks, NightTable, ToAdjust } from "../../features/pricing/tables";
import { loadMessages, useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Card, EmptyState, PageHeader, SectionTitle } from "../../ui/primitives";

// The chart sits below the first screen: its code is fetched apart from the page's.
const PriceChart = lazy(() =>
  import("../../features/pricing/price-chart").then((file) => ({ default: file.PriceChart })),
);

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
    height: "1.75rem",
    paddingInline: "0.625rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.md,
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    fontWeight: 500,
    textDecoration: "none",
    transitionProperty: "color, background-color, border-color",
    transitionDuration: "150ms",
  },
  current: { borderColor: color.lineStrong, backgroundColor: color.sunken, color: color.ink },
  head: {
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  subtitle: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  // As tall as the chart with its legend and its axis, so nothing moves when it arrives.
  chartSpace: { minHeight: "17.25rem" },
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.lg,
    backgroundColor: color.line,
  },
  tile: { margin: 1, padding: "0.75rem 1rem", backgroundColor: color.bg },
  tileLabel: { color: color.muted, fontSize: text.sm },
  tileValue: {
    margin: "0.25rem 0 0",
    fontSize: "1.25rem",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    fontVariantNumeric: "tabular-nums",
  },
  tileHint: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
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
          <Tiles summary={pricing.summary} currency={property.currency} />
          <Card>
            <div {...stylex.props(styles.head)}>
              <SectionTitle>{t.chart.title}</SectionTitle>
              <p {...stylex.props(styles.subtitle)}>{t.chart.subtitle(Math.round(days / 30))}</p>
            </div>
            {charted && (
              <Suspense fallback={<div {...stylex.props(styles.chartSpace)} />}>
                <PriceChart nights={pricing.nights} currency={property.currency} />
              </Suspense>
            )}
          </Card>
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

function Tiles({ summary, currency }: { summary: Pricing["summary"]; currency: string }) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing.tiles;
  const money = (amount: number) => fmt.money(amount, currency, { cents: false });
  const toAdjust = summary.bookingLower + summary.bookingHigher;
  const tiles = [
    ...(["airbnb", "booking"] as const).map((channel) => ({
      label: t.average(m.common.sources[channel]),
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
    <dl {...stylex.props(styles.tiles)}>
      {tiles.map((tile) => (
        <div key={tile.label} {...stylex.props(styles.tile)}>
          <dt {...stylex.props(styles.tileLabel)}>{tile.label}</dt>
          <dd {...stylex.props(styles.tileValue)}>{tile.value}</dd>
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
