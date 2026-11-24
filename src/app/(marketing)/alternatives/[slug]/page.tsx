import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { site } from "@/config/site";
import { ALTERNATIVES, CHECKED_ON, findAlternative } from "@/features/marketing/alternatives";
import { SiteFooter, SiteHeader, Sources } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/alternatives/[slug]">): Promise<Metadata> {
  const product = findAlternative((await params).slug);
  if (!product) return {};
  const t = (await getI18n()).m.alternatives.vs;
  return {
    title: t.title(product.name),
    description: t.description(product.name),
    alternates: { canonical: `/alternatives/${product.slug}` },
  };
}

export default async function ComparisonPage({ params }: PageProps<"/alternatives/[slug]">) {
  const product = findAlternative((await params).slug);
  if (!product) notFound();
  const { m, fmt } = await getI18n();
  const t = m.alternatives;
  const theirs = t.products[product.slug];
  const ours = t.innkeep;
  const date = fmt.date(CHECKED_ON, { day: "numeric", month: "long", year: "numeric" });
  const rows = (
    ["segment", "price", "free", "connection", "inbox", "automation", "site", "license", "drawback"] as const
  ).map((key) => ({ label: t.columns[key], theirs: theirs[key], ours: ours[key] }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="pt-12 pb-8 sm:pt-16">
          <p className="text-[13px]">
            <Link href="/alternatives" className="text-muted underline underline-offset-2 hover:text-ink">
              {t.nav.all}
            </Link>
          </p>
          <h1 className="mt-4 max-w-[20ch] font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">
            {t.vs.title(product.name)}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">{t.vs.lead}</p>
        </section>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          <div className="bg-bg p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">{t.vs.chooseThem(product.name)}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{theirs.chooseThem}</p>
          </div>
          <div className="bg-bg p-6 sm:p-8">
            <h2 className="text-lg font-semibold tracking-tight">{t.vs.chooseInnkeep}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{theirs.chooseInnkeep}</p>
          </div>
        </div>

        <section className="pt-12">
          <p className="mb-3 text-[13px] text-muted">{t.priceNote}</p>
          <div className="relative overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[40rem] text-left text-[14px]">
              <thead className="text-xs text-muted">
                <tr>
                  <td className="px-4 py-3" />
                  <th scope="col" className="w-[38%] px-4 py-3 font-medium">
                    {product.name}
                  </th>
                  <th scope="col" className="w-[38%] px-4 py-3 font-medium">
                    {t.vs.innkeep}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line align-top leading-relaxed">
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-4 py-3 text-[13px] font-normal text-muted">
                      {row.label}
                    </th>
                    <td className="px-4 py-3">{row.theirs}</td>
                    <td className="px-4 py-3">{row.ours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pt-12">
          <h2 className="font-display text-2xl tracking-tight">{t.vs.notes(product.name)}</h2>
          <p className="mt-3 max-w-[75ch] text-[15px] leading-relaxed text-muted">{theirs.note}</p>
          <p className="mt-4 max-w-[80ch] rounded-lg border border-line px-4 py-3 text-[13px] leading-relaxed text-muted">
            {t.checked(date)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={site.repo} className={buttonClass({ variant: "primary", size: "lg" })}>
              {t.vs.tryInnkeep}
            </a>
            <a href={product.url} rel="noreferrer nofollow" className={buttonClass({ size: "lg" })}>
              {t.vs.visit(product.name)}
            </a>
          </div>
        </section>

        <Sources title={t.sources.title} intro={t.sources.intro(date)} sources={product.sources} />

        <section className="pt-16">
          <h2 className="font-display text-2xl tracking-tight">{t.vs.others}</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ALTERNATIVES.filter((other) => other.slug !== product.slug).map((other) => (
              <li key={other.slug}>
                <Link href={`/alternatives/${other.slug}`} className={buttonClass({ size: "sm" })}>
                  {t.compare(other.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
