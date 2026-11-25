import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { NAV } from "@/config/navigation";
import { signOut } from "../../api/mutations";
import { freshnessQuery, propertiesQuery, sessionQuery, settingsQuery } from "../../api/queries";
import { TelegramFind } from "../../features/cleaning/telegram-find";
import { TelegramTest } from "../../features/cleaning/telegram-test";
import { DataSection } from "../../features/settings/data-section";
import { loadMessages, useI18n } from "../../i18n";
import { LanguageSwitch, ThemeSwitch } from "../../shell/preferences";
import { color, font, radius, text } from "../../tokens.stylex";
import { CopyButton, SubmitButton } from "../../ui/actions";
import { Badge, Card, Kbd, Notice, PageHeader, SectionTitle } from "../../ui/primitives";

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
    ]);
  },
  component: SettingsPage,
});

// `@/config/site` reads the server's environment, so the address is written here.
const README = "https://github.com/jetaix/Innkeep#configuration";

const WIDE = "@media (min-width: 40rem)";
const COARSE = "@media (pointer: coarse)";

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "48rem" },
  tabs: {
    display: "flex",
    gap: "0.25rem",
    overflowX: "auto",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  tab: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    height: { default: "2.25rem", [COARSE]: "2.75rem" },
    marginBottom: -1,
    paddingInline: "0.75rem",
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: "transparent",
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "color, border-color",
    transitionDuration: "150ms",
  },
  current: { borderBottomColor: color.ink, color: color.ink },
  head: {
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
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
    padding: "0.875rem 1rem",
  },
  preferenceText: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  name: { margin: 0, fontSize: "inherit", fontWeight: 500 },
  help: { margin: "0.125rem 0 0", color: color.muted, lineHeight: 1.625 },
  control: { flexShrink: 0, width: { default: "100%", [WIDE]: "15rem" } },
  integration: { padding: "0.875rem 1rem" },
  integrationHead: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  variable: { marginInlineStart: "auto", color: color.muted, fontFamily: font.mono, fontSize: text.sm },
  body: { maxWidth: "65ch", marginTop: "0.375rem", color: color.muted, lineHeight: 1.625 },
  action: { marginTop: "0.75rem" },
  block: { display: "block", marginTop: "0.25rem" },
  link: { color: color.ink, textUnderlineOffset: 2 },
  footer: {
    margin: 0,
    padding: "0.75rem 1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: text.sm,
  },
  footerLink: { color: { default: "inherit", ":hover": color.ink }, textUnderlineOffset: 2 },
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
  code: {
    position: "relative",
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    margin: 0,
    padding: "0.625rem",
    overflowX: "auto",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.md,
    backgroundColor: color.subtle,
    color: color.ink,
    fontFamily: font.mono,
    fontSize: text.sm,
    lineHeight: 1.625,
  },
  shortcuts: { margin: 0 },
  shortcut: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.5rem 1rem",
  },
  term: { color: color.muted },
  keys: { display: "flex", flexShrink: 0, gap: "0.25rem", margin: 0 },
  dataHead: { marginBottom: "1rem", paddingInline: "0.25rem" },
  dataTitle: { margin: 0, fontSize: "inherit", fontWeight: 600 },
  dataDescription: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.base },
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
        <section aria-labelledby="data-heading">
          <div {...stylex.props(styles.dataHead)}>
            <h2 id="data-heading" {...stylex.props(styles.dataTitle)}>
              {m.data.title}
            </h2>
            <p {...stylex.props(styles.dataDescription)}>{m.data.description}</p>
          </div>
          <DataSection />
        </section>
      )}
    </div>
  );
}

function General() {
  const { m } = useI18n("settings");
  const t = m.settings;
  const i = t.integrations;
  const { passwordSet } = useSuspenseQuery(sessionQuery).data;
  const navigate = useNavigate();
  const leave = useMutation(signOut);

  return (
    <>
      <Card>
        <div {...stylex.props(styles.head)}>
          <SectionTitle>{t.appearance.title}</SectionTitle>
        </div>
        <div>
          <Preference label={m.common.preferences.theme} help={t.appearance.themeHelp}>
            <ThemeSwitch withLabels />
          </Preference>
          <Preference label={m.common.preferences.language} help={t.appearance.languageHelp}>
            <LanguageSwitch withLabels />
          </Preference>
        </div>
      </Card>
      <Card>
        <div {...stylex.props(styles.head)}>
          <SectionTitle>{t.tabs.access}</SectionTitle>
        </div>
        <ul {...stylex.props(styles.list)}>
          <Integration
            name={i.password.name}
            on={passwordSet}
            status={passwordSet ? i.on : i.off}
            variable="APP_PASSWORD"
          >
            {i.password.body}
            {passwordSet && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  leave.mutate(undefined, { onSuccess: () => navigate({ to: "/login" }) });
                }}
                {...stylex.props(styles.action)}
              >
                <SubmitButton size="sm" pending={leave.isPending}>
                  {i.password.signOut}
                </SubmitButton>
              </form>
            )}
            {leave.error && (
              <Notice tone="critical" role="alert" xstyle={styles.action}>
                {leave.error.message}
              </Notice>
            )}
          </Integration>
        </ul>
      </Card>
      <Card>
        <div {...stylex.props(styles.head)}>
          <SectionTitle>{t.shortcuts.title}</SectionTitle>
        </div>
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
      </Card>
    </>
  );
}

