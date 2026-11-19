import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch, ThemeSwitch } from "@/components/shell/preferences";
import { buttonClass } from "@/components/ui/button";
import { site } from "@/config/site";
import { getI18n } from "@/i18n/server";

/** The header shared by the public pages: the landing page and the comparisons. */
export async function SiteHeader() {
  const { m } = await getI18n();
  const t = m.marketing;
  return (
    <header className="flex h-16 items-center justify-between gap-4">
      <Link href="/" className="rounded-md">
        <Logo />
      </Link>
      <nav aria-label={t.nav.label} className="flex items-center gap-1 text-[13px]">
        <Link href="/#features" className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:block">
          {t.nav.features}
        </Link>
        <Link href="/#limits" className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:block">
          {t.nav.limits}
        </Link>
        <Link
          href="/alternatives"
          className="hidden rounded-md px-3 py-1.5 text-muted hover:text-ink sm:block"
        >
          {m.alternatives.nav.alternatives}
        </Link>
        <a href={site.repo} className="rounded-md px-3 py-1.5 text-muted hover:text-ink">
          GitHub
        </a>
        <Link href="/overview" className={buttonClass({}, "ml-2")}>
          {t.nav.dashboard}
        </Link>
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const { m } = await getI18n();
  const t = m.marketing;
  return (
    <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-line py-8 text-[13px] text-muted">
      <Logo className="text-ink" />
      <p>{t.footer.disclaimer}</p>
      <nav aria-label={t.footer.label} className="flex gap-5">
        <a href={site.repo} className="hover:text-ink">
          GitHub
        </a>
        <Link href="/alternatives" className="hover:text-ink">
          {t.footer.alternatives}
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
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
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
