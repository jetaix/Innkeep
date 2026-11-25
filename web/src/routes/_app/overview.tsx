import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { overviewQuery } from "../../api/queries";
import { loadMessages, useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Card, PageHeader, SectionTitle } from "../../ui/primitives";

export const Route = createFileRoute("/_app/overview")({
  // Started while this route's code downloads; the component reads the same query.
  loader: ({ context: { queryClient } }) => {
    void loadMessages("overview");
    return queryClient.ensureQueryData(overviewQuery);
  },
  component: Overview,
});

const WIDE = "@media (min-width: 64rem)";

const styles = stylex.create({
  figures: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", "@media (min-width: 30rem)": "1fr 1fr", [WIDE]: "repeat(4, 1fr)" },
    gap: 1,
    margin: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.lg,
    backgroundColor: color.line,
  },
  figure: { padding: "1rem", backgroundColor: color.bg },
  label: { color: color.muted, fontSize: text.base },
  value: {
    margin: "0.25rem 0 0",
    fontSize: "1.5rem",
    fontWeight: 600,
    letterSpacing: "-0.025em",
    fontVariantNumeric: "tabular-nums",
  },
  section: { marginTop: "1.5rem" },
  heading: { padding: "0.75rem 1rem" },
  list: { margin: 0, padding: 0, listStyle: "none" },
  row: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    columnGap: "1rem",
    padding: "0.75rem 1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    fontSize: text.base,
  },
  empty: { margin: 0, padding: "0 1rem 1rem", color: color.muted, fontSize: text.base },
});

/** The figures and the next arrivals. The lists and the welcome of the full page come with the next phase. */
function Overview() {
  const { m, fmt } = useI18n("overview");
  const t = m.overview;
  const { data } = useSuspenseQuery(overviewQuery);
  return (
    <>
      <PageHeader title={t.title} description={t.stats.acrossProperties(data.properties)} />
      <dl {...stylex.props(styles.figures)}>
        {data.months.map((month) => (
          <div key={month.month} {...stylex.props(styles.figure)}>
            <dt {...stylex.props(styles.label)}>
              {t.stats.netRevenue(fmt.date(`${month.month}-01`, { month: "long" }))}
            </dt>
            <dd {...stylex.props(styles.value)}>{fmt.money(month.net, data.currency, { cents: false })}</dd>
          </div>
        ))}
        <div {...stylex.props(styles.figure)}>
          <dt {...stylex.props(styles.label)}>{t.stats.booked}</dt>
          <dd {...stylex.props(styles.value)}>{fmt.percent(data.occupancy)}</dd>
        </div>
        <div {...stylex.props(styles.figure)}>
          <dt {...stylex.props(styles.label)}>{t.stats.needsAttention}</dt>
          <dd {...stylex.props(styles.value)}>{data.urgent}</dd>
        </div>
      </dl>
      <Card xstyle={styles.section}>
        <SectionTitle xstyle={styles.heading}>{t.reservations.title}</SectionTitle>
        {data.upcoming.length === 0 ? (
          <p {...stylex.props(styles.empty)}>{t.reservations.empty}</p>
        ) : (
          <ul {...stylex.props(styles.list)}>
            {data.upcoming.map((stay) => (
              <li key={stay.id} {...stylex.props(styles.row)}>
                <span>{stay.guest ? `${stay.guest} · ${stay.property}` : stay.property}</span>
                <span {...stylex.props(styles.label)}>
                  {fmt.date(stay.checkIn)} – {fmt.date(stay.checkOut)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
