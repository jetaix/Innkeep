import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { Charge, Property } from "@/db/schema";
import { formatMonth, type MonthSummary } from "@/features/revenue/compute";
import { INTL_LOCALE } from "@/i18n/config";
import { revenueQuery, revenueYearsQuery } from "../../api/queries";
import { ChargeForm, ChargeRow } from "../../features/revenue/charges";
import { MonthChart } from "../../features/revenue/month-chart";
import { loadMessages, useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Card, EmptyState, PageHeader, SectionTitle } from "../../ui/primitives";

/** The last twelve months, this one and the four ahead. */
const months = () => revenueQuery({ back: 12 });

export const Route = createFileRoute("/_app/revenue")({
  validateSearch: (search: Record<string, unknown>): { view?: "years" } => ({
    view: search.view === "years" ? "years" : undefined,
  }),
  loaderDeps: ({ search }) => ({ view: search.view }),
  // Started while this route's code downloads; the components read the same queries.
  loader: ({ context: { queryClient }, deps }) => {
    void loadMessages("revenue");
    return deps.view === "years"
      ? queryClient.ensureQueryData(revenueYearsQuery)
      : queryClient.ensureQueryData(months());
  },
  component: RevenuePage,
});

const XL = "@media (min-width: 80rem)";

const styles = stylex.create({
  page: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [XL]: "minmax(0, 1.5fr) minmax(0, 1fr)" },
    alignItems: "start",
    gap: "1.5rem",
    maxWidth: "72rem",
  },
  main: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  head: {
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  split: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.75rem",
  },
  headText: { minWidth: 0 },
  hint: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  views: { display: "flex" },
  first: { borderStartEndRadius: 0, borderEndEndRadius: 0 },
  next: { marginInlineStart: -1, borderStartStartRadius: 0, borderEndStartRadius: 0 },
  chosen: { backgroundColor: color.sunken, fontWeight: 600 },
  scroll: {
    position: "relative",
    overflowX: "auto",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "start",
    fontVariantNumeric: "tabular-nums",
  },
  columns: { color: color.muted, fontSize: text.sm },
  column: { padding: "0.5rem 0.75rem", fontWeight: 500, textAlign: "end" },
  line: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  now: { backgroundColor: color.subtle },
  cell: { padding: "0.5rem 0.75rem", textAlign: "end" },
  name: { fontWeight: 500, textAlign: "start", whiteSpace: "nowrap" },
  start: { paddingInlineStart: "1rem", textAlign: "start" },
  end: { paddingInlineEnd: "1rem" },
  muted: { color: color.muted },
  strong: { fontWeight: 500 },
  loss: { color: color.critical },
  below: { display: "block", color: color.muted, fontSize: text.sm, fontWeight: 400 },
  list: { margin: 0, padding: 0, listStyle: "none" },
  figures: { fontVariantNumeric: "tabular-nums" },
  cost: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.5rem 1rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  small: { color: color.muted, fontSize: text.sm },
  none: { margin: 0, padding: "1.25rem 1rem", color: color.muted },
});

function RevenuePage() {
  const t = useI18n("revenue").m.revenue;
  const { view } = Route.useSearch();
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      {view === "years" ? <ByYear /> : <ByMonth />}
    </>
  );
}

function ByMonth() {
  return <Revenue {...useSuspenseQuery(months()).data} />;
}

function ByYear() {
  return <Revenue {...useSuspenseQuery(revenueYearsQuery).data} byYear />;
}

const REVENUE_VIEWS = ["months", "years"] as const;

