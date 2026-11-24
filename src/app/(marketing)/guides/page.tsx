import type { Metadata } from "next";
import Link from "next/link";
import { GUIDE_SLUGS } from "@/features/marketing/guides";
import { SiteFooter, SiteHeader } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getI18n()).m.guides;
  return { title: t.heading, description: t.description, alternates: { canonical: "/guides" } };
}

export default async function GuidesPage() {
  const t = (await getI18n()).m.guides;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 sm:px-8">
        <header className="pt-16 pb-12 sm:pt-24">
          <h1 className="max-w-[18ch] font-display text-4xl leading-[1.04] tracking-[-0.03em] text-balance sm:text-6xl">
            {t.heading}
          </h1>
          <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-pretty text-muted">{t.intro}</p>
        </header>

        <ul className="border-t border-line">
          {GUIDE_SLUGS.map((slug) => (
            <li key={slug} className="border-b border-line">
              <Link href={`/guides/${slug}`} className="group block rounded-xl py-8">
                <h2 className="max-w-[32ch] font-display text-2xl leading-tight tracking-[-0.02em] text-balance group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4 sm:text-3xl">
                  {t.guides[slug].title}
                </h2>
                <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-muted">
                  {t.guides[slug].description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
