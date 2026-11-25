import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Suspense } from "react";
import { NAV } from "@/config/navigation";
import { clearSampleData } from "../api/mutations";
import { navQuery, sessionQuery } from "../api/queries";
import { Logo } from "../brand/logo";
import { currentLocale, useI18n } from "../i18n";
import { CommandMenu } from "../shell/command-menu";
import { KeepFresh } from "../shell/keep-fresh";
import { LanguageSwitch, ThemeSwitch } from "../shell/preferences";
import { RefusedNotice } from "../shell/refused";
import { SidebarNav } from "../shell/sidebar";
import { color, radius, text } from "../tokens.stylex";
import { ConfirmButton } from "../ui/actions";
import { Loading } from "../ui/primitives";

/**
 * The frame around every page of the dashboard: the menu, the command menu,
 * the notices that concern every page. It opens for the host, and for a
 * visitor when this instance offers the demo; anyone else is sent to sign in.
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQuery);
    if (!session.signedIn && !session.demo) throw redirect({ to: "/login" });
  },
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(navQuery(currentLocale()));
  },
  component: AppFrame,
});

const WIDE = "@media (min-width: 48rem)";
const PRINT = "@media print";

const styles = stylex.create({
  frame: { display: "flex", flexDirection: { default: "column", [WIDE]: "row" }, minHeight: "100dvh" },
  skip: {
    position: { default: "absolute", ":focus": "fixed" },
    top: "0.5rem",
    left: "0.5rem",
    zIndex: 50,
    width: { default: 1, ":focus": "auto" },
    height: { default: 1, ":focus": "auto" },
    overflow: "hidden",
    clipPath: { default: "inset(50%)", ":focus": "none" },
    padding: { default: 0, ":focus": "0.5rem 0.75rem" },
    borderRadius: radius.md,
    backgroundColor: color.ink,
    color: color.inverse,
    whiteSpace: "nowrap",
  },
  aside: {
    display: { default: "flex", [PRINT]: "none" },
    flexDirection: "column",
    flexShrink: 0,
    gap: "0.75rem",
    // The menu stands on the ground itself; only the page's panels are white.
    padding: { default: "0.75rem", [WIDE]: "1.25rem 0.75rem 1rem 1rem" },
    position: { default: "static", [WIDE]: "sticky" },
    top: 0,
    width: { default: "auto", [WIDE]: "15rem" },
    height: { default: "auto", [WIDE]: "100dvh" },
  },
  // One row on a phone, so the page itself starts higher up.
  top: {
    display: "flex",
    flexDirection: { default: "row", [WIDE]: "column" },
    alignItems: { default: "center", [WIDE]: "stretch" },
    gap: { default: "0.5rem", [WIDE]: "0.75rem" },
  },
  home: {
    flexShrink: 0,
    alignSelf: { default: "auto", [WIDE]: "flex-start" },
    padding: "0.25rem 0.5rem",
    borderRadius: radius.full,
    color: color.ink,
    textDecoration: "none",
  },
  search: { flexGrow: 1, minWidth: 0 },
  // On small screens the menu is a strip; the same switches are on the Settings page.
  switches: {
    display: { default: "none", [WIDE]: "flex" },
    flexDirection: "column",
    gap: "0.375rem",
    marginTop: "auto",
  },
  column: { display: "flex", flexDirection: "column", flexGrow: 1, minWidth: 0 },
  main: {
    flexGrow: 1,
    minWidth: 0,
    width: "100%",
    maxWidth: "88rem",
    paddingTop: { default: "1rem", [WIDE]: "1.75rem" },
    paddingBottom: "5rem",
    paddingInline: { default: "1rem", [WIDE]: "1.5rem 2rem" },
  },
  banner: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: "1rem",
    rowGap: "0.5rem",
    marginTop: { default: "0.75rem", [WIDE]: "1.25rem" },
    marginInline: { default: "1rem", [WIDE]: "1.5rem 2rem" },
    padding: "0.5rem 0.5rem 0.5rem 1rem",
    borderRadius: radius.xl,
    backgroundColor: color.sunken,
    fontSize: text.base,
  },
  sample: { backgroundColor: color.warnBg, color: color.warn },
  plain: { margin: 0 },
  links: { display: "flex", flexWrap: "wrap", columnGap: "1rem", margin: 0 },
  link: { color: color.ink, fontWeight: 500, textUnderlineOffset: 2 },
  quietLink: { color: { default: color.muted, ":hover": color.ink }, textUnderlineOffset: 2 },
  strong: { fontWeight: 600 },
});

function AppFrame() {
  const { m } = useI18n();
  const { data: session } = useSuspenseQuery(sessionQuery);
  // The tab is named after the page of the menu that is open.
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const page = NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = page ? `${m.common.nav[page.id]} · Innkeep` : "Innkeep";
  return (
    <div {...stylex.props(styles.frame)}>
      <title>{title}</title>
      {session.signedIn && <KeepFresh />}
      <a href="#main" {...stylex.props(styles.skip)}>
        {m.common.nav.skipToContent}
      </a>
      <aside {...stylex.props(styles.aside)}>
        <div {...stylex.props(styles.top)}>
          <Link to="/overview" {...stylex.props(styles.home)}>
            <Logo tone="color" />
          </Link>
          <div {...stylex.props(styles.search)}>
            <CommandMenu canSync={session.signedIn} />
          </div>
        </div>
        <Menu />
        <div {...stylex.props(styles.switches)}>
          <ThemeSwitch />
          <LanguageSwitch />
        </div>
      </aside>
      <div {...stylex.props(styles.column)}>
        {session.demo && <DemoBanner />}
        {session.signedIn && <SampleDataBanner />}
        <main id="main" {...stylex.props(styles.main)}>
          {/* A page's own text and data arrive inside the frame, which is already on screen. */}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <RefusedNotice />
    </div>
  );
}

/** The menu shows at once; its counts are added when they arrive. */
function Menu() {
  const { locale } = useI18n();
  const { data } = useQuery(navQuery(locale));
  return <SidebarNav badges={data && { "/suggestions": data.urgent, "/settings": data.toRefresh }} />;
}

/** Tells a visitor of the public demo what they are looking at. */
function DemoBanner() {
  const { m } = useI18n();
  return (
    <div role="status" {...stylex.props(styles.banner)}>
      <p {...stylex.props(styles.plain)}>{m.demo.banner}</p>
      <p {...stylex.props(styles.links)}>
        <Link to="/" hash="access" {...stylex.props(styles.link)}>
          {m.demo.access}
        </Link>
        <Link to="/" {...stylex.props(styles.quietLink)}>
          {m.demo.back}
        </Link>
      </p>
    </div>
  );
}

/** Shown on every page while sample data is loaded, so it is never mistaken for real bookings. */
function SampleDataBanner() {
  const { m, locale } = useI18n();
  const { data } = useQuery(navQuery(locale));
  const remove = useMutation(clearSampleData);
  if (!data?.sample) return null;
  return (
    <div role="status" {...stylex.props(styles.banner, styles.sample)}>
      <p {...stylex.props(styles.plain)}>
        <strong {...stylex.props(styles.strong)}>{m.common.sample.title}</strong> {m.common.sample.body}
      </p>
      <ConfirmButton
        size="sm"
        message={m.common.sample.confirm}
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      >
        {m.common.sample.remove}
      </ConfirmButton>
    </div>
  );
}
