import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Badge, Card, PageHeader, SectionTitle, SourceDot } from "@/components/ui/primitives";
import { SyncCta } from "@/features/extension/sync-cta";
import { countToRefresh, getDataSources, type DataSource } from "@/features/freshness/sources";
import { syncListingAction } from "@/features/properties/actions";
import { getProperties } from "@/features/reservations/queries";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.data.title };
}

export default async function DataPage() {
  const t = (await getI18n()).m.data;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Sources />
      </Suspense>
    </>
  );
}

async function Sources() {
  await connection();
  const { m } = await getI18n();
  const t = m.data;
  const sources = await getDataSources();
  const toRefresh = countToRefresh(sources);
  const properties = await getProperties();
  const groups = [
    { key: "account", title: t.account, rows: sources.filter((source) => source.propertyId == null) },
    ...properties.map((property) => ({
      key: String(property.id),
      title: property.name,
      rows: sources.filter((source) => source.propertyId === property.id),
    })),
  ].filter((group) => group.rows.length > 0);

  return (
    <div className="max-w-5xl space-y-6">
      <Card className="p-4">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          <Badge tone={toRefresh ? "warn" : "good"}>
            {toRefresh ? t.summary.toRefresh(toRefresh) : t.summary.allFresh}
          </Badge>
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{t.summary.how}</p>
        <div className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed">
          <p className="font-medium">{t.summary.popup.title}</p>
          <p className="mt-0.5 text-muted">{t.summary.popup.body}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted">
            {[t.summary.popup.reservations, t.summary.popup.everything].map((action) => (
              <li key={action.name}>
                <strong className="font-medium text-ink">{action.name}</strong>: {action.text}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href="/extension/start?scope=all"
              target="_blank"
              className={buttonClass({ variant: "primary" })}
              rel="noopener"
            >
              {m.extension.prompt.refresh.everything}
              <span className="sr-only">{m.common.actions.newTab}</span>
            </a>
            <a
              href="/extension/start?scope=reservations"
              target="_blank"
              className={buttonClass()}
              rel="noopener"
            >
              {m.extension.prompt.refresh.reservations}
              <span className="sr-only">{m.common.actions.newTab}</span>
            </a>
          </div>
          <p className="mt-1.5 text-xs text-muted">{t.summary.popup.signIn}</p>
        </div>
      </Card>

      {groups.map((group) => (
        <Card key={group.key}>
          <div className="border-b border-line px-4 py-3">
            <SectionTitle>{group.title}</SectionTitle>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-muted">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">
                    {t.columns.source}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columns.from}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columns.read}
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    {t.columns.state}
                  </th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">
                    {t.columns.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {group.rows.map((source) => (
                  <SourceRow key={source.id} source={source} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Card className="p-5">
        <SectionTitle>{t.limits.title}</SectionTitle>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-muted">
          {t.limits.rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
        <p className="mt-3 max-w-[80ch] text-xs leading-relaxed text-muted">{t.limits.why}</p>
      </Card>
    </div>
  );
}

const STATE_TONE = { fresh: "good", stale: "warn", never: "neutral" } as const;

async function SourceRow({ source }: { source: DataSource }) {
  const { m, fmt } = await getI18n();
  const t = m.data;
  const kind = t.kinds[source.kind];
  const platform = source.channel ? CHANNELS[source.channel].label : t.claude;

  return (
    <tr>
      <th scope="row" className="px-4 py-2.5 align-top font-normal">
        <span className="font-medium">{kind.name}</span>
        <span className="block text-xs text-muted">{kind.feeds}</span>
        {source.automatic && <span className="mt-0.5 block text-xs text-faint">{t.automatic}</span>}
        {source.progress && (
          <span className="mt-0.5 block text-xs text-muted">
            {source.kind === "adminPages"
              ? t.actions.pages(source.progress.done)
              : t.progress(source.progress.done, source.progress.total)}
          </span>
        )}
      </th>
      <td className="px-3 py-2.5 align-top whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          {source.channel && <SourceDot source={source.channel} />}
          {platform}
        </span>
      </td>
      <td className="px-3 py-2.5 align-top whitespace-nowrap text-muted tabular-nums">
        {source.at ? <span title={fmt.dateTime(source.at)}>{fmt.timeAgo(source.at)}</span> : t.never}
      </td>
      <td className="px-3 py-2.5 align-top">
        <Badge tone={source.error ? "critical" : STATE_TONE[source.state]}>
          {source.error ? t.state.failed : t.state[source.state]}
        </Badge>
        {source.error && (
          <span className="mt-1 block max-w-[28ch] text-xs text-critical">{source.error}</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right align-top">
        <SourceAction source={source} platform={platform} />
      </td>
    </tr>
  );
}

async function SourceAction({ source, platform }: { source: DataSource; platform: string }) {
  const { m } = await getI18n();
  const t = m.data;
  const { action } = source;
  // The one thing to press is primary only while the data needs it.
  const variant = source.state === "fresh" ? "secondary" : "primary";

  switch (action.type) {
    case "open":
      return (
        // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
        <a
          href={action.href}
          target="_blank"
          rel="noopener"
          title={t.actions.hint}
          className={buttonClass({ size: "sm", variant })}
        >
          {t.actions.open(platform)}
          <ExternalLink aria-hidden />
          <span className="sr-only">{m.common.actions.newTab}</span>
        </a>
      );
    case "sync":
      return (
        <form action={syncListingAction.bind(null, action.listingId)} className="inline">
          <SubmitButton
            size="sm"
            variant={source.error ? "primary" : "secondary"}
            pendingLabel={t.actions.syncing}
          >
            {t.actions.sync}
          </SubmitButton>
        </form>
      );
    case "go":
      return (
        <Link href={action.href} className={buttonClass({ size: "sm", variant })}>
          {action.href === "/pricing" ? t.actions.pricing : t.actions.assistant}
        </Link>
      );
    case "popup":
      return <SyncCta scope="all" variant={variant} />;
    case "blocked": {
      const blocked = t.blocked[action.reason];
      const href =
        action.reason === "extension"
          ? "/extension"
          : action.reason === "claude"
            ? "/assistant"
            : action.reason === "listingId"
              ? null
              : source.propertyId
                ? `/properties/${source.propertyId}`
                : null;
      return (
        <span className="inline-block max-w-[26ch] text-left text-xs leading-relaxed text-muted">
          {blocked.text}{" "}
          {href && blocked.link && (
            <Link href={href} className="text-ink underline underline-offset-2">
              {blocked.link}
            </Link>
          )}
          {action.reason === "listingId" && (
            <span className="mt-1.5 block">
              <SyncCta scope="reservations" />
            </span>
          )}
        </span>
      );
    }
  }
}
