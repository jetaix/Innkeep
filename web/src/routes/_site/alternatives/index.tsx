import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ALTERNATIVES, type Alternative, CHECKED_ON } from "@/features/marketing/alternatives";
import { Sources } from "../../../features/marketing/sources";
import { readMessages, useI18n } from "../../../i18n";
import { pageHead, site } from "../../../site";
import { color, font } from "../../../tokens.stylex";
import { Hidden } from "../../../ui/primitives";

export const Route = createFileRoute("/_site/alternatives/")({
  head: () => {
    const t = readMessages("alternatives").alternatives;
    return pageHead({ title: t.heading, description: t.description, path: "/alternatives" });
  },
  component: AlternativesPage,
});

const SMALL = "@media (min-width: 40rem)";
const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  main: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  top: { paddingTop: { default: "4rem", [SMALL]: "5rem" }, paddingBottom: "2.5rem" },
  heading: {
    maxWidth: "18ch",
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "2.25rem", [SMALL]: "3.75rem" },
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    textWrap: "balance",
  },
  intro: {
    maxWidth: "68ch",
    margin: "1.5rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
  },
  checked: {
    maxWidth: "80ch",
    margin: "1.5rem 0 0",
    padding: "0.75rem 1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: "0.5rem",
    color: color.muted,
    fontSize: "0.8125rem",
    lineHeight: 1.625,
  },
  group: { paddingTop: "3.5rem" },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.5rem",
    fontWeight: 400,
    lineHeight: 1.333,
    letterSpacing: "-0.025em",
  },
  groupIntro: {
    maxWidth: "75ch",
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
  priceNote: { margin: "0.25rem 0 0", color: color.muted, fontSize: "0.8125rem" },
  // The table is wider than a phone: it scrolls inside its own frame.
  scroller: {
    position: "relative",
    overflowX: "auto",
    marginTop: "1.5rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: "0.75rem",
  },
  table: {
    width: "100%",
    minWidth: "60rem",
    borderCollapse: "collapse",
    borderSpacing: 0,
    fontSize: "0.8125rem",
    textAlign: "start",
  },
  head: { color: color.muted, fontSize: "0.75rem" },
  column: { padding: "0.75rem 1rem", fontWeight: 500, textAlign: "start" },
  row: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    lineHeight: 1.625,
    verticalAlign: "top",
  },
  reference: { backgroundColor: color.subtle },
  name: {
    padding: "0.75rem 1rem",
    fontWeight: 500,
    textAlign: "start",
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },
  nameLink: { color: color.ink, textUnderlineOffset: 2 },
  cell: { padding: "0.75rem 1rem", verticalAlign: "top" },
  muted: { color: color.muted },
  nowrap: { whiteSpace: "nowrap" },
  others: { paddingTop: "4rem" },
  bullets: {
    margin: "1rem 0 0",
    paddingInlineStart: "1.25rem",
    listStyleType: "disc",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
  wideBullets: { maxWidth: "80ch" },
  sideBullets: { marginTop: "0.75rem" },
  bullet: { marginTop: { default: "0.5rem", ":first-child": 0 } },
  fit: { paddingTop: "5rem" },
  fitTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.875rem",
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: "-0.025em",
  },
  sides: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" },
    gap: 1,
    overflow: "hidden",
    marginTop: "2rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: "0.75rem",
    backgroundColor: color.line,
  },
  side: { padding: { default: "1.5rem", [SMALL]: "2rem" }, backgroundColor: color.bg },
  sideTitle: {
    margin: 0,
    fontSize: "1.125rem",
    fontWeight: 600,
    lineHeight: 1.556,
    letterSpacing: "-0.025em",
  },
});

