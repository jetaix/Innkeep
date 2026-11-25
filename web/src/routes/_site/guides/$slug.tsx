import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { GUIDE_SLUGS, GUIDES_UPDATED_ON, isGuide } from "@/features/marketing/guides";
import { Glass, GlassField } from "../../../brand/glass";
import { pillStyle } from "../../../brand/pill";
import { readMessages, useI18n } from "../../../i18n";
import { pageHead, site, siteUrl } from "../../../site";
import { color, font } from "../../../tokens.stylex";

export const Route = createFileRoute("/_site/guides/$slug")({
  loader: ({ params }) => {
    if (!isGuide(params.slug)) throw notFound();
  },
  head: ({ params: { slug } }) => {
    if (!isGuide(slug)) return {};
    const guide = readMessages("guides").guides.guides[slug];
    const head = pageHead({
      title: guide.title,
      description: guide.description,
      path: `/guides/${slug}`,
      structured: structuredData(slug, guide.title, guide.description, guide.faq),
    });
    return {
      ...head,
      // A guide is an article, with the day it was last reviewed.
      meta: [
        ...head.meta.map((tag) =>
          "property" in tag && tag.property === "og:type" ? { ...tag, content: "article" } : tag,
        ),
        { property: "article:modified_time", content: GUIDES_UPDATED_ON },
      ],
    };
  },
  component: GuidePage,
});

