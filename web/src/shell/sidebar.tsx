import * as stylex from "@stylexjs/stylex";
import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { NAV, type NavId } from "@/config/navigation";
import { useI18n } from "../i18n";
import { color, radius, shadow, text } from "../tokens.stylex";
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
    // Room for the lifted pill's shadow inside the strip that scrolls.
    padding: { default: "0.25rem", [WIDE]: 0 },
    margin: { default: "-0.25rem", [WIDE]: 0 },
    overflowX: { default: "auto", [WIDE]: "visible" },
    scrollbarWidth: "none",
  },
  item: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    gap: "0.625rem",
    height: { default: "2.125rem", [COARSE]: "2.5rem" },
    paddingInline: "0.75rem",
    borderRadius: radius.full,
    backgroundColor: {
      default: "transparent",
      ":hover": `color-mix(in oklab, ${color.sunken} 70%, transparent)`,
    },
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "none",
    transitionProperty: "background-color, box-shadow, color",
    transitionDuration: "200ms",
  },
  // The page that is open is a white pill lifted off the ground.
  current: {
    backgroundColor: { default: color.panel, ":hover": color.panel },
    color: color.ink,
    boxShadow: shadow.card,
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

export function SidebarNav({
  badges,
  only,
}: {
  badges?: Partial<Record<string, number>>;
  /** The pages this person has, when their role does not give them all. */
  only?: readonly NavId[];
}) {
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
      {NAV.filter((item) => !only || only.includes(item.id)).map((item) => {
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
