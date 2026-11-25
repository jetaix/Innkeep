import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import path from "node:path";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { connection } from "next/server";
import { buttonClass } from "@/components/ui/button";
import { Badge, Card, Notice, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import {
  ChromeSteps,
  Copyable,
  Credentials,
  Download,
  innkeepOrigin,
  isHosted,
  Step,
} from "@/features/extension/guide-parts";
import { getExtensionStatus, REQUIRED_EXTENSION } from "@/features/extension/status";
import { DetailsRefresh } from "@/features/reservations/details-refresh";
import { getI18n } from "@/i18n/server";

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

/** A guide for another browser, closed until the host asks for it. */
function FoldedGuide({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[inherit] px-5 py-3 [&::-webkit-details-marker]:hidden">
          <div>
            <SectionTitle>{title}</SectionTitle>
            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
          </div>
          <ChevronDown
            aria-hidden
            className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          />
        </summary>
        <ol className="divide-y divide-line border-t border-line [counter-reset:step]">{children}</ol>
      </details>
    </Card>
  );
}

async function Guide() {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.extension;
  const s = t.setup;
  const status = await getExtensionStatus();
  const token = process.env.EXTENSION_TOKEN;
  const origin = await innkeepOrigin();
  const hosted = isHosted();

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
          <ChromeSteps origin={origin} token={token} />
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
        <FoldedGuide title={t.safari.title} subtitle={t.safari.subtitle}>
          <Step title={t.safari.xcode.title}>{t.safari.xcode.body}</Step>
          <Step title={t.safari.build.title}>
            {t.safari.build.body}
            <Copyable value={`cd "${process.cwd()}" && npm run build:safari`} label={t.safari.copyCommand} />
          </Step>
          <Step title={t.safari.allow.title}>{t.safari.allow.body}</Step>
          <Step title={t.safari.open.title}>
            {t.safari.open.body}
            <Copyable
              value={path.join(process.cwd(), "safari/build/Build/Products/Release")}
              label={s.copyPath}
            />
          </Step>
          <Step title={t.safari.enable.title}>{t.safari.enable.body}</Step>
          <Step title={t.safari.sites.title}>{t.safari.sites.body}</Step>
          <Step title={s.connect.title}>
            {s.connect.before} <strong className="font-medium text-ink">{s.connect.settings}</strong>{" "}
            {s.connect.middle} <strong className="font-medium text-ink">{s.connect.strong}</strong>
            {t.safari.connectAfter}
            <Credentials origin={origin} token={token} />
          </Step>
          <Step title={s.read.title}>
            {s.read.body}
            <span className="mt-3 block text-xs">{t.safari.later}</span>
          </Step>
        </FoldedGuide>
      )}

      {!hosted && (
        <FoldedGuide title={t.ios.title} subtitle={t.ios.subtitle}>
          <Step title={t.ios.need.title}>
            {t.ios.need.body}
            <span className="mt-3 block text-xs">{t.ios.limits}</span>
          </Step>
          <Step title={t.ios.project.title}>
            {t.ios.project.body}
            <Copyable value={path.join(process.cwd(), "safari/Innkeep")} label={s.copyPath} />
          </Step>
          <Step title={t.ios.sign.title}>
            {t.ios.sign.body}
            <span className="mt-3 block text-xs">{t.ios.sign.taken}</span>
          </Step>
          <Step title={t.ios.phone.title}>{t.ios.phone.body}</Step>
          <Step title={t.ios.run.title}>{t.ios.run.body}</Step>
          <Step title={t.ios.enable.title}>{t.ios.enable.body}</Step>
          <Step title={t.ios.sites.title}>{t.ios.sites.body}</Step>
          <Step title={t.ios.connect.title}>
            {t.ios.connect.body}
            {/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(origin) ? (
              <span className="mt-3 block text-ink">{t.ios.connect.local}</span>
            ) : (
              <Credentials origin={origin} token={token} />
            )}
          </Step>
          <Step title={t.ios.read.title}>{t.ios.read.body}</Step>
        </FoldedGuide>
      )}

      <Card>
        <div className="border-b border-line px-5 py-3">
          <SectionTitle>{t.use.title}</SectionTitle>
          <p className="mt-0.5 text-xs text-muted">{t.use.subtitle}</p>
        </div>
        <ol className="divide-y divide-line [counter-reset:step]">
          {t.use.steps.map((step) => (
            <Step key={step.title} title={step.title}>
              {step.body}
            </Step>
          ))}
        </ol>
      </Card>

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
