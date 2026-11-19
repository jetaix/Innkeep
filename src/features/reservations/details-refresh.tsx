import { ExternalLink } from "lucide-react";
import { CHANNELS } from "@/channels";
import { buttonClass } from "@/components/ui/button";
import { getI18n } from "@/i18n/server";
import { reservationLinks } from "./platform-links";

/**
 * One-click refresh of guest names, payouts and past stays. Each button opens the host's
 * own reservations page on the platform in a new tab; the Innkeep Companion
 * extension reads it, sends the details here and closes the tab again.
 *
 * Deliberately a plain link, not `noreferrer`: the extension recognises a tab
 * opened from Innkeep by its referrer, and only closes those.
 */
export async function DetailsRefresh() {
  if (!process.env.EXTENSION_TOKEN) return null;

  const links = reservationLinks();
  if (links.length === 0) return null;
  const { m } = await getI18n();
  const t = m.reservations.refresh;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.label}>
      <span className="text-xs text-muted">{t.from}</span>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          target="_blank"
          rel="noopener"
          title={t.hint}
          className={buttonClass({ size: "sm" })}
        >
          {CHANNELS[link.channel].label}
          <ExternalLink aria-hidden />
          <span className="sr-only">{m.common.actions.newTab}</span>
        </a>
      ))}
    </div>
  );
}
