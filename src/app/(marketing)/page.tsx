import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch, ThemeSwitch } from "@/components/shell/preferences";
import { buttonClass } from "@/components/ui/button";
import { Badge, Kbd } from "@/components/ui/primitives";
import { site } from "@/config/site";
import { CalendarPreview } from "@/features/marketing/calendar-preview";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getI18n()).m.marketing;
  return { title: { absolute: `${site.name} · ${t.tagline}` }, description: t.description };
}

export default async function LandingPage() {
  const { m, fmt } = await getI18n();
  const t = m.marketing;
  const f = t.features;
  const euros = (amount: number) => fmt.money(amount * 100, "EUR", { cents: false });
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label={t.nav.label} className="flex items-center gap-1 text-[13px]">
          <a href="#features" className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:block">
            {t.nav.features}
          </a>
          <a href="#limits" className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:block">
            {t.nav.limits}
          </a>
          <a href={site.repo} className="rounded-md px-3 py-1.5 text-muted hover:text-ink">
            GitHub
          </a>
          <Link href="/overview" className={buttonClass({}, "ml-2")}>
            {t.nav.dashboard}
          </Link>
        </nav>
      </header>

      <main>
        <section className="pt-16 pb-12 sm:pt-24">
          <h1 className="max-w-[15ch] animate-rise text-5xl leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-7xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-[56ch] animate-rise text-lg leading-relaxed text-muted [animation-delay:80ms]">
            {t.hero.body}
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:160ms]">
            <a href={site.repo} className={buttonClass({ variant: "primary", size: "lg" })}>
              {t.hero.github}
            </a>
            <Link href="/overview" className={buttonClass({ size: "lg" })}>
              {t.hero.dashboard}
            </Link>
          </div>
        </section>

        <CalendarPreview />

        <section id="features" className="scroll-mt-8 pt-28">
          <h2 className="max-w-[22ch] text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
            {f.title}
          </h2>
          <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted">{f.intro}</p>

          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
            <Feature title={f.sync.title} body={f.sync.body}>
              <ul className="space-y-2 text-[13px]">
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

            <Feature title={f.money.title} body={f.money.body}>
              <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-[13px] tabular-nums">
                <dt className="text-muted">{f.money.revenue(m.common.count.nights(28))}</dt>
                <dd className="text-right">{euros(4609)}</dd>
                <dt className="text-muted">{f.money.cleaning(m.common.count.stays(9))}</dt>
                <dd className="text-right">−{euros(495)}</dd>
                <dt className="text-muted">{f.money.commission}</dt>
                <dd className="text-right">−{euros(324)}</dd>
                <dt className="text-muted">{f.money.bills}</dt>
                <dd className="text-right">−{euros(250)}</dd>
                <dt className="border-t border-line pt-2 font-medium">{f.money.net}</dt>
                <dd className="border-t border-line pt-2 text-right font-semibold">{euros(3540)}</dd>
              </dl>
            </Feature>

            <Feature title={f.suggestions.title} body={f.suggestions.body}>
              <ul className="space-y-2.5 text-[13px]">
                {f.suggestions.rows.map((row) => (
                  <SuggestionRow key={row.text} tone={row.tone} label={row.label} text={row.text} />
                ))}
              </ul>
            </Feature>

            <Feature title={f.keyboard.title} body={f.keyboard.body}>
              <div className="space-y-3 text-[13px]">
                <p className="flex flex-wrap items-center gap-1.5 text-muted">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd> {f.keyboard.commandMenu}
                  <span className="mx-1 text-faint">/</span>
                  <Kbd>G</Kbd>
                  <Kbd>C</Kbd> {f.keyboard.calendar}
                  <span className="mx-1 text-faint">/</span>
                  <Kbd>N</Kbd> {f.keyboard.newBooking}
                </p>
                <p className="rounded-md border border-line bg-subtle px-3 py-2 leading-relaxed">
                  <span className="text-muted">{f.keyboard.you}</span> {f.keyboard.request}
                  <br />
                  <span className="text-muted">{f.keyboard.assistant}</span> {f.keyboard.answer}
                </p>
              </div>
            </Feature>
          </div>
          <p className="mt-3 text-xs text-muted">{f.note}</p>
        </section>

        <section id="limits" className="grid scroll-mt-8 gap-10 pt-28 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
              {t.limits.title}
            </h2>
            <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-muted">{t.limits.intro}</p>
          </div>
          <dl className="divide-y divide-line border-y border-line text-[15px]">
            {t.limits.items.map((item) => (
              <Limit key={item.term} term={item.term}>
                {item.body}
              </Limit>
            ))}
          </dl>
        </section>

        <section className="grid items-center gap-10 pt-28 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
              {t.open.title}
            </h2>
            <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-muted">
              {t.open.body(site.license)}
            </p>
            <a href={site.repo} className={buttonClass({ variant: "primary", size: "lg" }, "mt-7")}>
              {t.open.source}
            </a>
          </div>
          <pre
            className="overflow-x-auto rounded-xl border border-line bg-subtle p-5 font-mono text-[13px] leading-7"
            aria-label={t.open.install}
          >
            <code>
              <span className="text-faint">$ </span>git clone {site.repo.replace("https://", "")}
              {"\n"}
              <span className="text-faint">$ </span>cd innkeep && npm install
              {"\n"}
              <span className="text-faint">$ </span>npm run dev
              {"\n\n"}
              <span className="text-muted">Ready on http://localhost:3000</span>
            </code>
          </pre>
        </section>
      </main>

      <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-line py-8 text-[13px] text-muted">
        <Logo className="text-ink" />
        <p>{t.footer.disclaimer}</p>
        <nav aria-label={t.footer.label} className="flex gap-5">
          <a href={site.repo} className="hover:text-ink">
            GitHub
          </a>
          <a href={`${site.repo}/blob/main/docs/ALTERNATIVES.md`} className="hover:text-ink">
            {t.footer.alternatives}
          </a>
          <a href={`${site.repo}/blob/main/LICENSE`} className="hover:text-ink">
            {t.footer.license}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <article className="flex flex-col justify-between gap-8 bg-bg p-6 sm:p-8">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted">{body}</p>
      </div>
      <div className="rounded-lg border border-line p-4">{children}</div>
    </article>
  );
}

function SyncRow({ source, name, detail }: { source: string; name: string; detail: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`size-2 rounded-full ${source}`} />
      <span className="flex-1 font-medium">{name}</span>
      <span className="text-muted">{detail}</span>
    </li>
  );
}

function SuggestionRow({
  tone,
  label,
  text,
}: {
  tone: "critical" | "warn" | "neutral";
  label: string;
  text: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <Badge tone={tone}>{label}</Badge>
      <span className="truncate">{text}</span>
    </li>
  );
}

function Limit({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[14rem_1fr] sm:gap-6">
      <dt className="font-medium">{term}</dt>
      <dd className="leading-relaxed text-muted">{children}</dd>
    </div>
  );
}
