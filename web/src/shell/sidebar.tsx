import * as stylex from "@stylexjs/stylex";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { NAV } from "@/config/navigation";
import { useI18n } from "../i18n";
import { color, radius, text } from "../tokens.stylex";
import { Hidden } from "../ui/primitives";

const WIDE = "@media (min-width: 48rem)";
const COARSE = "@media (pointer: coarse)";

const styles = stylex.create({
  // A strip that scrolls sideways on a phone, a column beside the page on a wider screen.
  nav: {
    position: "relative",
    display: "flex",
    flexDirection: { default: "row", [WIDE]: "column" },
    gap: "0.125rem",
    overflowX: { default: "auto", [WIDE]: "visible" },
  },
  item: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: "0.625rem",
    height: { default: "2rem", [COARSE]: "2.5rem" },
    paddingInline: "0.625rem",
    borderRadius: radius.md,
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${color.sunken} 60%, transparent)`,
    },
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "none",
    transitionProperty: "background-color, color",
    transitionDuration: "150ms",
  },
  current: {
    backgroundColor: { default: color.sunken, ":hover": color.sunken },
    color: color.ink,
  },
  label: { flexGrow: 1 },
  count: {
    paddingInline: "0.375rem",
    borderRadius: radius.full,
    backgroundColor: color.ink,
    color: color.inverse,
    fontSize: text.xs,
    fontWeight: 600,
    lineHeight: "1rem",
    fontVariantNumeric: "tabular-nums",
  },
});

export function SidebarNav({ badges }: { badges?: Partial<Record<string, number>> }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
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
    <nav ref={strip} aria-label={m.common.nav.main} {...stylex.props(styles.nav)}>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const count = badges?.[item.href];
        const label = m.common.nav[item.id];
        return (
          <Link
            key={item.href}
            to={item.href}
            aria-current={active ? "page" : undefined}
            title={m.common.nav.shortcut(label, item.key.toUpperCase())}
            {...stylex.props(styles.item, active && styles.current)}
          >
            <item.icon aria-hidden size={16} strokeWidth={1.75} />
            <span {...stylex.props(styles.label)}>{label}</span>
            {count ? (
              <span {...stylex.props(styles.count)}>
                {count}
                <Hidden> {m.common.nav.needAttention}</Hidden>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
