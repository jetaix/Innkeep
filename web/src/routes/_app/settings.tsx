import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NAV } from "@/config/navigation";
import { Access } from "../../features/settings/access";
import { Account } from "../../features/settings/account";
import { Members } from "../../features/settings/members";
import {
  freshnessQuery,
  membersQuery,
  propertiesQuery,
  sessionQuery,
  settingsQuery,
} from "../../api/queries";
import { TelegramFind } from "../../features/cleaning/telegram-find";
import { TelegramTest } from "../../features/cleaning/telegram-test";
import { DataSection } from "../../features/settings/data-section";
import { loadMessages, useI18n } from "../../i18n";
import { LanguageSwitch, ThemeSwitch } from "../../shell/preferences";
import { color, font, radius, shadow, text } from "../../tokens.stylex";
import { CopyButton } from "../../ui/actions";
import { Badge, Kbd, PageHeader } from "../../ui/primitives";

/** The page in four parts, one on screen at a time. The first is the default. */
const TABS = ["general", "connections", "assistant", "data"] as const;
type Tab = (typeof TABS)[number];
/** What the server is set up with is the host's to see: a visitor of the demo gets the other two. */
const HOST_ONLY: readonly Tab[] = ["connections", "assistant"];

export const Route = createFileRoute("/_app/settings")({
  validateSearch: (search: Record<string, unknown>): { tab?: Exclude<Tab, "general"> } => ({
    tab: TABS.find((value) => value !== "general" && value === search.tab) as
      | Exclude<Tab, "general">
      | undefined,
  }),
  // Started while this route's code downloads; the components read the same queries.
  loader: async ({ context: { queryClient } }) => {
    void loadMessages("settings", "data", "extension", "cleaning");
    const session = await queryClient.ensureQueryData(sessionQuery);
    return Promise.all([
      queryClient.ensureQueryData(freshnessQuery),
      queryClient.ensureQueryData(propertiesQuery),
      session.signedIn ? queryClient.ensureQueryData(settingsQuery) : null,
      session.signedIn ? queryClient.ensureQueryData(membersQuery) : null,
    ]);
  },
  component: SettingsPage,
});

// `@/config/site` reads the server's environment, so the address is written here.
const README = "https://github.com/jetaix/Innkeep#configuration";

const WIDE = "@media (min-width: 40rem)";
const COARSE = "@media (pointer: coarse)";

const DESK = "@media (min-width: 64rem)";

/*
 * The reading register: ground, ink and hairlines, no panels. Each part of
 * the page is a row, its name in the display face on the left and what it
 * holds on the right; on a phone the name sits above.
 */
