import * as stylex from "@stylexjs/stylex";
import { ExternalLink } from "lucide-react";
import type { OtaChannel } from "@/db/schema";
import type { ExtensionStatus } from "@/features/extension/status";
import type { Pricing } from "@/features/pricing/queries";
import type { PlatformLink } from "@/features/reservations/platform-links";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Card, Hidden, SourceDot } from "../../ui/primitives";
import { SyncCta } from "../extension/sync-cta";

const styles = stylex.create({
  card: { display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1rem" },
  links: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  small: { color: color.muted, fontSize: text.sm },
  none: { margin: 0, color: color.muted, fontSize: text.base },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
    margin: 0,
    padding: 0,
    listStyle: "none",
    color: color.muted,
    fontSize: text.sm,
  },
  item: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.375rem" },
});

const CHANNELS: OtaChannel[] = ["airbnb", "booking"];

/**
 * Buttons to the host's own calendars, where the extension reads the prices,
 * and how much each platform has given so far. Plain links, not `noreferrer`,
 * like the other pages the extension reads.
 */
export function ReadPrices({
  pricing,
  links,
  extension,
}: {
  pricing: Pick<Pricing, "coverage">;
  links: PlatformLink[];
  extension: ExtensionStatus["state"];
}) {
  const { m, fmt } = useI18n("pricing");
  const t = m.pricing;

  return (
    <Card xstyle={styles.card}>
      {links.length > 0 ? (
        <div role="group" aria-label={t.read.label} {...stylex.props(styles.links)}>
          <span {...stylex.props(styles.small)}>{t.read.from}</span>
          {links.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener"
              title={t.read.hint}
              {...stylex.props(buttonStyle({ size: "sm" }))}
            >
              {t.read.calendar(m.common.sources[link.channel])}
              <ExternalLink aria-hidden size={14} />
              <Hidden>{m.common.actions.newTab}</Hidden>
            </a>
          ))}
        </div>
      ) : (
        <p {...stylex.props(styles.none)}>{t.empty.noLinks}</p>
      )}
      <ul {...stylex.props(styles.list)}>
        {CHANNELS.map((channel) => {
          const covered = pricing.coverage[channel];
          const label = m.common.sources[channel];
          return (
            <li key={channel} {...stylex.props(styles.item)}>
              <SourceDot source={channel} />
              {covered
                ? t.read.covered(
                    label,
                    covered.nights,
                    fmt.date(covered.until, { day: "numeric", month: "short", year: "numeric" }),
                    fmt.timeAgo(covered.seenAt),
                  )
                : t.read.never(label)}
              {!covered && <SyncCta state={extension} scope="all" />}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
