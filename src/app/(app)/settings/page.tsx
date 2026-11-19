import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { CopyButton } from "@/components/ui/actions";
import { Badge, Card, Kbd, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { NAV } from "@/config/navigation";
import { site } from "@/config/site";
import { LanguageSwitch, ThemeSwitch } from "@/components/shell/preferences";
import { AI_MODEL, aiConfigured } from "@/features/insights/ai";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.settings.title };
}

export default async function SettingsPage() {
  const { m } = await getI18n();
  const t = m.settings;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Settings />
      </Suspense>
    </>
  );
}

async function Settings() {
  await connection();
  const { m } = await getI18n();
  const t = m.settings;
  const i = t.integrations;
  const state = (on: boolean) => (on ? i.on : i.off);
  const requestHeaders = await headers();
  const origin =
    process.env.APP_URL?.replace(/\/$/, "") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;

  const interval = Number(process.env.SYNC_INTERVAL_MINUTES ?? 15);
  const mcpOn = Boolean(process.env.MCP_TOKEN);
  const mcpConfig = JSON.stringify(
    {
      mcpServers: {
        innkeep: {
          type: "http",
          url: `${origin}/api/mcp`,
          headers: { Authorization: "Bearer YOUR_MCP_TOKEN" },
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <Card>
          <div className="border-b border-line px-4 py-3">
            <SectionTitle>{t.appearance.title}</SectionTitle>
          </div>
          <div className="divide-y divide-line">
            <Preference label={m.common.preferences.theme} help={t.appearance.themeHelp}>
              <ThemeSwitch withLabels />
            </Preference>
            <Preference label={m.common.preferences.language} help={t.appearance.languageHelp}>
              <LanguageSwitch withLabels />
            </Preference>
          </div>
        </Card>

        <Card>
          <div className="border-b border-line px-4 py-3">
            <SectionTitle>{i.title}</SectionTitle>
          </div>
          <ul className="divide-y divide-line">
            <Integration
              name={i.sync.name}
              on={interval > 0}
              status={interval > 0 ? i.sync.every(interval) : i.sync.manual}
              variable="SYNC_INTERVAL_MINUTES"
            >
              {i.sync.body}
            </Integration>
            <Integration
              name={i.ai.name}
              on={aiConfigured()}
              status={aiConfigured() ? AI_MODEL : i.off}
              variable="ANTHROPIC_API_KEY"
            >
              {i.ai.body}
            </Integration>
            <Integration
              name={i.webhook.name}
              on={Boolean(process.env.WEBHOOK_SECRET)}
              status={state(Boolean(process.env.WEBHOOK_SECRET))}
              variable="WEBHOOK_SECRET"
            >
              {i.webhook.before}{" "}
              <code className="font-mono text-xs text-ink">POST {origin}/api/webhooks/messages</code>{" "}
              {i.webhook.after}
            </Integration>
            <Integration
              name={i.extension.name}
              on={Boolean(process.env.EXTENSION_TOKEN)}
              status={state(Boolean(process.env.EXTENSION_TOKEN))}
              variable="EXTENSION_TOKEN"
            >
              {i.extension.body}{" "}
              <Link href="/extension" className="text-ink underline underline-offset-2">
                {i.extension.link}
              </Link>
            </Integration>
            <Integration name={i.mcp.name} on={mcpOn} status={state(mcpOn)} variable="MCP_TOKEN">
              {i.mcp.body}
              <span className="mt-3 block">
                <span className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ink">{i.mcp.config}</span>
                  <CopyButton value={mcpConfig} />
                </span>
                <pre className="overflow-x-auto rounded-md border border-line bg-subtle p-3 font-mono text-xs leading-relaxed text-ink">
                  {mcpConfig}
                </pre>
              </span>
            </Integration>
          </ul>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">
            {i.footer.beforeFile} <code className="font-mono">.env</code> {i.footer.afterFile}{" "}
            <a href={`${site.repo}#configuration`} className="underline underline-offset-2 hover:text-ink">
              {i.footer.link}
            </a>{" "}
            {i.footer.after}
          </p>
        </Card>
      </div>

      <Card>
        <div className="border-b border-line px-4 py-3">
          <SectionTitle>{t.shortcuts.title}</SectionTitle>
        </div>
        <dl className="divide-y divide-line">
          <Shortcut keys={["⌘", "K"]}>{t.shortcuts.commandMenu}</Shortcut>
          {NAV.map((item) => (
            <Shortcut key={item.href} keys={["G", item.key.toUpperCase()]}>
              {t.shortcuts.goTo(m.common.nav[item.id])}
            </Shortcut>
          ))}
          <Shortcut keys={["N"]}>{t.shortcuts.add}</Shortcut>
          <Shortcut keys={["←", "→"]}>{t.shortcuts.move}</Shortcut>
          <Shortcut keys={["T"]}>{t.shortcuts.today}</Shortcut>
          <Shortcut keys={["J", "K"]}>{t.shortcuts.conversations}</Shortcut>
          <Shortcut keys={["Esc"]}>{t.shortcuts.close}</Shortcut>
        </dl>
      </Card>
    </div>
  );
}

/** One appearance choice: what it is and how long it lasts on the left, the switch on the right. */
function Preference({ label, help, children }: { label: string; help: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{label}</h3>
        <p className="mt-0.5 leading-relaxed text-muted">{help}</p>
      </div>
      <div className="w-full shrink-0 sm:w-60">{children}</div>
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
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-medium">{name}</h3>
        <Badge tone={on ? "good" : "neutral"}>{status}</Badge>
        <code className="ml-auto font-mono text-xs text-muted">{variable}</code>
      </div>
      <div className="mt-1.5 max-w-[65ch] leading-relaxed text-muted">{children}</div>
    </li>
  );
}

function Shortcut({ keys, children }: { keys: string[]; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2">
      <dt className="text-muted">{children}</dt>
      <dd className="flex shrink-0 gap-1">
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </dd>
    </div>
  );
}
