import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GUIDE_SLUGS } from "@/features/marketing/guides";
import { readMessages, useI18n } from "../../../i18n";
import { pageHead } from "../../../site";
import { color, font } from "../../../tokens.stylex";

export const Route = createFileRoute("/_site/guides/")({
  head: () => {
    const t = readMessages("guides").guides;
    return pageHead({ title: t.heading, description: t.description, path: "/guides" });
  },
  component: GuidesPage,
});

const SMALL = "@media (min-width: 40rem)";

const styles = stylex.create({
  main: {
    maxWidth: "56rem",
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  header: { paddingTop: { default: "4rem", [SMALL]: "6rem" }, paddingBottom: "3rem" },
  heading: {
    maxWidth: "18ch",
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "2.25rem", [SMALL]: "3.75rem" },
    fontWeight: 400,
    lineHeight: 1.04,
    letterSpacing: "-0.03em",
    textWrap: "balance",
  },
  intro: {
    maxWidth: "60ch",
    margin: "1.5rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  item: { borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: color.line },
  link: {
    display: "block",
    paddingBlock: "2rem",
    borderRadius: "0.75rem",
    color: color.ink,
    textDecoration: "none",
  },
  title: {
    maxWidth: "32ch",
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.5rem", [SMALL]: "1.875rem" },
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
    textWrap: "balance",
    // Underlined while any part of its link is under the pointer.
    textDecorationLine: { default: "none", [stylex.when.ancestor(":hover")]: "underline" },
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 4,
  },
  description: {
    maxWidth: "68ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
});

function GuidesPage() {
  const t = useI18n("guides").m.guides;
  return (
    <main {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.heading)}>{t.heading}</h1>
        <p {...stylex.props(styles.intro)}>{t.intro}</p>
      </header>

      <ul {...stylex.props(styles.list)}>
        {GUIDE_SLUGS.map((slug) => (
          <li key={slug} {...stylex.props(styles.item)}>
            <Link to="/guides/$slug" params={{ slug }} {...stylex.props(styles.link, stylex.defaultMarker())}>
              <h2 {...stylex.props(styles.title)}>{t.guides[slug].title}</h2>
              <p {...stylex.props(styles.description)}>{t.guides[slug].description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
