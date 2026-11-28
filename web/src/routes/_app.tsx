import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { Suspense } from "react";
import { NAV, type NavId } from "@/config/navigation";
import { clearSampleData, signOut } from "../api/mutations";
import { navQuery, sessionQuery } from "../api/queries";
import { Logo } from "../brand/logo";
import { ExtensionSetupButton } from "../features/extension/setup-button";
import { UpdatePrompt } from "../features/extension/update-prompt";
import { currentLocale, useI18n } from "../i18n";
import { mayOpen, VISITOR_HOME, VISITOR_PAGES } from "../roles";
import { CommandMenu } from "../shell/command-menu";
import { KeepFresh } from "../shell/keep-fresh";
import { LanguageSwitch, ThemeSwitch } from "../shell/preferences";
import { RefusedNotice } from "../shell/refused";
import { SidebarNav } from "../shell/sidebar";
import { color, radius, text } from "../tokens.stylex";
import { ConfirmButton } from "../ui/actions";
import { Button } from "../ui/button";
import { Loading } from "../ui/primitives";

/**
 * The frame around every page of the dashboard: the menu, the command menu,
 * the notices that concern every page. It opens for the host, and for a
 * visitor when this instance offers the demo; anyone else is sent to sign in.
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context: { queryClient }, location }) => {
    const session = await queryClient.ensureQueryData(sessionQuery);
    if (!session.signedIn && !session.demo) throw redirect({ to: "/login" });
    // A visitor has two pages: any other address leads back to the first.
    if (!mayOpen(session.role, location.pathname)) throw redirect({ to: VISITOR_HOME });
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
  // An admin on a phone signs out from Settings; a visitor has no Settings, so the way out stays.
  shown: { display: "flex" },
  account: {
    display: { default: "none", [WIDE]: "flex" },
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    paddingInline: "0.5rem",
  },
  who: { minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: color.muted, fontSize: text.sm },
});

function AppFrame() {
  const { m } = useI18n();
  const { data: session } = useSuspenseQuery(sessionQuery);
  const visitor = session.role === "visitor";
  // What only an admin's session can use: the sync, the extension, the sample data.
  const admin = session.signedIn && !visitor;
  // The tab is named after the page of the menu that is open.
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const page = NAV.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const title = page ? `${m.common.nav[page.id]} · Innkeep` : "Innkeep";
  return (
    <div {...stylex.props(styles.frame)}>
      <title>{title}</title>
      {admin && <KeepFresh />}
      <a href="#main" {...stylex.props(styles.skip)}>
        {m.common.nav.skipToContent}
      </a>
      <aside {...stylex.props(styles.aside)}>
        <div {...stylex.props(styles.top)}>
          <Link to={visitor ? VISITOR_HOME : "/overview"} {...stylex.props(styles.home)}>
            <Logo tone="color" />
          </Link>
          <div {...stylex.props(styles.search)}>
            <CommandMenu canSync={admin} only={visitor ? VISITOR_PAGES : undefined} />
          </div>
        </div>
        <Menu only={visitor ? VISITOR_PAGES : undefined} />
        <div {...stylex.props(styles.switches)}>
          <ThemeSwitch />
          <LanguageSwitch />
        </div>
        {session.signedIn && <SignOut name={session.member?.name} always={visitor} />}
      </aside>
      <div {...stylex.props(styles.column)}>
        {session.demo && <DemoBanner />}
        {admin && <SampleDataBanner />}
        {/* The host's own: their words arrive after the frame, and nothing waits for them. */}
        {admin && (
          <Suspense>
            <UpdatePrompt />
          </Suspense>
        )}
        <main id="main" {...stylex.props(styles.main)}>
          {/* A page's own text and data arrive inside the frame, which is already on screen. */}
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
        {admin && (
          <Suspense>
            <ExtensionSetupButton />
          </Suspense>
        )}
      </div>
      <RefusedNotice readOnly={visitor} />
    </div>
  );
}

/** The menu shows at once; its counts are added when they arrive. */
function Menu({ only }: { only?: readonly NavId[] }) {
  const { locale } = useI18n();
  const { data } = useQuery(navQuery(locale));
  return (
    <SidebarNav only={only} badges={data && { "/suggestions": data.urgent, "/settings": data.toRefresh }} />
  );
}

/** Who is signed in, and the way out. */
function SignOut({ name, always }: { name?: string; always?: boolean }) {
  const { m } = useI18n();
  const navigate = useNavigate();
  const leave = useMutation(signOut);
  return (
    <div {...stylex.props(styles.account, always && styles.shown)}>
      {name && <span {...stylex.props(styles.who)}>{name}</span>}
      <Button
        variant="ghost"
        size="sm"
        disabled={leave.isPending}
        onClick={() => leave.mutate(undefined, { onSuccess: () => navigate({ to: "/login" }) })}
      >
        {m.common.account.signOut}
      </Button>
    </div>
  );
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
        <Link to="/login" {...stylex.props(styles.quietLink)}>
          {m.demo.signIn}
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
