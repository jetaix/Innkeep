import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import type { RunScope } from "./run";
import { getExtensionStatus } from "./status";

/**
 * The one thing to press where data is missing: starts a run of the browser
 * extension, which reads the host's own pages and comes back. Without a
 * working extension it leads to setting one up instead. A run needs a
 * desktop browser, so a phone gets a line saying so rather than a button
 * that cannot work.
 */
export async function SyncCta({
  scope = "all",
  variant = "primary",
}: {
  scope?: RunScope;
  variant?: "primary" | "secondary";
}) {
  const { m } = await getI18n();
  const t = m.extension;
  const status = await getExtensionStatus();

  if (status.state !== "ready") {
    return (
      <Link href="/extension" className={buttonClass({ size: "sm", variant })}>
        {status.state === "outdated" ? t.button.update : t.button.add}
      </Link>
    );
  }
  return (
    <>
      <a
        // Not `noreferrer`: the extension recognises a tab opened from Innkeep by its referrer.
        href={`/extension/start?scope=${scope}`}
        target="_blank"
        rel="noopener"
        className={buttonClass({ size: "sm", variant }, "hidden md:inline-flex")}
      >
        {scope === "all" ? t.prompt.refresh.everything : t.prompt.refresh.reservations}
        <span className="sr-only">{m.common.actions.newTab}</span>
      </a>
      <span className="text-xs text-muted md:hidden">{t.cta.computer}</span>
    </>
  );
}
