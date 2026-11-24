import type { Metadata } from "next";
import Link from "next/link";
import { ALTERNATIVES, CHECKED_ON, type Alternative } from "@/features/marketing/alternatives";
import { SiteFooter, SiteHeader, Sources } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getI18n()).m.alternatives;
  return { title: t.heading, description: t.description, alternates: { canonical: "/alternatives" } };
}

export default async function AlternativesPage() {
  const { m, fmt } = await getI18n();
  const t = m.alternatives;
  const date = fmt.date(CHECKED_ON, { day: "numeric", month: "long", year: "numeric" });
  const commercial = ALTERNATIVES.filter((alternative) => alternative.kind === "commercial");
  const openSource = ALTERNATIVES.filter((alternative) => alternative.kind === "open-source");

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="pt-16 pb-10 sm:pt-20">
          <h1 className="max-w-[18ch] font-display text-4xl leading-[1.05] tracking-[-0.03em] text-balance sm:text-6xl">
            {t.heading}
          </h1>
          <p className="mt-6 max-w-[68ch] text-lg leading-relaxed text-muted">{t.intro}</p>
          <p className="mt-6 max-w-[80ch] rounded-lg border border-line px-4 py-3 text-[13px] leading-relaxed text-muted">
            {t.checked(date)}
          </p>
        </section>

        <Group title={t.kinds.commercial.title} intro={t.kinds.commercial.intro} products={commercial} />
        <Group title={t.kinds.openSource.title} intro={t.kinds.openSource.intro} products={openSource} />

        <section className="pt-16">
          <h2 className="font-display text-2xl tracking-tight">{t.otherOpenSource.title}</h2>
          <ul className="mt-4 max-w-[80ch] list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
            {t.otherOpenSource.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="pt-20">
          <h2 className="font-display text-3xl tracking-[-0.025em]">{t.fit.title}</h2>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
            {[t.fit.stronger, t.fit.weaker].map((side) => (
              <div key={side.title} className="bg-bg p-6 sm:p-8">
                <h3 className="text-lg font-semibold tracking-tight">{side.title}</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
                  {side.items.map((item) => (
                    <li key={item}>{item}</li>
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
      <SiteFooter />
    </>
  );
}

/** One kind of product: Innkeep first as the reference row, then each alternative. */
async function Group({ title, intro, products }: { title: string; intro: string; products: Alternative[] }) {
  const { m } = await getI18n();
  const t = m.alternatives;
  const rows = [
    { key: "innkeep", name: "Innkeep", href: null, facts: t.innkeep },
    ...products.map((product) => ({
      key: product.slug,
      name: product.name,
      href: `/alternatives/${product.slug}`,
      facts: t.products[product.slug],
    })),
  ];

  return (
    <section className="pt-14">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-2 max-w-[75ch] text-[15px] leading-relaxed text-muted">{intro}</p>
      <p className="mt-1 text-[13px] text-muted">{t.priceNote}</p>
      <div className="mt-6 relative overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[60rem] text-left text-[13px]">
          <thead className="text-xs text-muted">
            <tr>
              {[
                t.columns.product,
                t.columns.segment,
                t.columns.price,
                t.columns.connection,
                t.columns.license,
                t.columns.drawback,
              ].map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-t border-line align-top leading-relaxed">
            {rows.map((row) => (
              <tr key={row.key} className={row.href ? undefined : "bg-subtle"}>
                <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap">
                  {row.href ? (
                    <Link href={row.href} className="underline underline-offset-2">
                      {row.name}
                      <span className="sr-only">: {t.compare(row.name)}</span>
                    </Link>
                  ) : (
                    row.name
                  )}
                </th>
                <td className="px-4 py-3 text-muted">{row.facts.segment}</td>
                <td className="px-4 py-3">{row.facts.price}</td>
                <td className="px-4 py-3 text-muted">{row.facts.connection}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{row.facts.license}</td>
                <td className="px-4 py-3 text-muted">{row.facts.drawback}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
