import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site, siteUrl } from "@/config/site";
import { GUIDE_SLUGS, GUIDES_UPDATED_ON, isGuide } from "@/features/marketing/guides";
import { SiteFooter, SiteHeader, pillClass } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!isGuide(slug)) return {};
  const guide = (await getI18n()).m.guides.guides[slug];
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      url: `/guides/${slug}`,
      modifiedTime: GUIDES_UPDATED_ON,
    },
  };
}

/** Structured data for a guide: the article, its place in the site, and its questions. */
function jsonLd(
  slug: string,
  title: string,
  description: string,
  faq: { question: string; answer: string }[],
) {
  const url = `${siteUrl}/guides/${slug}`;
  return JSON.stringify([
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
  ]).replace(/</g, "\\u003c");
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  if (!isGuide(slug)) notFound();
  const { m, fmt } = await getI18n();
  const t = m.guides;
  const guide = t.guides[slug];
  const date = fmt.date(GUIDES_UPDATED_ON, { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 sm:px-8">
        <article>
          <header className="pt-12 pb-10 sm:pt-20">
            <p className="text-[13px]">
              <Link href="/guides" className="text-muted underline underline-offset-4 hover:text-ink">
                {t.all}
              </Link>
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">
              {guide.title}
            </h1>
            <p className="mt-7 max-w-[62ch] text-xl leading-relaxed text-pretty text-muted">{guide.lead}</p>
            <p className="mt-6 text-[13px] text-faint">
              <time dateTime={GUIDES_UPDATED_ON}>{t.updated(date)}</time>
            </p>
          </header>

          {guide.sections.map((section) => (
            <section key={section.heading} className="pt-12">
              <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] text-balance sm:text-3xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-4 max-w-[68ch] text-[17px] leading-[1.7]">
                  {paragraph}
                </p>
              ))}
              {section.steps && (
                <ol className="mt-6 max-w-[68ch] list-decimal space-y-3 pl-6 text-[17px] leading-[1.6] marker:font-medium marker:text-overlap">
                  {section.steps.map((step) => (
                    <li key={step} className="pl-1.5">
                      {step}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}

          <section className="pt-16">
            <h2 className="font-display text-2xl leading-tight tracking-[-0.02em] sm:text-3xl">
              {t.questions}
            </h2>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {guide.faq.map((item) => (
                <div key={item.question} className="py-6">
                  <dt className="text-[17px] font-medium">{item.question}</dt>
                  <dd className="mt-2 max-w-[68ch] text-base leading-relaxed text-muted">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </article>

        <aside className="field mt-20 rounded-[1.75rem] p-7 [--g:var(--glass-blue)] sm:p-10">
          <span
            aria-hidden
            className="glass glass-arch -right-8 -bottom-24 -z-10 h-72 w-44 rotate-12 [--g:var(--glass-blue)] max-sm:hidden"
          />
          <h2 className="font-display text-3xl tracking-[-0.025em]">{t.cta.title}</h2>
          <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-muted">{t.cta.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/#access" className={pillClass("primary", "lg")}>
              {t.cta.install}
            </Link>
            <a href={site.repo} className={pillClass("secondary", "lg")}>
              {t.cta.demo}
            </a>
          </div>
        </aside>

        <nav aria-label={t.more} className="pt-16">
          <h2 className="text-[15px] font-medium">{t.more}</h2>
          <ul className="mt-4 space-y-2.5 text-[15px]">
            {GUIDE_SLUGS.filter((other) => other !== slug).map((other) => (
              <li key={other}>
                <Link
                  href={`/guides/${other}`}
                  className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                >
                  {t.guides[other].title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/alternatives"
                className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                {m.alternatives.heading}
              </Link>
            </li>
          </ul>
        </nav>
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(slug, guide.title, guide.description, guide.faq) }}
      />
    </>
  );
}
