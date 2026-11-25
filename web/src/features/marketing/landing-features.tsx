import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Glass, GlassField, Panel, type Tint } from "../../brand/glass";
import { useI18n } from "../../i18n";
import { color, font } from "../../tokens.stylex";
import { Badge } from "../../ui/primitives";
import { kit } from "./landing-kit";
import { SourceLogo } from "./source-logos";

// StyleX reads a media query only from the file that uses it.
const MD = "@media (min-width: 48rem)";
const SM = "@media (min-width: 40rem)";

const styles = stylex.create({
  lead: { maxWidth: "58ch", marginInline: "auto" },
  features: {
    display: "flex",
    flexDirection: "column",
    gap: { default: "6rem", [SM]: "9rem" },
    marginTop: { default: "5rem", [SM]: "7rem" },
  },
  note: { margin: "2.5rem 0 0", color: color.muted, fontSize: "0.8125rem", textAlign: "center" },
  feature: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [MD]: "minmax(0, 1fr) minmax(0, 1.25fr)" },
    alignItems: "center",
    gap: { default: "2rem", [MD]: "4rem" },
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.875rem", [SM]: "2.25rem" },
    fontWeight: 400,
    lineHeight: 1.08,
    letterSpacing: "-0.025em",
    textWrap: "balance",
  },
  body: {
    maxWidth: "48ch",
    margin: "1.25rem 0 0",
    color: color.muted,
    fontSize: { default: "1rem", [SM]: "1.0625rem" },
    lineHeight: 1.625,
  },
  field: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    placeItems: "center",
    minHeight: { default: "20rem", [SM]: "26rem" },
    padding: { default: "1.25rem", [SM]: "3rem" },
    borderRadius: "1.75rem",
  },
  // The far shape is softer.
  far: { filter: "blur(2px)" },
  card: {
    width: "100%",
    maxWidth: "28rem",
    minWidth: 0,
    padding: { default: "1.25rem", [SM]: "1.75rem" },
    borderRadius: "1rem",
    fontSize: "0.875rem",
    lineHeight: 1.4286,
  },

  rows: {
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  row: { display: "flex", alignItems: "center", gap: "0.625rem" },
  dot: { flexShrink: 0, width: "0.625rem", height: "0.625rem", borderRadius: "999px" },
  name: { flexGrow: 1, flexShrink: 1, flexBasis: "0%", fontWeight: 500 },
  detail: { color: color.muted, fontSize: "0.8125rem", textAlign: "right" },

  plain: { margin: 0, padding: 0, listStyle: "none" },
  first: { paddingBottom: "1rem" },
  middle: { paddingBlock: "1rem" },
  final: { paddingTop: "1rem" },
  divided: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: color.line },
  day: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    columnGap: "0.75rem",
    margin: 0,
  },
  strong: { fontWeight: 500 },
  small: { fontSize: "0.8125rem" },
  good: { color: color.good },
  warn: { color: color.warn },
  muted: { color: color.muted },
  under: { margin: "0.25rem 0 0", color: color.muted, fontSize: "0.8125rem" },
  quoteLabel: { margin: 0, color: color.muted, fontSize: "0.8125rem" },
  quote: { margin: "0.25rem 0 0", lineHeight: 1.625 },

  sums: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    rowGap: "0.625rem",
    margin: 0,
    fontVariantNumeric: "tabular-nums",
  },
  amount: { margin: 0, textAlign: "right" },
  total: {
    marginTop: "0.25rem",
    paddingTop: "0.75rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  net: { fontFamily: font.display, fontSize: "1.5rem", lineHeight: 1.3333 },

  suggestion: { display: "flex", alignItems: "flex-start", gap: "0.625rem" },
  shrinks: { minWidth: 0 },

  talk: { display: "flex", flexDirection: "column", gap: "1rem" },
  who: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "1.25rem",
    rowGap: "0.5rem",
    margin: 0,
    fontWeight: 500,
  },
  assistant: { display: "flex", alignItems: "center", gap: "0.5rem" },
  exchange: {
    margin: 0,
    paddingTop: "1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    lineHeight: 1.625,
  },
  moreLink: { display: "inline-block", alignSelf: "flex-start", fontWeight: 500 },
});

