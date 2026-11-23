import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { CHANNELS } from "@/channels";
import { buttonClass } from "@/components/ui/button";
import { SourceDot } from "@/components/ui/primitives";
import { getDataSources, olderThanADay, type DataSource } from "@/features/freshness/sources";
import { getProperties } from "@/features/reservations/queries";
import { getI18n } from "@/i18n/server";
import { DismissForNow } from "./dismiss-for-now";
import { getExtensionStatus } from "./status";

/**
 * Asks the host, on opening Innkeep, to bring their data up to date when
 * something they can refresh is more than a day old (or was never read).
 *
 * It names exactly what is old, so the prompt never disagrees with what the
 * host can see, and offers two ways: let the extension go through the pages
 * in one tab, or open the page of one line. It leaves once nothing listed is
 * older than a day.
 *
 * The links are deliberately not `noreferrer`: the extension recognises a tab
 * opened from Innkeep by its referrer, and closes only those.
 */
export async function UpdatePrompt() {
  await connection();
  const extension = await getExtensionStatus();
  // Without the extension the links would do nothing; the setup button covers that case.
  if (extension.state === "off" || extension.state === "missing") return null;

  const old = olderThanADay(await getDataSources());
  if (old.length === 0) return null;

  const { m, fmt } = await getI18n();
  const t = m.extension.prompt;
  const properties = await getProperties();
  // "Reservations only" helps only when reservations are among what is old.
  const reservationsOld = old.some((source) => source.kind === "reservations");

  return (
    <DismissForNow>
      <section
        aria-labelledby="update-heading"
        className="border-b border-line bg-subtle px-4 py-4 md:px-8 print:hidden"
      >
        <div className="max-w-3xl">
          <h2 id="update-heading" className="font-semibold">
            {t.refresh.title}
          </h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{t.refresh.body(old.length)}</p>
          {extension.state === "outdated" && (
            <p className="mt-2 text-[13px] text-warn">
              {t.outdated.before}{" "}
              <Link href="/extension" className="underline underline-offset-2">
                {t.outdated.link}
              </Link>
              {t.outdated.after}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Plain links to Innkeep's own start page, which hands over to the extension. */}
            <a
              href="/extension/start?scope=all"
              target="_blank"
              className={buttonClass({ variant: "primary" })}
              rel="noopener"
            >
              {t.refresh.everything}
              <span className="font-normal opacity-70">{t.refresh.everythingHint}</span>
              <span className="sr-only">{m.common.actions.newTab}</span>
            </a>
            {reservationsOld && (
              <a
                href="/extension/start?scope=reservations"
                target="_blank"
                className={buttonClass()}
                rel="noopener"
              >
                {t.refresh.reservations}
                <span className="font-normal text-muted">{t.refresh.reservationsHint}</span>
                <span className="sr-only">{m.common.actions.newTab}</span>
              </a>
            )}
            <span className="text-xs text-muted">{t.refresh.signIn}</span>
          </div>

          <p className="mt-4 text-xs text-muted">{t.refresh.what}</p>
          <ul className="mt-1.5 space-y-1.5">
            {old.map((source) => {
              const platform = source.channel ? CHANNELS[source.channel].label : m.data.claude;
              const property =
                properties.length > 1 && source.propertyId
                  ? properties.find((entry) => entry.id === source.propertyId)?.name
                  : null;
              return (
                <li key={source.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                  <span className="flex min-w-56 items-center gap-1.5 font-medium">
                    {source.channel && <SourceDot source={source.channel} />}
                    {m.data.kinds[source.kind].name}, {platform}
                    {property ? ` (${property})` : ""}
                  </span>
                  <span className="flex-1 text-xs text-muted">
                    {source.at ? t.refresh.lastRead(fmt.timeAgo(source.at)) : t.refresh.neverRead}
                  </span>
                  <OneSource source={source} platform={platform} />
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            <Link href="/data" className="text-ink underline underline-offset-2">
              {m.data.seeAll}
            </Link>
          </p>
        </div>
      </section>
    </DismissForNow>
  );
}

/** The way to refresh one line by hand, when it has one. */
async function OneSource({ source, platform }: { source: DataSource; platform: string }) {
  const { m } = await getI18n();
  const { action } = source;
  if (action.type === "open") {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener"
        title={m.data.actions.hint}
        className={buttonClass({ size: "sm" })}
      >
        {m.data.actions.open(platform)}
        <ExternalLink aria-hidden />
        <span className="sr-only">{m.common.actions.newTab}</span>
      </a>
    );
  }
  if (action.type === "go") {
    return (
      <Link href={action.href} className={buttonClass({ size: "sm" })}>
        {action.href === "/pricing" ? m.data.actions.pricing : m.data.actions.assistant}
      </Link>
    );
  }
  // Read only by a full run: the button above is the way.
  return <span className="text-xs text-muted">{m.extension.prompt.refresh.byRun}</span>;
}
