import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch, ThemeSwitch } from "@/components/shell/preferences";
import { site, takesAccessRequests } from "@/config/site";
import { pillClass } from "./pill";
import { getI18n } from "@/i18n/server";
import { cn } from "@/lib/cn";

const NAV_LINK = "rounded-full px-3 py-1.5 text-muted transition-colors hover:text-ink";

/** The header shared by the public pages: the landing page and the comparisons. */
export async function SiteHeader() {
  const { m } = await getI18n();
  const t = m.marketing;
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 rounded-full bg-[color-mix(in_oklab,var(--bg)_72%,transparent)] pr-2 pl-5 shadow-[0_0_0_1px_color-mix(in_oklab,var(--ink)_7%,transparent)] backdrop-blur-xl backdrop-saturate-150">
        <Link href="/" className="rounded-full">
          <Logo tone="color" />
        </Link>
        <nav aria-label={t.nav.label} className="flex items-center gap-0.5 text-[13px]">
          <Link href="/#features" className={cn(NAV_LINK, "hidden md:block")}>
            {t.nav.features}
          </Link>
          <Link href="/#limits" className={cn(NAV_LINK, "hidden md:block")}>
            {t.nav.limits}
          </Link>
          <Link href="/alternatives" className={cn(NAV_LINK, "hidden md:block")}>
            {m.alternatives.nav.alternatives}
          </Link>
          <Link href="/guides" className={cn(NAV_LINK, "hidden md:block")}>
            {m.guides.nav}
          </Link>
          <a href={site.repo} className={NAV_LINK}>
            GitHub
          </a>
          {takesAccessRequests ? (
            <Link href="/#access" className={cn(pillClass("primary"), "ml-2")}>
              {t.nav.access}
            </Link>
          ) : (
            <Link href="/overview" className={cn(pillClass("primary"), "ml-2")}>
              {t.nav.dashboard}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const { m } = await getI18n();
  const t = m.marketing;
  return (
    <footer className="mx-auto mt-24 flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-5 px-5 py-10 text-[13px] text-muted sm:px-8">
      <Logo tone="color" className="text-ink" />
      <p>{t.footer.disclaimer}</p>
      <nav aria-label={t.footer.label} className="flex gap-5">
        <a href={site.repo} className="hover:text-ink">
          GitHub
        </a>
        <Link href="/alternatives" className="hover:text-ink">
          {t.footer.alternatives}
        </Link>
        <Link href="/guides" className="hover:text-ink">
          {m.guides.nav}
        </Link>
        <a href={`${site.repo}/blob/main/LICENSE`} className="hover:text-ink">
          {t.footer.license}
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <LanguageSwitch />
        <ThemeSwitch />
      </div>
    </footer>
  );
}

/** The pages a comparison's claims were read from. */
export function Sources({ title, intro, sources }: { title: string; intro: string; sources: string[] }) {
  return (
    <section className="pt-16">
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-2 text-[13px] text-muted">{intro}</p>
      <ul className="mt-3 space-y-1 text-[13px] break-all text-muted">
        {sources.map((source) => (
          <li key={source}>
            {source.startsWith("https://") ? (
              <a
                href={source}
                rel="noreferrer nofollow"
                className="underline underline-offset-2 hover:text-ink"
              >
                {source}
              </a>
            ) : (
              source
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export { pillClass };