/** Structured data for a guide: the article, its place in the site, and its questions. */
function structuredData(
  slug: string,
  title: string,
  description: string,
  faq: { question: string; answer: string }[],
) {
  const url = `${siteUrl}/guides/${slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      dateModified: GUIDES_UPDATED_ON,
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: site.name, url: site.repo },
      publisher: { "@type": "Organization", name: site.name, url: siteUrl },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.name, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Guides", item: `${siteUrl}/guides` },
        { "@type": "ListItem", position: 3, name: title, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ];
}

const SMALL = "@media (min-width: 40rem)";

const styles = stylex.create({
  main: {
    maxWidth: "48rem",
    marginInline: "auto",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
  },
  header: { paddingTop: { default: "3rem", [SMALL]: "5rem" }, paddingBottom: "2.5rem" },
  back: { margin: 0, fontSize: "0.8125rem" },
  backLink: { color: { default: color.muted, ":hover": color.ink }, textUnderlineOffset: 4 },
  heading: {
    margin: "1.25rem 0 0",
    fontFamily: font.display,
    fontSize: { default: "2.25rem", [SMALL]: "3.75rem" },
    fontWeight: 400,
    lineHeight: 1.05,
    letterSpacing: "-0.03em",
    textWrap: "balance",
  },
  lead: {
    maxWidth: "62ch",
    margin: "1.75rem 0 0",
    color: color.muted,
    fontSize: "1.25rem",
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  updated: { margin: "1.5rem 0 0", color: color.faint, fontSize: "0.8125rem" },
  section: { paddingTop: "3rem" },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "1.5rem", [SMALL]: "1.875rem" },
    fontWeight: 400,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  },
  balance: { textWrap: "balance" },
  paragraph: { maxWidth: "68ch", margin: "1rem 0 0", fontSize: "1.0625rem", lineHeight: 1.7 },
  steps: {
    maxWidth: "68ch",
    margin: "1.5rem 0 0",
    paddingInlineStart: "1.5rem",
    listStyleType: "decimal",
    fontSize: "1.0625rem",
    lineHeight: 1.6,
  },
  step: {
    marginTop: { default: "0.75rem", ":first-child": 0 },
    paddingInlineStart: "0.375rem",
    "::marker": { color: color.overlap, fontWeight: 500 },
  },
  questions: { paddingTop: "4rem" },
  answers: {
    margin: "1.5rem 0 0",
    borderBlockWidth: 1,
    borderBlockStyle: "solid",
    borderBlockColor: color.line,
  },
  pair: {
    paddingBlock: "1.5rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  question: { fontSize: "1.0625rem", fontWeight: 500 },
  answer: {
    maxWidth: "68ch",
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: "1rem",
    lineHeight: 1.625,
  },
  aside: { marginTop: "5rem" },
  field: { padding: { default: "1.75rem", [SMALL]: "2.5rem" }, borderRadius: "1.75rem" },
  slab: {
    display: { default: "none", [SMALL]: "block" },
    right: "-2rem",
    bottom: "-6rem",
    zIndex: -10,
    width: "11rem",
    height: "18rem",
    rotate: "12deg",
  },
  ctaTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.875rem",
    fontWeight: 400,
    lineHeight: 1.2,
    letterSpacing: "-0.025em",
  },
  ctaBody: {
    maxWidth: "50ch",
    margin: "0.75rem 0 0",
    color: color.muted,
    fontSize: "1rem",
    lineHeight: 1.625,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.75rem" },
  more: { paddingTop: "4rem" },
  moreTitle: { margin: 0, fontSize: "0.9375rem", fontWeight: 500 },
  moreList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.625rem",
    margin: "1rem 0 0",
    padding: 0,
    listStyle: "none",
    fontSize: "0.9375rem",
  },
  moreLink: {
    color: color.ink,
    textDecorationLine: "underline",
    textDecorationColor: { default: color.lineStrong, ":hover": color.ink },
    textUnderlineOffset: 4,
  },
});

function GuidePage() {
  const { slug } = Route.useParams();
  const { m, fmt } = useI18n("guides", "alternatives");
  if (!isGuide(slug)) return null;
  const t = m.guides;
  const guide = t.guides[slug];
  const date = fmt.date(GUIDES_UPDATED_ON, { day: "numeric", month: "long", year: "numeric" });

  return (
    <main {...stylex.props(styles.main)}>
      <article>
        <header {...stylex.props(styles.header)}>
          <p {...stylex.props(styles.back)}>
            <Link to="/guides" {...stylex.props(styles.backLink)}>
              {t.all}
            </Link>
          </p>
          <h1 {...stylex.props(styles.heading)}>{guide.title}</h1>
          <p {...stylex.props(styles.lead)}>{guide.lead}</p>
          <p {...stylex.props(styles.updated)}>
            <time dateTime={GUIDES_UPDATED_ON}>{t.updated(date)}</time>
          </p>
        </header>

        {guide.sections.map((section) => (
          <section key={section.heading} {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.title, styles.balance)}>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} {...stylex.props(styles.paragraph)}>
                {paragraph}
              </p>
            ))}
            {section.steps && (
              <ol {...stylex.props(styles.steps)}>
                {section.steps.map((step) => (
                  <li key={step} {...stylex.props(styles.step)}>
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}

        <section {...stylex.props(styles.questions)}>
          <h2 {...stylex.props(styles.title)}>{t.questions}</h2>
          <dl {...stylex.props(styles.answers)}>
            {guide.faq.map((item) => (
              <div key={item.question} {...stylex.props(styles.pair)}>
                <dt {...stylex.props(styles.question)}>{item.question}</dt>
                <dd {...stylex.props(styles.answer)}>{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </article>

      <aside {...stylex.props(styles.aside)}>
        <GlassField tint="blue" xstyle={styles.field}>
          <Glass tint="blue" xstyle={styles.slab} />
          <h2 {...stylex.props(styles.ctaTitle)}>{t.cta.title}</h2>
          <p {...stylex.props(styles.ctaBody)}>{t.cta.body}</p>
          <div {...stylex.props(styles.actions)}>
            <Link to="/" hash="access" {...stylex.props(pillStyle("primary", "lg"))}>
              {t.cta.install}
            </Link>
            <a href={site.repo} {...stylex.props(pillStyle("secondary", "lg"))}>
              {t.cta.demo}
            </a>
          </div>
        </GlassField>
      </aside>

      <nav aria-label={t.more} {...stylex.props(styles.more)}>
        <h2 {...stylex.props(styles.moreTitle)}>{t.more}</h2>
        <ul {...stylex.props(styles.moreList)}>
          {GUIDE_SLUGS.filter((other) => other !== slug).map((other) => (
            <li key={other}>
              <Link to="/guides/$slug" params={{ slug: other }} {...stylex.props(styles.moreLink)}>
                {t.guides[other].title}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/alternatives" {...stylex.props(styles.moreLink)}>
              {m.alternatives.heading}
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
