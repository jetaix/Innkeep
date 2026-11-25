import * as stylex from "@stylexjs/stylex";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Brand } from "../brand/glass";
import { Logo } from "../brand/logo";
import { pillStyle } from "../brand/pill";
import { loadMessages, useI18n } from "../i18n";
import { LanguageSwitch, ThemeSwitch } from "../shell/preferences";
import { site, takesAccessRequests } from "../site";
import { color, text } from "../tokens.stylex";

/**
 * The frame of the public pages (the landing page, the guides, the
 * comparisons): the brand's colours and display face, the header and the
 * footer. A page fills the space between the two.
 */
export const Route = createFileRoute("/_site")({
  // Waited for, so a page's head tags and its static HTML have their words.
  loader: () => loadMessages("marketing", "alternatives", "guides", "ai", "design"),
  component: SiteFrame,
});

const SMALL = "@media (min-width: 40rem)";
const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  frame: { minHeight: "100dvh", overflowX: "clip" },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    paddingTop: "0.75rem",
    paddingInline: { default: "0.75rem", [SMALL]: "1.25rem" },
  },
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    maxWidth: "72rem",
    height: "3.5rem",
    marginInline: "auto",
    paddingInlineStart: "1.25rem",
    paddingInlineEnd: "0.5rem",
    borderRadius: "999px",
    backgroundColor: `color-mix(in oklab, ${color.bg} 72%, transparent)`,
    boxShadow: `0 0 0 1px color-mix(in oklab, ${color.ink} 7%, transparent)`,
    backdropFilter: "blur(24px) saturate(1.5)",
  },
  home: { borderRadius: "999px", color: color.ink, textDecoration: "none" },
  nav: { display: "flex", alignItems: "center", gap: "0.125rem", fontSize: text.base },
  link: {
    padding: "0.375rem 0.75rem",
    borderRadius: "999px",
    color: { default: color.muted, ":hover": color.ink },
    textDecoration: "none",
    transitionProperty: "color",
    transitionDuration: "150ms",
  },
  // The page's own sections fit on a wide screen only; a phone keeps GitHub and the one action.
  wideOnly: { display: { default: "none", [WIDE]: "block" } },
  action: { marginInlineStart: "0.5rem" },
  short: { display: { default: "inline", [SMALL]: "none" } },
  long: { display: { default: "none", [SMALL]: "inline" } },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: "2rem",
    rowGap: "1.25rem",
    maxWidth: "72rem",
    marginTop: "6rem",
    marginInline: "auto",
    paddingBlock: "2.5rem",
    paddingInline: { default: "1.25rem", [SMALL]: "2rem" },
    color: color.muted,
    fontSize: text.base,
  },
  ink: { color: color.ink },
  plain: { margin: 0 },
  footNav: { display: "flex", flexWrap: "wrap", columnGap: "1.25rem", rowGap: "0.5rem" },
  footLink: { color: { default: "inherit", ":hover": color.ink }, textDecoration: "none" },
  switches: { display: "flex", alignItems: "center", gap: "0.5rem" },
});

function SiteFrame() {
  return (
    <Brand xstyle={styles.frame}>
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </Brand>
  );
}

function SiteHeader() {
  const { m } = useI18n("marketing", "alternatives", "guides", "ai");
  const t = m.marketing;
  return (
    <header {...stylex.props(styles.header)}>
      <div {...stylex.props(styles.bar)}>
        <Link to="/" {...stylex.props(styles.home)}>
          <Logo tone="color" />
        </Link>
        <nav aria-label={t.nav.label} {...stylex.props(styles.nav)}>
          <Link to="/" hash="features" {...stylex.props(styles.link, styles.wideOnly)}>
            {t.nav.features}
          </Link>
          <Link to="/" hash="limits" {...stylex.props(styles.link, styles.wideOnly)}>
            {t.nav.limits}
          </Link>
          <Link to="/alternatives" {...stylex.props(styles.link, styles.wideOnly)}>
            {m.alternatives.nav.alternatives}
          </Link>
          <Link to="/guides" {...stylex.props(styles.link, styles.wideOnly)}>
            {m.guides.nav}
          </Link>
          <Link to="/ai" {...stylex.props(styles.link, styles.wideOnly)}>
            {m.ai.nav}
          </Link>
          <a href={site.repo} {...stylex.props(styles.link)}>
            GitHub
          </a>
          {takesAccessRequests ? (
            <Link to="/" hash="access" {...stylex.props(pillStyle("primary"), styles.action)}>
              <span {...stylex.props(styles.short)}>{t.nav.accessShort}</span>
              <span {...stylex.props(styles.long)}>{t.nav.access}</span>
            </Link>
          ) : (
            <Link to="/overview" {...stylex.props(pillStyle("primary"), styles.action)}>
              {t.nav.dashboard}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const { m } = useI18n("marketing", "ai", "design", "guides");
  const t = m.marketing;
  return (
    <footer {...stylex.props(styles.footer)}>
      <Logo tone="color" xstyle={styles.ink} />
      <p {...stylex.props(styles.plain)}>{t.footer.disclaimer}</p>
      <nav aria-label={t.footer.label} {...stylex.props(styles.footNav)}>
        <a href={site.repo} {...stylex.props(styles.footLink)}>
          GitHub
        </a>
        <Link to="/alternatives" {...stylex.props(styles.footLink)}>
          {t.footer.alternatives}
        </Link>
        <Link to="/ai" {...stylex.props(styles.footLink)}>
          {m.ai.nav}
        </Link>
        <Link to="/design" {...stylex.props(styles.footLink)}>
          {m.design.nav}
        </Link>
        <Link to="/guides" {...stylex.props(styles.footLink)}>
          {m.guides.nav}
        </Link>
        <a href={`${site.repo}/blob/main/LICENSE`} {...stylex.props(styles.footLink)}>
          {t.footer.license}
        </a>
      </nav>
      <div {...stylex.props(styles.switches)}>
        <LanguageSwitch />
        <ThemeSwitch />
      </div>
    </footer>
  );
}