const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "68rem" },
  tabs: {
    display: "flex",
    alignSelf: "flex-start",
    gap: "0.125rem",
    maxWidth: "100%",
    padding: "0.1875rem",
    overflowX: "auto",
    borderRadius: radius.full,
    backgroundColor: color.sunken,
    scrollbarWidth: "none",
  },
  tab: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    height: { default: "2rem", [COARSE]: "2.5rem" },
    paddingInline: "0.875rem",
    borderRadius: radius.full,
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "background-color, box-shadow, color",
    transitionDuration: "200ms",
  },
  current: { backgroundColor: color.panel, color: color.ink, boxShadow: shadow.card },
  parts: { display: "flex", flexDirection: "column", gap: "3rem" },
  section: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [DESK]: "minmax(0, 16rem) minmax(0, 1fr)" },
    columnGap: "3rem",
    rowGap: "1rem",
    alignItems: "start",
    paddingTop: "1.5rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.lineStrong,
  },
  stacked: { gridTemplateColumns: "minmax(0, 1fr)" },
  sectionTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.375rem",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    lineHeight: 1.25,
  },
  sectionNote: {
    maxWidth: "60ch",
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.6,
  },
  sectionBody: { minWidth: 0 },
  list: { margin: 0, padding: 0, listStyle: "none" },
  divided: {
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  preference: {
    display: "flex",
    flexDirection: { default: "column", [WIDE]: "row" },
    alignItems: { default: "stretch", [WIDE]: "center" },
    justifyContent: "space-between",
    gap: { default: "0.5rem", [WIDE]: "1.5rem" },
    paddingBlock: { default: "1rem", ":first-child": "0 1rem" },
  },
  preferenceText: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  name: { margin: 0, fontSize: "inherit", fontWeight: 500 },
  help: { margin: "0.125rem 0 0", color: color.muted, lineHeight: 1.6 },
  control: { flexShrink: 0, width: { default: "100%", [WIDE]: "15rem" } },
  integration: { paddingBlock: { default: "1.125rem", ":first-child": "0 1.125rem" } },
  integrationHead: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  variable: { marginInlineStart: "auto", color: color.muted, fontFamily: font.mono, fontSize: text.sm },
  body: { maxWidth: "65ch", marginTop: "0.375rem", color: color.muted, lineHeight: 1.6 },
  action: { marginTop: "0.75rem" },
  block: { display: "block", marginTop: "0.25rem" },
  link: { color: color.ink, textDecorationColor: color.lineStrong, textUnderlineOffset: 4 },
  footerLink: {
    color: color.ink,
    textDecorationColor: { default: color.lineStrong, ":hover": color.ink },
    textUnderlineOffset: 4,
  },
  mono: { fontFamily: font.mono },
  steps: { display: "block", marginTop: "0.75rem", color: color.ink, fontSize: text.sm, fontWeight: 500 },
  ordered: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    margin: "0.5rem 0 0",
    paddingInlineStart: "1.25rem",
    listStyleType: "decimal",
  },
  step: { "::marker": { color: color.ink, fontWeight: 500 } },
  where: { display: "block", marginTop: "0.5rem" },
  snippet: { display: "flex", alignItems: "flex-start", gap: "0.5rem", marginTop: "0.375rem" },
  // The one white surface of the page: a thing to copy as it is.
  code: {
    position: "relative",
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    margin: 0,
    padding: "0.75rem 0.875rem",
    overflowX: "auto",
    borderRadius: radius.slab,
    backgroundColor: color.panel,
    boxShadow: shadow.card,
    color: color.ink,
    fontFamily: font.mono,
    fontSize: text.sm,
    lineHeight: 1.625,
  },
  shortcuts: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", [WIDE]: "repeat(2, minmax(0, 1fr))" },
    columnGap: "2.5rem",
    margin: 0,
  },
  shortcut: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    paddingBlock: "0.5rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  term: { color: color.muted },
  keys: { display: "flex", flexShrink: 0, gap: "0.25rem", margin: 0 },
});

function SettingsPage() {
  const t = useI18n("settings").m.settings;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Settings />
    </>
  );
}

function Settings() {
  const { m } = useI18n("settings", "data");
  const t = m.settings;
  const { signedIn } = useSuspenseQuery(sessionQuery).data;
  const asked = Route.useSearch().tab ?? "general";
  const tabs = TABS.filter((value) => signedIn || !HOST_ONLY.includes(value));
  const tab: Tab = tabs.includes(asked) ? asked : "general";

  return (
    <div {...stylex.props(styles.page)}>
      <nav aria-label={t.tabs.label} {...stylex.props(styles.tabs)}>
        {tabs.map((value) => (
          <Link
            key={value}
            to="/settings"
            search={{ tab: value === "general" ? undefined : value }}
            aria-current={value === tab ? "page" : undefined}
            {...stylex.props(styles.tab, value === tab && styles.current)}
          >
            {t.tabs[value]}
          </Link>
        ))}
      </nav>

      {tab === "general" && <General />}
      {tab === "connections" && <Connections />}
      {tab === "assistant" && <Assistant />}
      {tab === "data" && (
        <Section id="data-heading" title={m.data.title} note={m.data.description} stacked>
          <DataSection />
        </Section>
      )}
    </div>
  );
}

function General() {
  const { m } = useI18n("settings");
  const t = m.settings;
  const { signedIn } = useSuspenseQuery(sessionQuery).data;

  return (
    <div {...stylex.props(styles.parts)}>
      <Section id="appearance-heading" title={t.appearance.title}>
        <div>
          <Preference label={m.common.preferences.theme} help={t.appearance.themeHelp}>
            <ThemeSwitch withLabels />
          </Preference>
          <Preference label={m.common.preferences.language} help={t.appearance.languageHelp}>
            <LanguageSwitch withLabels />
          </Preference>
        </div>
      </Section>
      {signedIn && (
        <Section id="account-heading" title={t.account.title} note={t.account.note} stacked>
          <Account />
        </Section>
      )}
      {signedIn && <BetaAccess />}
      {signedIn && (
        <Section id="members-heading" title={t.members.title} note={t.members.note} stacked>
          <Members />
        </Section>
      )}
      <Section id="shortcuts-heading" title={t.shortcuts.title}>
        <dl {...stylex.props(styles.shortcuts)}>
          <Shortcut keys={["⌘", "K"]}>{t.shortcuts.commandMenu}</Shortcut>
          {NAV.map((item) => (
            <Shortcut key={item.href} keys={["G", item.key.toUpperCase()]}>
              {t.shortcuts.goTo(m.common.nav[item.id])}
            </Shortcut>
          ))}
          <Shortcut keys={["N"]}>{t.shortcuts.add}</Shortcut>
          <Shortcut keys={["←", "→"]}>{t.shortcuts.move}</Shortcut>
          <Shortcut keys={["T"]}>{t.shortcuts.today}</Shortcut>
          <Shortcut keys={["Esc"]}>{t.shortcuts.close}</Shortcut>
        </dl>
      </Section>
    </div>
  );
}