const sources = stylex.create({
  airbnb: { backgroundColor: color.airbnb },
  booking: { backgroundColor: color.booking },
  direct: { backgroundColor: color.direct },
});

type Shape = "arch" | "pill" | "tile";

// The near shape of each field, by its own form.
const shapes = stylex.create({
  arch: { right: "-2.5rem", bottom: "-6rem", width: "15rem", height: "26rem", rotate: "14deg" },
  pill: { top: "-3rem", right: "-6rem", width: "26rem", height: "10rem", rotate: "-12deg" },
  tile: { right: "-4rem", bottom: "-5rem", width: "20rem", height: "20rem", rotate: "12deg" },
});

/** The far, softer shape of each field: a different place every time. */
const echoes = stylex.create({
  arch: { top: "-2rem", left: "12%", width: "12rem", height: "5rem", rotate: "-6deg" },
  pill: { bottom: "-4rem", left: "-2.5rem", width: "11rem", height: "11rem", rotate: "20deg" },
  tile: { top: "-7rem", left: "38%", width: "9rem", height: "14rem", rotate: "32deg" },
});
const ECHO_SHAPE = { arch: "pill", pill: "tile", tile: "arch" } as const;

/** What Innkeep does, one reading at a time. */
export function LandingFeatures() {
  const { m, fmt } = useI18n("marketing", "cleaning");
  const f = m.marketing.features;
  const euros = (amount: number) => fmt.money(amount * 100, "EUR", { cents: false });

  return (
    <section id="features" {...stylex.props(kit.section)}>
      <div {...stylex.props(kit.intro)}>
        <h2 {...stylex.props(kit.h2)}>{f.title}</h2>
        <p {...stylex.props(kit.lead, styles.lead)}>{f.intro}</p>
      </div>

      <div {...stylex.props(styles.features)}>
        <Feature title={f.sync.title} body={f.sync.body} glass="coral" shape="arch">
          <ul {...stylex.props(styles.rows)}>
            <SyncRow
              source="airbnb"
              name={m.common.sources.airbnb}
              detail={f.sync.synced(fmt.timeAgo(0, 4 * 60_000))}
            />
            <SyncRow
              source="booking"
              name={m.common.sources.booking}
              detail={f.sync.synced(fmt.timeAgo(0, 4 * 60_000))}
            />
            <SyncRow source="direct" name={f.sync.direct} detail={f.sync.shared} />
          </ul>
        </Feature>

        <Feature title={f.cleaning.title} body={f.cleaning.body} glass="blue" shape="tile">
          <ul {...stylex.props(styles.plain)}>
            <li {...stylex.props(styles.first)}>
              <p {...stylex.props(styles.day)}>
                <span {...stylex.props(styles.strong)}>
                  {fmt.date("2026-11-12", { weekday: "short", day: "numeric", month: "short" })} · Canal Loft
                </span>
                <span {...stylex.props(styles.small, styles.good)}>
                  {f.cleaning.cleaner} · {m.cleaning.request.status.confirmed}
                </span>
              </p>
              <p {...stylex.props(styles.under)}>{m.cleaning.row.sameDay("11:00", "16:00", 5)}</p>
            </li>
            <li {...stylex.props(styles.middle, styles.divided)}>
              <p {...stylex.props(styles.day)}>
                <span {...stylex.props(styles.strong)}>
                  {fmt.date("2026-11-17", { weekday: "short", day: "numeric", month: "short" })} · Harbour
                  Studio
                </span>
                <span {...stylex.props(styles.small, styles.warn)}>{m.cleaning.row.nobody}</span>
              </p>
              <p {...stylex.props(styles.under)}>
                {m.cleaning.row.from("11:00")} · {m.cleaning.row.days(2)}
              </p>
            </li>
            <li {...stylex.props(styles.final, styles.divided)}>
              <p {...stylex.props(styles.quoteLabel)}>{f.cleaning.message}</p>
              <p {...stylex.props(styles.quote)}>
                {f.cleaning.request(
                  "Canal Loft",
                  fmt.date("2026-11-12", { weekday: "long", day: "numeric", month: "long" }),
                  "11:00",
                  "16:00",
                )}
              </p>
            </li>
          </ul>
        </Feature>

        <Feature title={f.money.title} body={f.money.body} glass="green" shape="pill">
          <dl {...stylex.props(styles.sums)}>
            <dt {...stylex.props(styles.muted)}>{f.money.revenue(m.common.count.nights(28))}</dt>
            <dd {...stylex.props(styles.amount)}>{euros(4609)}</dd>
            <dt {...stylex.props(styles.muted)}>{f.money.cleaning(m.common.count.stays(9))}</dt>
            <dd {...stylex.props(styles.amount)}>−{euros(495)}</dd>
            <dt {...stylex.props(styles.muted)}>{f.money.commission}</dt>
            <dd {...stylex.props(styles.amount)}>−{euros(324)}</dd>
            <dt {...stylex.props(styles.muted)}>{f.money.bills}</dt>
            <dd {...stylex.props(styles.amount)}>−{euros(250)}</dd>
            <dt {...stylex.props(styles.total, styles.strong)}>{f.money.net}</dt>
            <dd {...stylex.props(styles.amount, styles.total, styles.net)}>{euros(3540)}</dd>
          </dl>
        </Feature>

        <Feature title={f.suggestions.title} body={f.suggestions.body} glass="overlap" shape="arch">
          <ul {...stylex.props(styles.rows)}>
            {f.suggestions.rows.map((row) => (
              <li key={row.text} {...stylex.props(styles.suggestion)}>
                <Badge tone={row.tone}>{row.label}</Badge>
                <span {...stylex.props(styles.shrinks)}>{row.text}</span>
              </li>
            ))}
          </ul>
        </Feature>

        <Feature title={f.keyboard.title} body={f.keyboard.body} glass="blue" shape="pill">
          <div {...stylex.props(styles.talk)}>
            <p {...stylex.props(styles.who)}>
              <span {...stylex.props(styles.assistant)}>
                <SourceLogo name="claude" />
                Claude
              </span>
            </p>
            <p {...stylex.props(styles.exchange)}>
              <span {...stylex.props(styles.muted)}>{f.keyboard.you}</span> {f.keyboard.request}
              <br />
              <span {...stylex.props(styles.muted)}>{f.keyboard.assistant}</span> {f.keyboard.answer}
            </p>
            <Link to="/ai" {...stylex.props(kit.link, styles.moreLink)}>
              {f.keyboard.more}
            </Link>
          </div>
        </Feature>
      </div>
      <p {...stylex.props(styles.note)}>{f.note}</p>
    </section>
  );
}