function AlternativesPage() {
  const { m, fmt } = useI18n("alternatives");
  const t = m.alternatives;
  const date = fmt.date(CHECKED_ON, { day: "numeric", month: "long", year: "numeric" });
  const commercial = ALTERNATIVES.filter((alternative) => alternative.kind === "commercial");
  const openSource = ALTERNATIVES.filter((alternative) => alternative.kind === "open-source");

  return (
    <main {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.top)}>
        <h1 {...stylex.props(styles.heading)}>{t.heading}</h1>
        <p {...stylex.props(styles.intro)}>{t.intro}</p>
        <p {...stylex.props(styles.checked)}>{t.checked(date)}</p>
      </section>

      <Group title={t.kinds.commercial.title} intro={t.kinds.commercial.intro} products={commercial} />
      <Group title={t.kinds.openSource.title} intro={t.kinds.openSource.intro} products={openSource} />

      <section {...stylex.props(styles.others)}>
        <h2 {...stylex.props(styles.title)}>{t.otherOpenSource.title}</h2>
        <ul {...stylex.props(styles.bullets, styles.wideBullets)}>
          {t.otherOpenSource.items.map((item) => (
            <li key={item} {...stylex.props(styles.bullet)}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section {...stylex.props(styles.fit)}>
        <h2 {...stylex.props(styles.fitTitle)}>{t.fit.title}</h2>
        <div {...stylex.props(styles.sides)}>
          {[t.fit.stronger, t.fit.weaker].map((side) => (
            <div key={side.title} {...stylex.props(styles.side)}>
              <h3 {...stylex.props(styles.sideTitle)}>{side.title}</h3>
              <ul {...stylex.props(styles.bullets, styles.sideBullets)}>
                {side.items.map((item) => (
                  <li key={item} {...stylex.props(styles.bullet)}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Sources
        title={t.sources.title}
        intro={t.sources.intro(date)}
        sources={[...ALTERNATIVES.flatMap((alternative) => alternative.sources), ...t.sources.more]}
      />
    </main>
  );
}

/** One kind of product: Innkeep first as the reference row, then each alternative. */
function Group({ title, intro, products }: { title: string; intro: string; products: Alternative[] }) {
  const t = useI18n("alternatives").m.alternatives;
  const rows = [
    { key: "innkeep", name: site.name, slug: null, facts: t.innkeep },
    ...products.map((product) => ({
      key: product.slug,
      name: product.name,
      slug: product.slug,
      facts: t.products[product.slug],
    })),
  ];

  return (
    <section {...stylex.props(styles.group)}>
      <h2 {...stylex.props(styles.title)}>{title}</h2>
      <p {...stylex.props(styles.groupIntro)}>{intro}</p>
      <p {...stylex.props(styles.priceNote)}>{t.priceNote}</p>
      <div {...stylex.props(styles.scroller)}>
        <table {...stylex.props(styles.table)}>
          <thead {...stylex.props(styles.head)}>
            <tr>
              {[
                t.columns.product,
                t.columns.segment,
                t.columns.price,
                t.columns.connection,
                t.columns.license,
                t.columns.drawback,
              ].map((column) => (
                <th key={column} scope="col" {...stylex.props(styles.column)}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} {...stylex.props(styles.row, !row.slug && styles.reference)}>
                <th scope="row" {...stylex.props(styles.name)}>
                  {row.slug ? (
                    <Link
                      to="/alternatives/$slug"
                      params={{ slug: row.slug }}
                      {...stylex.props(styles.nameLink)}
                    >
                      {row.name}
                      <Hidden>: {t.compare(row.name)}</Hidden>
                    </Link>
                  ) : (
                    row.name
                  )}
                </th>
                <td {...stylex.props(styles.cell, styles.muted)}>{row.facts.segment}</td>
                <td {...stylex.props(styles.cell)}>{row.facts.price}</td>
                <td {...stylex.props(styles.cell, styles.muted)}>{row.facts.connection}</td>
                <td {...stylex.props(styles.cell, styles.muted, styles.nowrap)}>{row.facts.license}</td>
                <td {...stylex.props(styles.cell, styles.muted)}>{row.facts.drawback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