/** Who may create an account while sign-up is in beta: shown in the host's own space only. */
function BetaAccess() {
  const t = useI18n("settings").m.settings.access;
  const { hostSpace, signUp } = useSuspenseQuery(settingsQuery).data;
  if (!hostSpace || signUp !== "beta") return null;
  return (
    <Section id="access-heading" title={t.title} note={t.note} stacked>
      <Access />
    </Section>
  );
}

/** What the server is connected to. Read from its environment, so only the host is shown it. */
function Connections() {
  const { m } = useI18n("settings", "cleaning");
  const t = m.settings;
  const i = t.integrations;
  const state = (on: boolean) => (on ? i.on : i.off);
  const { sync, extensionTokenSet, telegram, claude, hostSpace } = useSuspenseQuery(settingsQuery).data;
  // The variables are the server's: named only to the host, who can set them.
  const named = (variable: string) => (hostSpace ? variable : undefined);
  const telegramChat = telegram.bot ? telegram.chat : null;
  const telegramOn = telegramChat !== null;

  return (
    <Section id="connections-heading" title={t.tabs.connections} note={hostSpace ? <Footer /> : undefined}>
      <ul {...stylex.props(styles.list)}>
        <Integration
          name={i.sync.name}
          on={sync.hosted ? sync.scheduled : sync.interval > 0}
          status={
            sync.hosted ? i.sync.scheduled : sync.interval > 0 ? i.sync.every(sync.interval) : i.sync.manual
          }
          variable={named(sync.hosted ? "CRON_SECRET" : "SYNC_INTERVAL_MINUTES")}
        >
          {i.sync.body}
        </Integration>
        <Integration
          name={i.extension.name}
          on={extensionTokenSet}
          status={state(extensionTokenSet)}
          variable={named("EXTENSION_TOKEN")}
        >
          {i.extension.body}{" "}
          <Link to="/extension" {...stylex.props(styles.link)}>
            {i.extension.link}
          </Link>
        </Integration>
        <Integration
          name={i.telegram.name}
          on={telegramOn}
          status={state(telegramOn)}
          variable={named("TELEGRAM_BOT_TOKEN")}
        >
          {i.telegram.body}
          {telegramOn && telegramChat?.title && (
            <span {...stylex.props(styles.block)}>{m.cleaning.telegram.writesTo(telegramChat.title)}</span>
          )}
          {telegramOn && <TelegramTest />}
          {telegram.bot && !telegramChat && <TelegramFind />}
        </Integration>
        <Integration
          name={i.ai.name}
          on={claude.configured}
          status={claude.configured ? claude.model : i.off}
          variable={named("ANTHROPIC_API_KEY")}
        >
          {i.ai.body}
        </Integration>
      </ul>
    </Section>
  );
}

