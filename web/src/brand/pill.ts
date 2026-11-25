import * as stylex from "@stylexjs/stylex";
import { color } from "../tokens.stylex";

const styles = stylex.create({
  pill: {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderRadius: "999px",
    fontFamily: "inherit",
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    cursor: "pointer",
    scale: { default: null, ":active": "0.97" },
    transitionProperty: "background-color, box-shadow, scale",
    transitionDuration: "200ms",
  },
  md: { height: "2.25rem", paddingInline: "1rem", fontSize: "0.8125rem" },
  lg: { height: "3rem", paddingInline: "1.5rem", fontSize: "0.9375rem" },
  primary: {
    backgroundColor: {
      default: color.ink,
      ":hover": `color-mix(in oklab, ${color.ink} 86%, ${color.overlap})`,
    },
    color: color.inverse,
  },
  secondary: {
    backgroundColor: color.panel,
    color: color.ink,
    boxShadow: {
      default: `0 0 0 1px ${color.line}, 0 8px 20px -14px rgb(0 0 0 / 0.4)`,
      ":hover": `0 0 0 1px ${color.lineStrong}, 0 10px 22px -14px rgb(0 0 0 / 0.5)`,
    },
  },
});

/** The public pages' button: a pill, in the two weights the pages use. Spread into `stylex.props`. */
export function pillStyle(variant: "primary" | "secondary" = "secondary", size: "md" | "lg" = "md") {
  return [styles.pill, styles[size], styles[variant]] as const;
}
