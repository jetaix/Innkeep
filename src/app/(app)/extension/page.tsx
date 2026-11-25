import { Download as DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import path from "node:path";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import { connection } from "next/server";
import { CopyButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Badge, Card, Notice, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { getExtensionStatus, REQUIRED_EXTENSION } from "@/features/extension/status";
import { DetailsRefresh } from "@/features/reservations/details-refresh";
import { getI18n } from "@/i18n/server";
import manifest from "../../../../extension/manifest.json";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.extension.title };
}

export default async function ExtensionPage() {
  const t = (await getI18n()).m.extension;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Guide />
      </Suspense>
    </>
  );
}

function Copyable({ value, label, secret }: { value: string; label: string; secret?: boolean }) {
  return (
    <span className="mt-2 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md bg-sunken px-2 py-1.5 font-mono text-xs">
        {secret ? "•".repeat(24) : value}
      </code>
      <CopyButton value={value} label={label} />
    </span>
  );
}

function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 px-5 py-4 [counter-increment:step]">
      <span
        aria-hidden
        className="flex size-5 shrink-0 items-center justify-center rounded-full bg-sunken text-[11px] font-semibold tabular-nums before:content-[counter(step)]"
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{title}</h3>
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

async function Guide() {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.extension;
  const s = t.setup;
  const status = await getExtensionStatus();
  const token = process.env.EXTENSION_TOKEN;
  const requestHeaders = await headers();
  const origin =
    process.env.APP_URL?.replace(/\/$/, "") ??
    `${requestHeaders.get("x-forwarded-proto") ?? "http"}://${requestHeaders.get("host")}`;
  const folder = path.join(process.cwd(), "extension");
  // On a server there is no folder on the host's computer to point at: the extension is downloaded.
  const hosted = Boolean(process.env.VERCEL);

  return (
    <div className="max-w-3xl space-y-6">
      {status.state === "ready" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p>
            <Badge tone="good">{t.connected.badge}</Badge>
            <span className="ml-2 text-[13px] text-muted">
              {t.connected.detail(status.version, fmt.timeAgo(status.at))}
            </span>
          </p>
          <DetailsRefresh />
        </Card>
      )}
      {status.state === "outdated" && (
        <Notice tone="warn">
          {t.outdated.before(status.version, REQUIRED_EXTENSION)}{" "}
          <code className="font-mono text-xs">chrome://extensions</code>
          {t.outdated.after}
          <span className="mt-2 block">{s.update}</span>
          <Download />
        </Notice>
      )}

      <Card>
        <div className="border-b border-line px-5 py-3">
          <SectionTitle>{s.title}</SectionTitle>
          <p className="mt-0.5 text-xs text-muted">{s.subtitle}</p>
        </div>
        <ol className="divide-y divide-line [counter-reset:step]">
          {!token && (
            <Step title={s.switchOn.title}>
              {s.switchOn.before} <code className="font-mono text-xs text-ink">EXTENSION_TOKEN=</code>{" "}
              {s.switchOn.middle} <code className="font-mono text-xs text-ink">.env.local</code>
              {s.switchOn.after}
            </Step>
          )}
          <Step title={s.openPage.title}>
            {s.openPage.before} <strong className="font-medium text-ink">{s.openPage.strong}</strong>{" "}
            {s.openPage.after}
            <Copyable value="chrome://extensions" label={s.copyAddress} />
          </Step>
          <Step title={s.load.title}>
            {s.load.before} <strong className="font-medium text-ink">{s.load.strong}</strong>{" "}
            {hosted ? s.load.afterHosted : s.load.after}
            {!hosted && <Copyable value={folder} label={s.copyPath} />}
            {!hosted && <span className="mt-3 block text-xs">{s.load.elsewhere}</span>}
            <Download />
          </Step>
          <Step title={s.pin.title}>{s.pin.body}</Step>
          <Step title={s.connect.title}>
            {s.connect.before} <strong className="font-medium text-ink">{s.connect.settings}</strong>{" "}
            {s.connect.middle} <strong className="font-medium text-ink">{s.connect.strong}</strong>
            {s.connect.after}
            <Copyable value={origin} label={s.copyAddress} />
            {token ? (
              <Copyable value={token} label={s.copyToken} secret />
            ) : (
              <span className="mt-2 block text-xs">{s.connect.tokenMissing}</span>
            )}
          </Step>
          <Step title={s.read.title}>
            {s.read.body}
            <span className="mt-3 flex flex-wrap gap-2">
              {/* Innkeep's own start page hands over to the extension. */}
              <a
                href="/extension/start?scope=all"
                target="_blank"
                className={buttonClass({ size: "sm", variant: "primary" })}
                rel="noopener"
              >
                {t.prompt.refresh.everything}
                <span className="sr-only">{m.common.actions.newTab}</span>
              </a>
              <a
                href="/extension/start?scope=reservations"
                target="_blank"
                className={buttonClass({ size: "sm" })}
                rel="noopener"
              >
                {t.prompt.refresh.reservations}
                <span className="sr-only">{m.common.actions.newTab}</span>
              </a>
            </span>
            <span className="mt-4 block text-xs">{s.read.manual}</span>
            <span className="mt-2 block">
              <DetailsRefresh />
            </span>
          </Step>
        </ol>
      </Card>

      {!hosted && (
        <Card className="p-5">
          <SectionTitle>{t.safari.title}</SectionTitle>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.safari.intro}</p>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-muted">
            <li>
              {t.safari.build}
              <Copyable value="bun run build:safari" label={t.safari.copyCommand} />
            </li>
            <li>{t.safari.allow}</li>
            <li>
              {t.safari.open}
              <Copyable
                value={path.join(process.cwd(), "safari/build/Build/Products/Release/Innkeep Companion.app")}
                label={s.copyPath}
              />
            </li>
            <li>{t.safari.sites}</li>
            <li>{t.safari.connect}</li>
          </ol>
        </Card>
      )}

      <Card className="p-5">
        <SectionTitle>{t.after.title}</SectionTitle>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-muted">
          {t.after.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <SectionTitle>{t.reads.title}</SectionTitle>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-muted">
          {t.reads.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted">{t.reads.terms}</p>
      </Card>
    </div>
  );
}

/** The extension as a ZIP, written to `public/` by `scripts/zip-extension.mjs` before each build. */
async function Download() {
  const s = (await getI18n()).m.extension.setup;
  return (
    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <a
        href="/innkeep-extension.zip"
        download={`innkeep-extension-${manifest.version}.zip`}
        className={buttonClass({ size: "sm", variant: "primary" })}
      >
        <DownloadIcon aria-hidden />
        {s.download(manifest.version)}
      </a>
      <span className="text-xs text-muted">{s.downloadHint}</span>
    </span>
  );
}
