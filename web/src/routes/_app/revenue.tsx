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
import { color, radius, shadow, text } from "../../tokens.stylex";
import { Card, EmptyState, PageHeader, SectionTitle } from "../../ui/primitives";
import { figureStyle } from "../../ui/slab";

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

const WIDE = "@media (min-width: 40rem)";
const XL = "@media (min-width: 80rem)";

const styles = stylex.create({
  page: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [XL]: "minmax(0, 1.6fr) minmax(0, 1fr)" },
    alignItems: "start",
    columnGap: "2.5rem",
    rowGap: "2rem",
    maxWidth: "76rem",
  },
  main: { display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 },
  // The one lifted panel of the page: what the month pays, and the months around it.
  pays: {
    padding: { default: "1.25rem", [WIDE]: "1.75rem" },
    borderRadius: { default: radius.xl, [WIDE]: "28px" },
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  split: {
    display: "flex",
    // The switch goes above the figure when the two do not fit side by side.
    flexWrap: "wrap-reverse",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "1rem",
  },
  statement: { flexBasis: "18rem", flexGrow: 1, minWidth: 0, maxWidth: "36rem", margin: 0, fontWeight: 400 },
  figure: { display: "block", fontSize: { default: "3rem", [WIDE]: "4rem" } },
  loss: { color: color.critical },
  sentence: {
    display: "block",
    marginTop: "0.5rem",
    color: color.muted,
    fontSize: text.md,
    lineHeight: 1.55,
    textWrap: "pretty",
  },
  // Two views of the same figures, side by side in one pill.
  views: {
    display: "flex",
    flexShrink: 0,
    padding: "0.1875rem",
    borderRadius: radius.full,
    backgroundColor: color.sunken,
  },
  view: {
    display: "flex",
    alignItems: "center",
    height: "1.75rem",
    paddingInline: "0.75rem",
    borderRadius: radius.full,
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "background-color, box-shadow, color",
    transitionDuration: "200ms",
  },
  chosen: { backgroundColor: color.panel, color: color.ink, boxShadow: shadow.card },
  head: {
    padding: "0.875rem 1.25rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  hint: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.base, lineHeight: 1.5 },
  scroll: { position: "relative", overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "start",
    fontSize: text.md,
    fontVariantNumeric: "tabular-nums",
  },
  caption: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  columns: { color: color.muted, fontSize: text.sm },
  column: { padding: "0.75rem 0.75rem 0.625rem", fontWeight: 500, textAlign: "end", whiteSpace: "nowrap" },
  line: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  cell: { padding: "0.5625rem 0.75rem", textAlign: "end", whiteSpace: "nowrap" },
  name: { fontWeight: 500, textAlign: "start" },
  start: { paddingInlineStart: "1.25rem", textAlign: "start" },
  end: { paddingInlineEnd: "1.25rem" },
  muted: { color: color.muted },
  strong: { fontWeight: 500 },
  // A month with no stay in it: present, and quiet.
  quiet: { color: color.muted, fontWeight: 400 },
  // The month we are in is told by weight and by words, not by a grey block.
  now: { color: color.ink, fontWeight: 600 },
  below: { display: "block", color: color.muted, fontSize: text.sm, fontWeight: 400 },
  list: { margin: 0, padding: 0, listStyle: "none" },
  figures: { fontVariantNumeric: "tabular-nums" },
  cost: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.5625rem 1.25rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  small: { color: color.muted, fontSize: text.sm },
  // The charges are read and edited on the ground itself: ink and hairlines, no panel.
  aside: { minWidth: 0 },
  asideHead: { paddingBottom: "0.875rem" },
  ruled: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.lineStrong },
  none: { margin: 0, paddingBlock: "1rem", color: color.muted, lineHeight: 1.55 },
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

  // A month with no stay and no revenue is listed, quietly.
  const empty = (summary: MonthSummary) => summary.gross === 0 && summary.bookedNights === 0;

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.main)}>
        <section {...stylex.props(styles.pays)}>
          <div {...stylex.props(styles.split)}>
            <h2 {...stylex.props(styles.statement)}>
              <span {...stylex.props(figureStyle, styles.figure, thisMonth.net < 0 && styles.loss)}>
                {money(thisMonth.net)}
              </span>
              <span {...stylex.props(styles.sentence)}>
                {t.months.leaves(
                  monthName(current),
                  money(thisMonth.gross),
                  money(thisMonth.charges),
                  thisMonth.estimated > 0 ? money(thisMonth.estimated) : null,
                )}
              </span>
            </h2>
            <nav aria-label={t.view.label} {...stylex.props(styles.views)}>
              {REVENUE_VIEWS.map((option) => (
                <Link
                  key={option}
                  to="/revenue"
                  search={{ view: option === "years" ? "years" : undefined }}
                  aria-current={option === view ? "page" : undefined}
                  {...stylex.props(styles.view, option === view && styles.chosen)}
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
        </section>

        <Card>
          <div {...stylex.props(styles.scroll)}>
            <table {...stylex.props(styles.table)}>
              <caption {...stylex.props(styles.caption)}>{byYear ? t.years.title : t.months.title}</caption>
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
                {summaries.map((summary) => {
                  const isNow = summary.month === current;
                  const quiet = empty(summary) && !isNow;
                  return (
                    <tr
                      key={summary.month}
                      aria-current={isNow ? "date" : undefined}
                      {...stylex.props(styles.line)}
                    >
                      <th
                        scope="row"
                        {...stylex.props(
                          styles.cell,
                          styles.name,
                          styles.start,
                          quiet && styles.quiet,
                          isNow && styles.now,
                        )}
                      >
                        {t.months.label(monthName(summary.month))}
                        {isNow && (
                          <span {...stylex.props(styles.below)}>
                            {byYear ? t.years.inProgress : t.months.now}
                          </span>
                        )}
                      </th>
                      {byYear && <td {...stylex.props(styles.cell, styles.muted)}>{summary.arrivals}</td>}
                      <td {...stylex.props(styles.cell, quiet && styles.quiet, isNow && styles.now)}>
                        {money(summary.gross)}
                      </td>
                      <td {...stylex.props(styles.cell, styles.muted)}>{money(summary.charges)}</td>
                      <td
                        {...stylex.props(
                          styles.cell,
                          styles.strong,
                          quiet && styles.quiet,
                          isNow && styles.now,
                          // A loss is a state only where there were stays to pay for it.
                          !quiet && summary.net < 0 && styles.loss,
                        )}
                      >
                        {money(summary.net)}
                      </td>
                      <td {...stylex.props(styles.cell, styles.muted)}>{summary.bookedNights}</td>
                      <td {...stylex.props(styles.cell, styles.muted, styles.end)}>
                        {fmt.percent(summary.occupancy)}
                      </td>
                    </tr>
                  );
                })}
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

      <section {...stylex.props(styles.aside)}>
        <div {...stylex.props(styles.asideHead)}>
          <SectionTitle>{t.charges.title}</SectionTitle>
          <p {...stylex.props(styles.hint)}>{t.charges.hint}</p>
        </div>
        {charges.length > 0 ? (
          <ul {...stylex.props(styles.list, styles.ruled)}>
            {charges.map((charge) => (
              <ChargeRow key={charge.id} charge={charge} properties={properties} currency={currency} />
            ))}
          </ul>
        ) : (
          <p {...stylex.props(styles.none, styles.ruled)}>{t.charges.empty}</p>
        )}
        <ChargeForm properties={properties} />
      </section>
    </div>
  );
}
