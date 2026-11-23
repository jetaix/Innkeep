"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { NAV } from "@/config/navigation";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";

export function SidebarNav({ badges }: { badges?: Partial<Record<string, number>> }) {
  const pathname = usePathname();
  const { m } = useI18n();
  // On a phone the menu is a strip that scrolls sideways: keep the current page in view.
  const strip = useRef<HTMLElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs again when the page changes
  useEffect(() => {
    const nav = strip.current;
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !current || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2 });
  }, [pathname]);
  return (
    <nav
      ref={strip}
      aria-label={m.common.nav.main}
      className="relative flex gap-0.5 overflow-x-auto md:flex-col md:overflow-visible"
    >
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const count = badges?.[item.href];
        const label = m.common.nav[item.id];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={m.common.nav.shortcut(label, item.key.toUpperCase())}
            className={cn(
              "flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors pointer-coarse:h-10",
              active ? "bg-sunken text-ink" : "text-muted hover:bg-sunken/60 hover:text-ink",
            )}
          >
            <item.icon aria-hidden className="size-4" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            {count ? (
              <span className="rounded-full bg-ink px-1.5 text-[11px] leading-4 font-semibold text-inverse tabular-nums">
                {count}
                <span className="sr-only"> {m.common.nav.needAttention}</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