/** How to let an AI assistant read this Innkeep over MCP. */
function Assistant() {
  const t = useI18n("settings").m.settings;
  const i = t.integrations;
  const { mcpTokenSet: mcpOn, mcpToken, hostSpace, sync, appUrl } = useSuspenseQuery(settingsQuery).data;
  // A space other than the host's has a token of its own, ready in the commands below.
  const token = mcpToken ?? "YOUR_MCP_TOKEN";
  const mcpUrl = `${appUrl ?? window.location.origin}/api/mcp`;
  const bearer = `Authorization: Bearer ${token}`;
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const mcpSnippets = [
    {
      text: i.mcp.claudeCode(mcpToken != null),
      code: `claude mcp add --transport http innkeep ${mcpUrl} --header "${bearer}"`,
    },
    {
      // Claude Desktop starts servers as local commands: mcp-remote bridges to the HTTP address.
      text: i.mcp.desktop(mcpToken != null),
      code: json({
        mcpServers: {
          innkeep: {
            command: "npx",
            // No space inside the argument: some systems split it there. The value comes from `env`.
            // biome-ignore lint/suspicious/noTemplateCurlyInString: mcp-remote fills this in, not JavaScript
            args: ["-y", "mcp-remote", mcpUrl, "--header", "Authorization:${AUTH_HEADER}"],
            env: { AUTH_HEADER: `Bearer ${token}` },
          },
        },
      }),
    },
    {
      text: i.mcp.other,
      code: json({
        mcpServers: { innkeep: { type: "http", url: mcpUrl, headers: { Authorization: bearer.slice(15) } } },
      }),
    },
  ];

  return (
    <Section id="assistant-heading" title={t.tabs.assistant} note={hostSpace ? <Footer /> : undefined}>
      <ul {...stylex.props(styles.list)}>
        <Integration
          name={i.mcp.name}
          on={mcpOn}
          status={mcpOn ? i.on : i.off}
          variable={hostSpace ? "MCP_TOKEN" : undefined}
        >
          {i.mcp.body}
          <span {...stylex.props(styles.steps)}>{i.mcp.steps}</span>
          <ol {...stylex.props(styles.ordered)}>
            <li {...stylex.props(styles.step)}>
              {mcpToken ? (
                i.mcp.tokenOwn
              ) : mcpOn ? (
                i.mcp.tokenSet
              ) : (
                <>
                  {i.mcp.token}
                  <Snippet code="openssl rand -hex 32" />
                  <span {...stylex.props(styles.where)}>
                    {sync.hosted ? i.mcp.whereHosted : i.mcp.whereSelf}
                  </span>
                </>
              )}
            </li>
            {mcpSnippets.map((snippet) => (
              <li key={snippet.text} {...stylex.props(styles.step)}>
                {snippet.text}
                <Snippet code={snippet.code} />
              </li>
            ))}
            <li {...stylex.props(styles.step)}>{i.mcp.tryIt}</li>
          </ol>
        </Integration>
      </ul>
    </Section>
  );
}

/** Where the variables named on the cards are changed. */
function Footer() {
  const i = useI18n("settings").m.settings.integrations;
  return (
    <>
      {i.footer.beforeFile} <code {...stylex.props(styles.mono)}>.env</code> {i.footer.afterFile}{" "}
      <a href={README} {...stylex.props(styles.footerLink)}>
        {i.footer.link}
      </a>{" "}
      {i.footer.after}
    </>
  );
}

/** One part of the page: its name and what to know about it beside what it holds. */
function Section({
  id,
  title,
  note,
  stacked,
  children,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  /** The name above instead of beside, for a part too wide to share a row. */
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} {...stylex.props(styles.section, stacked && styles.stacked)}>
      <div>
        <h2 id={id} {...stylex.props(styles.sectionTitle)}>
          {title}
        </h2>
        {note && <p {...stylex.props(styles.sectionNote)}>{note}</p>}
      </div>
      <div {...stylex.props(styles.sectionBody)}>{children}</div>
    </section>
  );
}

/** One appearance choice: what it is and how long it lasts on the left, the switch on the right. */
function Preference({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.divided, styles.preference)}>
      <div {...stylex.props(styles.preferenceText)}>
        <h3 {...stylex.props(styles.name)}>{label}</h3>
        <p {...stylex.props(styles.help)}>{help}</p>
      </div>
      <div {...stylex.props(styles.control)}>{children}</div>
    </div>
  );
}

function Integration({
  name,
  on,
  status,
  variable,
  children,
}: {
  name: string;
  on: boolean;
  status: string;
  /** The server's variable that switches it on, for the host who can set it. */
  variable?: string;
  children: ReactNode;
}) {
  return (
    <li {...stylex.props(styles.divided, styles.integration)}>
      <div {...stylex.props(styles.integrationHead)}>
        <h3 {...stylex.props(styles.name)}>{name}</h3>
        <Badge tone={on ? "good" : "neutral"}>{status}</Badge>
        {variable && <code {...stylex.props(styles.variable)}>{variable}</code>}
      </div>
      <div {...stylex.props(styles.body)}>{children}</div>
    </li>
  );
}

/** A command or a piece of configuration to copy as it is. */
function Snippet({ code }: { code: string }) {
  return (
    <span {...stylex.props(styles.snippet)}>
      <pre {...stylex.props(styles.code)}>{code}</pre>
      <CopyButton value={code} />
    </span>
  );
}

function Shortcut({ keys, children }: { keys: string[]; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.shortcut)}>
      <dt {...stylex.props(styles.term)}>{children}</dt>
      <dd {...stylex.props(styles.keys)}>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </dd>
    </div>
  );
}
