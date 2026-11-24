import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import { readDesignDoc } from "@/features/marketing/design-doc";
import { SiteFooter, SiteHeader } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getI18n()).m.design;
  return { title: t.title, description: t.lead, alternates: { canonical: "/design" } };
}

/** Inline marks of the document: `code` and **strong**. */
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, index) => {
    const key = `${index}-${part.slice(0, 12)}`;
    if (part.startsWith("`")) {
      return (
        <code key={key} className="rounded-md bg-sunken px-1.5 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) {
      return (
        <strong key={key} className="font-medium text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

/** The public copy of `DESIGN.md`: its tokens shown as swatches and samples, then its text. */
export default async function DesignPage() {
  const t = (await getI18n()).m.design;
  const doc = readDesignDoc();
  const light = doc.colors.filter(([name]) => !name.endsWith("-dark"));
  const dark = doc.colors.filter(([name]) => name.endsWith("-dark"));
  const link = "font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 sm:px-8">
        <header className="pt-14 pb-12 sm:pt-20">
          <h1 className="max-w-[16ch] font-display text-5xl leading-none tracking-[-0.035em] text-balance sm:text-7xl">
            {t.heading}
          </h1>
          <p className="mt-7 max-w-[60ch] text-lg leading-relaxed text-pretty text-muted">{t.lead}</p>
          <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            <a href="/design.md" className={link}>
              {t.raw}
            </a>
            <a href={`${site.repo}/blob/main/DESIGN.md`} className={link}>
              {t.source}
            </a>
          </p>
        </header>

        <section aria-labelledby="swatches">
          <h2 id="swatches" className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">
            {t.colors}
          </h2>
          {(
            [
              [t.light, light],
              [t.dark, dark],
            ] as const
          ).map(([label, group]) => (
            <div key={label} className="mt-6">
              <h3 className="text-[13px] font-medium text-muted">{label}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {group.map(([name, value]) => (
                  <li key={name} className="panel overflow-hidden rounded-2xl">
                    <span aria-hidden className="block h-16" style={{ backgroundColor: value }} />
                    <span className="block px-3 py-2.5">
                      <span className="block truncate text-[13px] font-medium">{name}</span>
                      <span className="block font-mono text-xs text-muted">{value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="type-samples" className="pt-16">
          <h2 id="type-samples" className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">
            {t.type}
          </h2>
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {doc.typography.map(([name, style]) => (
              <div
                key={name}
                className="grid grid-cols-1 gap-2 py-5 sm:grid-cols-[9rem_1fr] sm:items-baseline"
              >
                <dt className="text-[13px]">
                  <span className="font-medium">{name}</span>{" "}
                  <span className="font-mono text-xs text-muted">{style.fontSize}</span>
                </dt>
                <dd
                  className="min-w-0 truncate leading-tight"
                  style={{
                    fontFamily: style.fontFamily?.startsWith("Funnel")
                      ? "var(--font-funnel), var(--font-geist-sans), sans-serif"
                      : style.fontFamily?.includes("Mono")
                        ? "var(--font-geist-mono), monospace"
                        : undefined,
                    fontSize: `min(${style.fontSize ?? "1rem"}, 9vw)`,
                    fontWeight: style.fontWeight,
                    letterSpacing: style.letterSpacing,
                  }}
                >
                  {t.sample}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <article lang="en" className="pt-16">
          <p className="text-[13px] text-muted">{t.english}</p>
          {doc.blocks.map((block, index) => {
            const key = `${block.kind}-${index}`;
            if (block.kind === "heading") {
              return block.level === 2 ? (
                <h2
                  key={key}
                  id={block.id}
                  className="scroll-mt-24 pt-14 font-display text-2xl leading-tight tracking-[-0.02em] sm:text-3xl"
                >
                  {block.text}
                </h2>
              ) : (
                <h3
                  key={key}
                  id={block.id}
                  className="scroll-mt-24 pt-8 font-display text-xl tracking-[-0.01em]"
                >
                  {block.text}
                </h3>
              );
            }
            if (block.kind === "list") {
              return (
                <ul
                  key={key}
                  className="mt-4 max-w-[70ch] list-disc space-y-2.5 pl-5 text-base leading-relaxed text-muted marker:text-line-strong"
                >
                  {block.items.map((item) => (
                    <li key={item}>{inline(item)}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={key} className="mt-4 max-w-[70ch] text-base leading-relaxed text-muted">
                {inline(block.text)}
              </p>
            );
          })}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
