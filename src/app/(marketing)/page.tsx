import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import { Badge, Kbd } from "@/components/ui/primitives";
import { site, siteUrl, takesAccessRequests } from "@/config/site";
import { AccessForm } from "@/features/marketing/access-form";
import { CopyRequest } from "@/features/marketing/copy-request";
import { DemoFilm } from "@/features/marketing/demo-film";
import { SourceLogo } from "@/features/marketing/source-logos";
import { SiteFooter, SiteHeader, pillClass } from "@/features/marketing/site-chrome";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getI18n()).m.marketing;
  return {
    title: { absolute: `${site.name} · ${t.tagline}` },
    description: t.description,
    alternates: { canonical: "/" },
    openGraph: { url: "/" },
  };
}

const H2 = "font-display text-4xl leading-[1.04] tracking-[-0.03em] text-balance sm:text-6xl";

export default async function LandingPage() {
  const { locale, m, fmt } = await getI18n();
  const t = m.marketing;
  const f = t.features;
  const euros = (amount: number) => fmt.money(amount * 100, "EUR", { cents: false });
  const guide = `${site.repo}/blob/main/docs/${locale === "fr" ? "INSTALLATION.fr.md" : "INSTALL.md"}`;

  return (
    <>
      <SiteHeader />

      <main>
        <section className="relative isolate">
          {/* Glass on three depth planes. The nearest moves most as the page scrolls. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[62rem] overflow-x-clip"
          >
            <span className="glass glass-arch plane top-24 -left-28 h-[34rem] w-64 -rotate-12 [--drift:-160px] [--g:var(--glass-green)] max-sm:top-[26rem] max-sm:-left-36 max-sm:h-80 max-sm:w-48" />
            <span className="glass glass-arch plane -top-16 -right-20 h-[26rem] w-72 rotate-[18deg] [--drift:-120px] [--g:var(--glass-blue)] max-sm:h-64 max-sm:w-44" />
            <span className="glass glass-arch plane top-56 -right-36 h-[36rem] w-80 rotate-[8deg] [--drift:-200px] [--g:var(--glass-coral)] max-sm:top-[30rem] max-sm:h-80 max-sm:w-52" />
          </div>

          <div className="mx-auto max-w-6xl px-5 pt-12 text-center sm:px-8 sm:pt-10">
            <LogoMark
              tone="color"
              className="mx-auto size-14 animate-[settle_0.9s_cubic-bezier(0.16,1,0.3,1)_both] drop-shadow-[0_18px_24px_color-mix(in_oklab,var(--overlap)_35%,transparent)] sm:size-16"
            />
            <h1 className="mx-auto mt-6 max-w-[16ch] animate-[settle_0.9s_cubic-bezier(0.16,1,0.3,1)_80ms_both] font-display text-5xl leading-none tracking-[-0.035em] text-balance sm:text-[5.25rem]">
              {t.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-[66ch] animate-[settle_0.9s_cubic-bezier(0.16,1,0.3,1)_160ms_both] text-lg leading-relaxed text-pretty text-muted sm:text-xl">
              {t.hero.body}
            </p>
            {takesAccessRequests ? (
              <div
                id="access"
                className="mt-7 animate-[settle_0.9s_cubic-bezier(0.16,1,0.3,1)_240ms_both] scroll-mt-28"
              >
                <AccessForm />
                <p className="mt-2 text-[13px] text-muted">
                  <a
                    href="#ways"
                    className="underline decoration-line-strong underline-offset-4 hover:decoration-ink"
                  >
                    {t.hero.selfHosted}
                  </a>
                </p>
              </div>
            ) : (
              <div className="mt-8 flex animate-[settle_0.9s_cubic-bezier(0.16,1,0.3,1)_240ms_both] flex-wrap justify-center gap-3">
                <Link href="/overview" className={pillClass("primary", "lg")}>
                  {t.hero.dashboard}
                </Link>
                <a href="#demo" className={pillClass("secondary", "lg")}>
                  {t.hero.watch}
                </a>
              </div>
            )}
          </div>

          <div className="mx-auto mt-9 max-w-6xl animate-[settle_1.1s_cubic-bezier(0.16,1,0.3,1)_360ms_both] px-3 sm:px-8">
            <DemoFilm />
            <div className="mt-10 px-2">
              <h2 className="text-center text-[13px] font-medium text-muted">{t.works.label}</h2>
              <ul className="mx-auto mt-4 grid max-w-4xl gap-3 sm:grid-cols-3">
                <WorksWith
                  name="airbnb"
                  label={m.common.sources.airbnb}
                  detail={t.works.airbnb}
                  tone="text-coral"
                />
                <WorksWith
                  name="booking"
                  label={m.common.sources.booking}
                  detail={t.works.booking}
                  tone="text-blue"
                />
                <WorksWith name="chrome" label="Google Chrome" detail={t.works.chrome} tone="text-ink" />
              </ul>
              <p className="mx-auto mt-5 max-w-[66ch] text-center text-[15px] leading-relaxed text-pretty text-muted">
                {t.hero.extension}
              </p>
              <p className="mt-2 text-center text-xs text-faint">{t.works.note}</p>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-36 sm:px-8 sm:pt-48">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={H2}>{f.title}</h2>
            <p className="mx-auto mt-6 max-w-[58ch] text-lg leading-relaxed text-pretty text-muted">
              {f.intro}
            </p>
          </div>

          <div className="mt-20 space-y-24 sm:mt-28 sm:space-y-36">
            <Feature title={f.sync.title} body={f.sync.body} glass="var(--glass-coral)" shape="arch">
              <ul className="space-y-3.5 text-sm">
                <SyncRow
                  source="bg-airbnb"
                  name={m.common.sources.airbnb}
                  detail={f.sync.synced(fmt.timeAgo(0, 4 * 60_000))}
                />
                <SyncRow
                  source="bg-booking"
                  name={m.common.sources.booking}
                  detail={f.sync.synced(fmt.timeAgo(0, 4 * 60_000))}
                />
                <SyncRow source="bg-direct" name={f.sync.direct} detail={f.sync.shared} />
              </ul>
            </Feature>

            <Feature title={f.money.title} body={f.money.body} glass="var(--glass-green)" shape="pill">
              <dl className="grid grid-cols-[1fr_auto] gap-y-2.5 text-sm tabular-nums">
                <dt className="text-muted">{f.money.revenue(m.common.count.nights(28))}</dt>
                <dd className="text-right">{euros(4609)}</dd>
                <dt className="text-muted">{f.money.cleaning(m.common.count.stays(9))}</dt>
                <dd className="text-right">−{euros(495)}</dd>
                <dt className="text-muted">{f.money.commission}</dt>
                <dd className="text-right">−{euros(324)}</dd>
                <dt className="text-muted">{f.money.bills}</dt>
                <dd className="text-right">−{euros(250)}</dd>
                <dt className="mt-1 border-t border-line pt-3 font-medium">{f.money.net}</dt>
                <dd className="mt-1 border-t border-line pt-3 text-right font-display text-2xl">
                  {euros(3540)}
                </dd>
              </dl>
            </Feature>

            <Feature
              title={f.suggestions.title}
              body={f.suggestions.body}
              glass="var(--overlap)"
              shape="tile"
            >
              <ul className="space-y-3.5 text-sm">
                {f.suggestions.rows.map((row) => (
                  <li key={row.text} className="flex items-start gap-2.5">
                    <Badge tone={row.tone}>{row.label}</Badge>
                    <span className="min-w-0">{row.text}</span>
                  </li>
                ))}
              </ul>
            </Feature>

            <Feature title={f.keyboard.title} body={f.keyboard.body} glass="var(--glass-blue)" shape="arch">
              <div className="space-y-4 text-sm">
                <p className="flex flex-wrap items-center gap-1.5 text-muted">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd> {f.keyboard.commandMenu}
                  <span className="mx-1 text-faint">/</span>
                  <Kbd>G</Kbd>
                  <Kbd>C</Kbd> {f.keyboard.calendar}
                  <span className="mx-1 text-faint">/</span>
                  <Kbd>N</Kbd> {f.keyboard.newBooking}
                </p>
                <p className="border-t border-line pt-4 leading-relaxed">
                  <span className="text-muted">{f.keyboard.you}</span> {f.keyboard.request}
                  <br />
                  <span className="text-muted">{f.keyboard.assistant}</span> {f.keyboard.answer}
                </p>
              </div>
            </Feature>
          </div>
          <p className="mt-10 text-center text-[13px] text-muted">{f.note}</p>
        </section>

        <section id="trust" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-36 sm:px-8 sm:pt-48">
          <div className="field rounded-[2.5rem] px-5 py-14 [--g:var(--glass-green)] sm:px-14 sm:py-20">
            <span
              aria-hidden
              className="glass glass-arch -top-24 -right-10 -z-10 h-80 w-56 rotate-[24deg] [--g:var(--glass-green)] max-sm:hidden"
            />
            <div className="max-w-2xl">
              <h2 className={H2}>{t.trust.title}</h2>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-[color-mix(in_oklab,var(--ink)_72%,var(--g))]">
                {t.trust.intro}
              </p>
            </div>
            <dl className="panel mt-12 grid gap-x-12 rounded-[1.75rem] px-6 py-2 sm:px-10 md:grid-cols-2">
              {t.trust.items.map((item) => (
                <div
                  key={item.term}
                  className="border-b border-line py-6 last:border-b-0 md:nth-last-[2]:border-b-0"
                >
                  <dt className="font-display text-xl tracking-[-0.01em]">{item.term}</dt>
                  <dd className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted">{item.body}</dd>
                </div>
              ))}
            </dl>
            <a
              href={`${site.repo}/blob/main/docs/EXTENSION-PRIVACY.md`}
              className="mt-8 inline-block text-[15px] font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              {t.trust.privacy}
            </a>
          </div>
        </section>

        {/* The quiet passage: no glass, only what the product cannot do. */}
        <section
          id="limits"
          className="mx-auto grid max-w-6xl scroll-mt-24 gap-12 px-5 pt-36 sm:px-8 sm:pt-48 md:grid-cols-[1fr_1.3fr]"
        >
          <div>
            <h2 className={H2}>{t.limits.title}</h2>
            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-muted">{t.limits.intro}</p>
            <Link
              href="/alternatives"
              className="mt-6 inline-block text-[15px] font-medium underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              {m.alternatives.nav.alternatives}
            </Link>
          </div>
          <dl className="divide-y divide-line border-y border-line">
            {t.limits.items.map((item) => (
              <div key={item.term} className="py-6">
                <dt className="font-display text-xl tracking-[-0.01em]">{item.term}</dt>
                <dd className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="ways" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-36 sm:px-8 sm:pt-48">
          <h2 className={cn(H2, "mx-auto max-w-[14ch] text-center")}>{t.ways.title}</h2>
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <div className="field flex flex-col rounded-[1.75rem] p-7 [--g:var(--overlap)] sm:p-10">
              <span
                aria-hidden
                className="glass glass-arch plane-view -top-24 -right-10 -z-10 h-72 w-48 rotate-[24deg] [--drift:-36px] [--g:var(--overlap)]"
              />
              <p className="text-[13px] font-medium text-overlap">{t.ways.hosted.state}</p>
              <h3 className="mt-2 font-display text-4xl tracking-[-0.025em]">{t.ways.hosted.title}</h3>
              <p className="mt-4 max-w-[44ch] flex-1 text-base leading-relaxed text-[color-mix(in_oklab,var(--ink)_72%,var(--g))]">
                {t.ways.hosted.body}
              </p>
              {takesAccessRequests && <AccessForm className="mx-0 mt-8 w-full" />}
            </div>
            <div className="panel flex flex-col rounded-[1.75rem] p-7 sm:p-10">
              <p className="text-[13px] font-medium text-good">{t.ways.self.state}</p>
              <h3 className="mt-2 font-display text-4xl tracking-[-0.025em]">{t.ways.self.title}</h3>
              <p className="mt-4 max-w-[44ch] flex-1 text-base leading-relaxed text-muted">
                {t.ways.self.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={site.repo} className={pillClass("primary", "lg")}>
                  {t.ways.self.github}
                </a>
                <a href="#install" className={pillClass("secondary", "lg")}>
                  {t.ways.self.guide}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="install" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-28 sm:px-8 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className={H2}>{t.open.title}</h2>
            <p className="mx-auto mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-muted">
              {t.open.body(site.license)}
            </p>
          </div>

          <div className="mt-16 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <div
              className="panel flex flex-col overflow-hidden rounded-[1.75rem]"
              aria-labelledby="ai-install"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-8">
                <div>
                  <h3 id="ai-install" className="font-display text-2xl tracking-[-0.02em] text-balance">
                    {t.open.ai.title}
                  </h3>
                  <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-muted">{t.open.ai.body}</p>
                </div>
                <CopyRequest value={t.open.ai.prompt} label={t.open.ai.copy} />
              </div>
              <pre
                tabIndex={0}
                aria-label={t.open.ai.label}
                className="max-h-64 flex-1 overflow-y-auto border-y border-line bg-subtle p-6 font-sans text-[13px] leading-relaxed whitespace-pre-wrap text-muted sm:px-8"
              >
                {t.open.ai.prompt}
              </pre>
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-[13px] text-muted sm:px-8">
                <p className="max-w-[52ch]">{t.open.ai.caution}</p>
                <a href={guide} className="text-ink underline underline-offset-4">
                  {t.open.ai.guide}
                </a>
              </div>
            </div>

            <div className="field flex min-h-96 flex-col justify-between gap-8 rounded-[1.75rem] p-6 [--g:var(--glass-blue)] sm:p-8">
              <span
                aria-hidden
                className="glass glass-arch -right-10 -bottom-28 -z-10 h-[26rem] w-56 rotate-12 [--g:var(--glass-blue)]"
              />
              <pre
                className="panel rounded-2xl p-5 font-mono text-[13px] leading-7 [overflow-wrap:anywhere] whitespace-pre-wrap"
                aria-label={t.open.install}
              >
                <code>
                  <span className="text-faint">$ </span>git clone {site.repo}
                  {"\n"}
                  <span className="text-faint">$ </span>cd Innkeep
                  {"\n"}
                  <span className="text-faint">$ </span>npm run app
                  {"\n\n"}
                  <span className="font-sans text-muted">{t.open.ready}</span>
                </code>
              </pre>
              <a href={site.repo} className={cn(pillClass("secondary", "lg"), "self-start")}>
                {t.open.source}
              </a>
            </div>
          </div>
        </section>

        <section className="relative isolate mx-auto mt-36 max-w-6xl px-5 sm:mt-48 sm:px-8">
          <div className="field relative rounded-[2.5rem] px-6 pt-20 pb-72 text-center [--g:var(--overlap)] sm:py-36">
            <span
              aria-hidden
              className="glass glass-arch -bottom-28 left-[8%] -z-10 h-80 w-44 -rotate-6 [--g:var(--glass-coral)] sm:-left-6 sm:h-96 sm:w-56"
            />
            <span
              aria-hidden
              className="glass glass-arch -bottom-36 left-[38%] -z-10 h-96 w-44 rotate-3 [--g:var(--glass-blue)] sm:left-24 sm:h-[26rem] sm:w-56"
            />
            <span
              aria-hidden
              className="glass glass-pill -top-10 right-[10%] -z-10 h-24 w-64 rotate-12 [--g:var(--glass-green)] max-sm:-right-20"
            />
            <h2 className={cn(H2, "mx-auto max-w-[16ch]")}>{t.close.title}</h2>
            <p className="mx-auto mt-6 max-w-[46ch] text-lg leading-relaxed text-pretty text-[color-mix(in_oklab,var(--ink)_72%,var(--g))]">
              {t.close.body}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              {takesAccessRequests ? (
                <a href="#access" className={pillClass("primary", "lg")}>
                  {t.nav.access}
                </a>
              ) : (
                <Link href="/overview" className={pillClass("primary", "lg")}>
                  {t.hero.dashboard}
                </Link>
              )}
              <a href={site.repo} className={pillClass("secondary", "lg")}>
                {t.close.self}
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: site.name,
            description: t.description,
            url: siteUrl,
            applicationCategory: "BusinessApplication",
            operatingSystem: "macOS, Windows, Linux",
            license: `${site.repo}/blob/main/LICENSE`,
            codeRepository: site.repo,
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}

function WorksWith({
  name,
  label,
  detail,
  tone,
}: {
  name: "airbnb" | "booking" | "chrome";
  label: string;
  detail: string;
  tone: string;
}) {
  return (
    <li className="panel flex items-center gap-3.5 rounded-2xl px-4 py-3.5">
      <SourceLogo name={name} className={cn("size-7 shrink-0", tone)} />
      <span className="min-w-0 text-left">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-[13px] leading-snug text-muted">{detail}</span>
      </span>
    </li>
  );
}

const SHAPES = {
  arch: "glass-arch -right-10 -bottom-24 h-[26rem] w-60 rotate-[14deg]",
  pill: "glass-pill -top-12 -right-24 h-40 w-[26rem] -rotate-12",
  tile: "glass-tile -right-16 -bottom-20 size-80 rotate-12",
} as const;

/** The far, softer shape of each field: a different place every time. */
const ECHOES = {
  arch: "glass-pill -top-8 left-[12%] h-20 w-48 -rotate-6",
  pill: "glass-tile -bottom-16 -left-10 size-44 rotate-[20deg]",
  tile: "glass-arch -top-28 left-[38%] h-56 w-36 rotate-[32deg]",
} as const;

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
  glass: string;
  shape: keyof typeof SHAPES;
  children: ReactNode;
}) {
  return (
    <article className="grid items-center gap-8 md:grid-cols-[1fr_1.25fr] md:gap-16">
      <div>
        <h3 className="font-display text-3xl leading-[1.08] tracking-[-0.025em] text-balance sm:text-4xl">
          {title}
        </h3>
        <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted sm:text-[17px]">{body}</p>
      </div>
      <div
        className="field grid min-h-80 grid-cols-[minmax(0,1fr)] place-items-center rounded-[1.75rem] p-5 sm:min-h-[26rem] sm:p-12"
        style={{ "--g": glass } as React.CSSProperties}
      >
        <span aria-hidden className={cn("glass plane-view -z-10 [--drift:-36px]", SHAPES[shape])} />
        <span
          aria-hidden
          className={cn("glass plane-view -z-10 blur-[2px] [--glass-opacity:0.5]", ECHOES[shape])}
        />
        <div className="panel w-full max-w-md min-w-0 rounded-2xl p-5 sm:p-7">{children}</div>
      </div>
    </article>
  );
}

function SyncRow({ source, name, detail }: { source: string; name: string; detail: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span aria-hidden className={`size-2.5 rounded-full ${source}`} />
      <span className="flex-1 font-medium">{name}</span>
      <span className="text-right text-[13px] text-muted">{detail}</span>
    </li>
  );
}
