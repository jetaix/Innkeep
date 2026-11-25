import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ALTERNATIVES, CHECKED_ON, findAlternative } from "@/features/marketing/alternatives";
import { Sources } from "../../../features/marketing/sources";
import { readMessages, useI18n } from "../../../i18n";
import { pageHead, site } from "../../../site";
import { color, font } from "../../../tokens.stylex";
import { buttonStyle } from "../../../ui/button";

export const Route = createFileRoute("/_site/alternatives/$slug")({
  loader: ({ params }) => {
    if (!findAlternative(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const product = findAlternative(params.slug);
    if (!product) return {};
    const t = readMessages("alternatives").alternatives.vs;
    return pageHead({
      title: t.title(product.name),
      description: t.description(product.name),
      path: `/alternatives/${product.slug}`,
    });
  },
  component: ComparisonPage,
});

const SMALL = "@media (min-width: 40rem)";
const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  main: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  top: { paddingTop: { default: "3rem", [SMALL]: "4rem" }, paddingBottom: "2rem" },
  back: { margin: 0, fontSize: "0.8125rem" },
  backLink: { color: { default: color.muted, ":hover": color.ink }, textUnderlineOffset: 2 },
  heading: {
    maxWidth: "20ch",
    margin: "1rem 0 0",
    fontFamily: font.display,
    fontSize: { default: "2.25rem", [SMALL]: "3.75rem" },
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    textWrap: "balance",
  },
  lead: {
    maxWidth: "60ch",
    margin: "1.25rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
  },
  sides: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [WIDE]: "1fr 1fr" },
    gap: 1,
    overflow: "hidden",
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
  sideBody: { margin: "0.5rem 0 0", color: color.muted, fontSize: "0.9375rem", lineHeight: 1.625 },
  section: { paddingTop: "3rem" },
  priceNote: { margin: "0 0 0.75rem", color: color.muted, fontSize: "0.8125rem" },
  // The table is wider than a phone: it scrolls inside its own frame.
  scroller: {
    position: "relative",
    overflowX: "auto",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: "0.75rem",
  },
  table: {
    width: "100%",
    minWidth: "40rem",
    borderCollapse: "collapse",
    borderSpacing: 0,
    fontSize: "0.875rem",
    textAlign: "start",
  },
  head: { color: color.muted, fontSize: "0.75rem" },
  corner: { padding: "0.75rem 1rem" },
  column: { width: "38%", padding: "0.75rem 1rem", fontWeight: 500, textAlign: "start" },
  row: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    lineHeight: 1.625,
  },
  label: {
    padding: "0.75rem 1rem",
    color: color.muted,
    fontSize: "0.8125rem",
    fontWeight: 400,
    textAlign: "start",
    verticalAlign: "top",
  },
  cell: { padding: "0.75rem 1rem", verticalAlign: "top" },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.5rem",
    fontWeight: 400,
    lineHeight: 1.333,
    letterSpacing: "-0.025em",
  },
  note: {
    maxWidth: "75ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
  checked: {
    maxWidth: "80ch",
    margin: "1rem 0 0",
    padding: "0.75rem 1rem",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: "0.5rem",
    color: color.muted,
    fontSize: "0.8125rem",
    lineHeight: 1.625,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" },
  others: { paddingTop: "4rem" },
  otherList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    margin: "1rem 0 0",
    padding: 0,
    listStyle: "none",
  },
});

function ComparisonPage() {
  const product = findAlternative(Route.useParams().slug);
  const { m, fmt } = useI18n("alternatives");
  if (!product) return null;
  const t = m.alternatives;
  const theirs = t.products[product.slug];
  const ours = t.innkeep;
  const date = fmt.date(CHECKED_ON, { day: "numeric", month: "long", year: "numeric" });
  const rows = (
    ["segment", "price", "free", "connection", "inbox", "automation", "site", "license", "drawback"] as const
  ).map((key) => ({ label: t.columns[key], theirs: theirs[key], ours: ours[key] }));

  return (
    <main {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.top)}>
        <p {...stylex.props(styles.back)}>
          <Link to="/alternatives" {...stylex.props(styles.backLink)}>
            {t.nav.all}
          </Link>
        </p>
        <h1 {...stylex.props(styles.heading)}>{t.vs.title(product.name)}</h1>
        <p {...stylex.props(styles.lead)}>{t.vs.lead}</p>
      </section>

      <div {...stylex.props(styles.sides)}>
        <div {...stylex.props(styles.side)}>
          <h2 {...stylex.props(styles.sideTitle)}>{t.vs.chooseThem(product.name)}</h2>
          <p {...stylex.props(styles.sideBody)}>{theirs.chooseThem}</p>
        </div>
        <div {...stylex.props(styles.side)}>
          <h2 {...stylex.props(styles.sideTitle)}>{t.vs.chooseInnkeep}</h2>
          <p {...stylex.props(styles.sideBody)}>{theirs.chooseInnkeep}</p>
        </div>
      </div>

      <section {...stylex.props(styles.section)}>
        <p {...stylex.props(styles.priceNote)}>{t.priceNote}</p>
        <div {...stylex.props(styles.scroller)}>
          <table {...stylex.props(styles.table)}>
            <thead {...stylex.props(styles.head)}>
              <tr>
                <td {...stylex.props(styles.corner)} />
                <th scope="col" {...stylex.props(styles.column)}>
                  {product.name}
                </th>
                <th scope="col" {...stylex.props(styles.column)}>
                  {t.vs.innkeep}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} {...stylex.props(styles.row)}>
                  <th scope="row" {...stylex.props(styles.label)}>
                    {row.label}
                  </th>
                  <td {...stylex.props(styles.cell)}>{row.theirs}</td>
                  <td {...stylex.props(styles.cell)}>{row.ours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section {...stylex.props(styles.section)}>
        <h2 {...stylex.props(styles.title)}>{t.vs.notes(product.name)}</h2>
        <p {...stylex.props(styles.note)}>{theirs.note}</p>
        <p {...stylex.props(styles.checked)}>{t.checked(date)}</p>
        <div {...stylex.props(styles.actions)}>
          <a href={site.repo} {...stylex.props(buttonStyle({ variant: "primary", size: "lg" }))}>
            {t.vs.tryInnkeep}
          </a>
          <a href={product.url} rel="noreferrer nofollow" {...stylex.props(buttonStyle({ size: "lg" }))}>
            {t.vs.visit(product.name)}
          </a>
        </div>
      </section>

      <Sources title={t.sources.title} intro={t.sources.intro(date)} sources={product.sources} />

      <section {...stylex.props(styles.others)}>
        <h2 {...stylex.props(styles.title)}>{t.vs.others}</h2>
        <ul {...stylex.props(styles.otherList)}>
          {ALTERNATIVES.filter((other) => other.slug !== product.slug).map((other) => (
            <li key={other.slug}>
              <Link
                to="/alternatives/$slug"
                params={{ slug: other.slug }}
                {...stylex.props(buttonStyle({ size: "sm" }))}
              >
                {t.compare(other.name)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
