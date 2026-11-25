import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { ExtensionStatus } from "@/features/extension/status";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { buttonStyle } from "../../ui/button";
import { Hidden } from "../../ui/primitives";

const WIDE = "@media (min-width: 48rem)";

const styles = stylex.create({
  desktop: { display: { default: "none", [WIDE]: "inline-flex" } },
  phone: { display: { default: "inline", [WIDE]: "none" }, color: color.muted, fontSize: text.sm },
});

/**
 * The one thing to press where data is missing: starts a run of the browser
 * extension, which reads the host's own pages and comes back. Without a
 * working extension it leads to setting one up instead. A run needs a
 * desktop browser, so a phone gets a line saying so rather than a button
 * that cannot work.
 */
export function SyncCta({
  state,
  scope = "all",
  variant = "primary",
}: {
  state: ExtensionStatus["state"];
  scope?: "all" | "reservations";
  variant?: "primary" | "secondary";
}) {
  const { m } = useI18n("extension");
  const t = m.extension;

  if (state !== "ready") {
    return (
      <Link to="/extension" {...stylex.props(buttonStyle({ size: "sm", variant }))}>
        {state === "outdated" ? t.button.update : t.button.add}
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
        {...stylex.props(buttonStyle({ size: "sm", variant }), styles.desktop)}
      >
        {scope === "all" ? t.prompt.refresh.everything : t.prompt.refresh.reservations}
        <Hidden>{m.common.actions.newTab}</Hidden>
      </a>
      <span {...stylex.props(styles.phone)}>{t.cta.computer}</span>
    </>
  );
}
