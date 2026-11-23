import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { Logo } from "@/components/brand/logo";
import { CommandMenu } from "@/components/shell/command-menu";
import { SidebarNav } from "@/components/shell/sidebar";
import { getSuggestions } from "@/features/insights/queries";
import { ConfirmButton } from "@/components/ui/actions";
import { hasSampleData } from "@/db/seed";
import { removeSampleDataAction, syncAllAction, syncIfStale } from "@/features/properties/actions";
import { KeepFresh } from "@/components/shell/keep-fresh";
import { LanguageSwitch, ThemeSwitch } from "@/components/shell/preferences";
import { getI18n } from "@/i18n/server";
import { ExtensionSetupButton } from "@/features/extension/setup-button";
import { UpdatePrompt } from "@/features/extension/update-prompt";
import { countToRefresh, getDataSources } from "@/features/freshness/sources";

/** A host's own dashboard is nobody else's business: keep it out of search results. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { m } = await getI18n();
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <KeepFresh syncIfStale={syncIfStale} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-inverse"
      >
        {m.common.nav.skipToContent}
      </a>
      <aside className="flex shrink-0 flex-col gap-3 border-b border-line bg-subtle px-3 py-3 md:sticky md:top-0 md:h-dvh md:w-56 md:border-r md:border-b-0 print:hidden">
        {/* One row on a phone, so the page itself starts higher up. */}
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3">
          <Link href="/overview" className="shrink-0 rounded-md px-2 py-1 md:self-start">
            <Logo />
          </Link>
          <div className="min-w-0 flex-1">
            <CommandMenu syncAction={syncAllAction} />
          </div>
        </div>
        {/* The outer boundary lets the fallback itself read the pathname on dynamic routes. */}
        <Suspense>
          <Suspense fallback={<SidebarNav />}>
            <NavWithBadges />
          </Suspense>
        </Suspense>
        {/* On small screens the sidebar is a strip; the same switches are on the Settings page. */}
        <div className="mt-auto hidden space-y-1.5 md:block">
          <ThemeSwitch />
          <LanguageSwitch />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense>
          <SampleDataBanner />
        </Suspense>
        <Suspense>
          <UpdatePrompt />
        </Suspense>
        <main id="main" className="min-w-0 flex-1 px-4 pt-6 pb-20 md:px-8">
          {children}
        </main>
        <Suspense>
          <ExtensionSetupButton />
        </Suspense>
      </div>
    </div>
  );
}

/** Shown on every page while sample data is loaded, so it is never mistaken for real bookings. */
async function SampleDataBanner() {
  await connection();
  if (!(await hasSampleData())) return null;
  const { m } = await getI18n();
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-warn-bg px-4 py-2 text-[13px] text-warn md:px-8"
    >
      <p>
        <strong className="font-semibold">{m.common.sample.title}</strong> {m.common.sample.body}
      </p>
      <form action={removeSampleDataAction}>
        <ConfirmButton size="sm" message={m.common.sample.confirm}>
          {m.common.sample.remove}
        </ConfirmButton>
      </form>
    </div>
  );
}

async function NavWithBadges() {
  await connection();
  const urgent = (await getSuggestions((await getI18n()).locale)).active.filter(
    (suggestion) => suggestion.severity === "urgent",
  ).length;
  const toRefresh = countToRefresh(await getDataSources());
  return <SidebarNav badges={{ "/suggestions": urgent, "/settings": toRefresh }} />;
}
