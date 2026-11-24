import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { overviewQuery, sessionQuery } from "../api/queries";
import { color } from "../tokens.stylex";

export const Route = createFileRoute("/overview")({
  // Started while this route's code downloads; the component reads the same queries.
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(sessionQuery);
    return queryClient.ensureQueryData(overviewQuery);
  },
  component: OverviewPage,
});

const styles = stylex.create({
  main: { maxWidth: "64rem", marginInline: "auto", padding: "1.5rem 1rem 5rem" },
  banner: {
    padding: "0.5rem 1rem",
    backgroundColor: color.subtle,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
    fontSize: "0.8125rem",
  },
  title: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 },
  muted: { color: color.muted, margin: "0.25rem 0 1.5rem" },
  figures: {
    display: "grid",
    gridTemplateColumns: { default: "1fr 1fr", "@media (min-width: 64rem)": "repeat(4, 1fr)" },
    gap: 1,
    margin: 0,
    backgroundColor: color.line,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: 8,
    overflow: "hidden",
  },
  figure: { backgroundColor: color.bg, padding: "1rem" },
  label: { color: color.muted, fontSize: "0.8125rem" },
  value: { margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" },
  list: { margin: "1.5rem 0 0", padding: 0, listStyle: "none" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.75rem 0",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  link: { color: color.ink, textUnderlineOffset: 2 },
});

function OverviewPage() {
  return (
    <>
      <Suspense>
        <DemoBanner />
      </Suspense>
      <main {...stylex.props(styles.main)}>
        <Overview />
      </main>
    </>
  );
}

/** A secondary panel with its own boundary: the page does not wait for it. */
function DemoBanner() {
  const { data } = useSuspenseQuery(sessionQuery);
  if (!data.demo) return null;
  return (
    <p role="status" {...stylex.props(styles.banner)}>
      This is a demo with example bookings.{" "}
      <Link to="/login" preload={false} {...stylex.props(styles.link)}>
        Sign in
      </Link>
    </p>
  );
}

function Overview() {
  const { data } = useSuspenseQuery(overviewQuery);
  const money = new Intl.NumberFormat("en", { style: "currency", currency: data.currency, maximumFractionDigits: 0 });
  return (
    <>
      <h1 {...stylex.props(styles.title)}>Overview</h1>
      <p {...stylex.props(styles.muted)}>
        {data.properties} {data.properties === 1 ? "property" : "properties"}, {data.arrivingToday} arriving today.
      </p>
      <dl {...stylex.props(styles.figures)}>
        {data.months.map((month) => (
          <div key={month.month} {...stylex.props(styles.figure)}>
            <dt {...stylex.props(styles.label)}>Net, {month.month}</dt>
            <dd {...stylex.props(styles.value)}>{money.format(month.net / 100)}</dd>
          </div>
        ))}
        <div {...stylex.props(styles.figure)}>
          <dt {...stylex.props(styles.label)}>Booked, next 30 days</dt>
          <dd {...stylex.props(styles.value)}>{Math.round(data.occupancy * 100)}%</dd>
        </div>
        <div {...stylex.props(styles.figure)}>
          <dt {...stylex.props(styles.label)}>To handle</dt>
          <dd {...stylex.props(styles.value)}>{data.urgent}</dd>
        </div>
      </dl>
      <ul {...stylex.props(styles.list)}>
        {data.upcoming.map((stay) => (
          <li key={stay.id} {...stylex.props(styles.row)}>
            <span>
              {stay.guest ?? stay.property} · {stay.property}
            </span>
            <span {...stylex.props(styles.label)}>
              {stay.checkIn} to {stay.checkOut}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