/** What the server is connected to. Read from its environment, so only the host is shown it. */
function Connections() {
  const { m } = useI18n("settings", "cleaning");
  const t = m.settings;
  const i = t.integrations;
  const state = (on: boolean) => (on ? i.on : i.off);
  const { sync, extensionTokenSet, telegram, claude } = useSuspenseQuery(settingsQuery).data;
  const telegramChat = telegram.bot ? telegram.chat : null;
  const telegramOn = telegramChat !== null;

  return (
    <Card>
      <div {...stylex.props(styles.head)}>
        <SectionTitle>{t.tabs.connections}</SectionTitle>
      </div>
      <ul {...stylex.props(styles.list)}>
        <Integration
          name={i.sync.name}
          on={sync.hosted ? sync.scheduled : sync.interval > 0}
          status={
            sync.hosted ? i.sync.scheduled : sync.interval > 0 ? i.sync.every(sync.interval) : i.sync.manual
          }
          variable={sync.hosted ? "CRON_SECRET" : "SYNC_INTERVAL_MINUTES"}
        >
          {i.sync.body}
        </Integration>
        <Integration
          name={i.extension.name}
          on={extensionTokenSet}
          status={state(extensionTokenSet)}
          variable="EXTENSION_TOKEN"
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
          variable="TELEGRAM_BOT_TOKEN"
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
          variable="ANTHROPIC_API_KEY"
        >
          {i.ai.body}
        </Integration>
      </ul>
      <Footer />
    </Card>
  );
}

/** How to let an AI assistant read this Innkeep over MCP. */
function Assistant() {
  const t = useI18n("settings").m.settings;
  const i = t.integrations;
  const { mcpTokenSet: mcpOn, sync, appUrl } = useSuspenseQuery(settingsQuery).data;
  const mcpUrl = `${appUrl ?? window.location.origin}/api/mcp`;
  const bearer = "Authorization: Bearer YOUR_MCP_TOKEN";
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const mcpSnippets = [
    {
      text: i.mcp.claudeCode,
      code: `claude mcp add --transport http innkeep ${mcpUrl} --header "${bearer}"`,
    },
    {
      // Claude Desktop starts servers as local commands: mcp-remote bridges to the HTTP address.
      text: i.mcp.desktop,
      code: json({
        mcpServers: {
          innkeep: {
            command: "npx",
            // No space inside the argument: some systems split it there. The value comes from `env`.
            // biome-ignore lint/suspicious/noTemplateCurlyInString: mcp-remote fills this in, not JavaScript
            args: ["-y", "mcp-remote", mcpUrl, "--header", "Authorization:${AUTH_HEADER}"],
            env: { AUTH_HEADER: "Bearer YOUR_MCP_TOKEN" },
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
    <Card>
      <div {...stylex.props(styles.head)}>
        <SectionTitle>{t.tabs.assistant}</SectionTitle>
      </div>
      <ul {...stylex.props(styles.list)}>
        <Integration name={i.mcp.name} on={mcpOn} status={mcpOn ? i.on : i.off} variable="MCP_TOKEN">
          {i.mcp.body}
          <span {...stylex.props(styles.steps)}>{i.mcp.steps}</span>
          <ol {...stylex.props(styles.ordered)}>
            <li {...stylex.props(styles.step)}>
              {mcpOn ? (
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
      <Footer />
    </Card>
  );
}

/** Where the variables named on the cards are changed. */
function Footer() {
  const i = useI18n("settings").m.settings.integrations;
  return (
    <p {...stylex.props(styles.footer)}>
      {i.footer.beforeFile} <code {...stylex.props(styles.mono)}>.env</code> {i.footer.afterFile}{" "}
      <a href={README} {...stylex.props(styles.footerLink)}>
        {i.footer.link}
      </a>{" "}
      {i.footer.after}
    </p>
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
  variable: string;
  children: ReactNode;
}) {
  return (
    <li {...stylex.props(styles.divided, styles.integration)}>
      <div {...stylex.props(styles.integrationHead)}>
        <h3 {...stylex.props(styles.name)}>{name}</h3>
        <Badge tone={on ? "good" : "neutral"}>{status}</Badge>
        <code {...stylex.props(styles.variable)}>{variable}</code>
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
    <div {...stylex.props(styles.divided, styles.shortcut)}>
      <dt {...stylex.props(styles.term)}>{children}</dt>
      <dd {...stylex.props(styles.keys)}>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </dd>
    </div>
  );
}