/** One reading per panel: the text states it, the white card shows it over a field of its colour. */
function Feature({
  title,
  body,
  glass,
  shape,
  children,
}: {
  title: string;
  body: string;
  glass: Tint;
  shape: Shape;
  children: ReactNode;
}) {
  return (
    <article {...stylex.props(styles.feature)}>
      <div>
        <h3 {...stylex.props(styles.title)}>{title}</h3>
        <p {...stylex.props(styles.body)}>{body}</p>
      </div>
      <GlassField tint={glass} xstyle={styles.field}>
        <Glass tint={glass} shape={shape} plane="view" drift={-36} xstyle={[kit.behind, shapes[shape]]} />
        <Glass
          tint={glass}
          shape={ECHO_SHAPE[shape]}
          plane="view"
          opacity={0.5}
          xstyle={[kit.behind, styles.far, echoes[shape]]}
        />
        <Panel xstyle={styles.card}>{children}</Panel>
      </GlassField>
    </article>
  );
}

function SyncRow({ source, name, detail }: { source: keyof typeof sources; name: string; detail: string }) {
  return (
    <li {...stylex.props(styles.row)}>
      <span aria-hidden {...stylex.props(styles.dot, sources[source])} />
      <span {...stylex.props(styles.name)}>{name}</span>
      <span {...stylex.props(styles.detail)}>{detail}</span>
    </li>
  );
}
