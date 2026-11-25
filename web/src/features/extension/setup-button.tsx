import * as stylex from "@stylexjs/stylex";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";
import { freshnessQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, radius, shadow, text } from "../../tokens.stylex";

const WIDE = "@media (min-width: 48rem)";
const PRINT = "@media print";

const styles = stylex.create({
  // The extension runs in a desktop browser, so a phone is not offered it.
  button: {
    position: "fixed",
    right: "1rem",
    bottom: "1rem",
    zIndex: 40,
    display: { default: "none", [WIDE]: "flex", [PRINT]: "none" },
    alignItems: "center",
    gap: "0.5rem",
    height: "2.5rem",
    paddingInline: "0.875rem 1rem",
    borderRadius: radius.full,
    backgroundColor: {
      default: color.ink,
      ":hover": `color-mix(in oklab, ${color.ink} 86%, ${color.overlap})`,
    },
    color: color.inverse,
    boxShadow: shadow.pop,
    fontSize: text.base,
    fontWeight: 500,
    textDecoration: "none",
    transitionProperty: "background-color",
    transitionDuration: "200ms",
  },
});

/**
 * Stays in the corner of every page until the browser extension is installed
 * and current: without it Innkeep only knows dates, not guests or payouts.
 */
export function ExtensionSetupButton() {
  const t = useI18n("extension").m.extension.button;
  const { data } = useQuery(freshnessQuery);
  if (!data || data.extension === "ready") return null;
  return (
    <Link to="/extension" {...stylex.props(styles.button)}>
      <Puzzle aria-hidden size={16} strokeWidth={1.75} />
      {data.extension === "outdated" ? t.update : t.add}
    </Link>
  );
}