function Revenue({
  currency,
  current,
  summaries,
  charges,
  properties,
  byYear = false,
}: {
  currency: string;
  current: string;
  summaries: MonthSummary[];
  charges: Charge[];
  properties: Property[];
  byYear?: boolean;
}) {
  const { locale, m, fmt } = useI18n("revenue");
  const t = m.revenue;
  const view = byYear ? "years" : "months";
  if (properties.length === 0) {
    return <EmptyState title={t.empty.title}>{t.empty.body}</EmptyState>;
  }
  // The month or year we are in: its figures head the card and its costs are listed.
  const thisMonth = summaries.find((summary) => summary.month === current) ?? summaries[0];
  const money = (value: number) => fmt.money(value, currency, { cents: false });
  const monthName = (month: string) => (byYear ? month : formatMonth(month, "long", INTL_LOCALE[locale]));

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.main)}>
        <Card>
          <div {...stylex.props(styles.head, styles.split)}>
            <div {...stylex.props(styles.headText)}>
              <SectionTitle>{byYear ? t.years.title : t.months.title}</SectionTitle>
              <p {...stylex.props(styles.hint)}>
                {(byYear ? t.years : t.months).summary(
                  monthName(current),
                  money(thisMonth.gross),
                  money(thisMonth.charges),
                  thisMonth.estimated > 0 ? money(thisMonth.estimated) : null,
                )}
              </p>
            </div>
            <nav aria-label={t.view.label} {...stylex.props(styles.views)}>
              {REVENUE_VIEWS.map((option, index) => (
                <Link
                  key={option}
                  to="/revenue"
                  search={{ view: option === "years" ? "years" : undefined }}
                  aria-current={option === view ? "page" : undefined}
                  {...stylex.props(
                    buttonStyle({ size: "sm" }),
                    index === 0 ? styles.first : styles.next,
                    option === view && styles.chosen,
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
          <div {...stylex.props(styles.scroll)}>
            <table {...stylex.props(styles.table)}>
              <thead {...stylex.props(styles.columns)}>
                <tr>
                  <th scope="col" {...stylex.props(styles.column, styles.start)}>
                    {byYear ? t.years.year : t.months.month}
                  </th>
                  {byYear && (
                    <th scope="col" {...stylex.props(styles.column)}>
                      {t.years.stays}
                    </th>
                  )}
                  <th scope="col" {...stylex.props(styles.column)}>
                    {t.months.revenue}
                  </th>
                  <th scope="col" {...stylex.props(styles.column)}>
                    {t.months.costs}
                  </th>
                  <th scope="col" {...stylex.props(styles.column)}>
                    {t.months.net}
                  </th>
                  <th scope="col" {...stylex.props(styles.column)}>
                    {t.months.nights}
                  </th>
                  <th scope="col" {...stylex.props(styles.column, styles.end)}>
                    {t.months.occupancy}
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary) => (
                  <tr
                    key={summary.month}
                    {...stylex.props(styles.line, summary.month === current && styles.now)}
                  >
                    <th scope="row" {...stylex.props(styles.cell, styles.name, styles.start)}>
                      {t.months.label(monthName(summary.month))}
                      {byYear && summary.month === current && (
                        <span {...stylex.props(styles.below)}>{t.years.inProgress}</span>
                      )}
                    </th>
                    {byYear && <td {...stylex.props(styles.cell, styles.muted)}>{summary.arrivals}</td>}
                    <td {...stylex.props(styles.cell)}>{money(summary.gross)}</td>
                    <td {...stylex.props(styles.cell, styles.muted)}>{money(summary.charges)}</td>
                    <td {...stylex.props(styles.cell, styles.strong, summary.net < 0 && styles.loss)}>
                      {money(summary.net)}
                    </td>
                    <td {...stylex.props(styles.cell, styles.muted)}>{summary.bookedNights}</td>
                    <td {...stylex.props(styles.cell, styles.muted, styles.end)}>
                      {fmt.percent(summary.occupancy)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {thisMonth.chargeLines.length > 0 && (
          <Card>
            <div {...stylex.props(styles.head)}>
              <SectionTitle>{t.costsIn(monthName(current))}</SectionTitle>
            </div>
            <ul {...stylex.props(styles.list, styles.figures)}>
              {[...thisMonth.chargeLines]
                .sort((a, b) => b.amount - a.amount)
                .map((line) => (
                  <li key={line.id} {...stylex.props(styles.cost)}>
                    <span>
                      {line.label} <span {...stylex.props(styles.small)}>({t.category[line.category]})</span>
                    </span>
                    <span>{fmt.money(line.amount, currency)}</span>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </div>

      <Card>
        <div {...stylex.props(styles.head)}>
          <SectionTitle>{t.charges.title}</SectionTitle>
          <p {...stylex.props(styles.hint)}>{t.charges.hint}</p>
        </div>
        {charges.length > 0 ? (
          <ul {...stylex.props(styles.list)}>
            {charges.map((charge) => (
              <ChargeRow key={charge.id} charge={charge} properties={properties} currency={currency} />
            ))}
          </ul>
        ) : (
          <p {...stylex.props(styles.none)}>{t.charges.empty}</p>
        )}
        <ChargeForm properties={properties} />
      </Card>
    </div>
  );
}
