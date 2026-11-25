import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import { color, radius, text } from "../tokens.stylex";

const COARSE = "@media (pointer: coarse)";

const base = stylex.create({
  button: {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: "0.375rem",
    borderWidth: 1,
    borderStyle: "solid",
    // Every control that acts is a pill.
    borderRadius: radius.full,
    fontFamily: "inherit",
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    cursor: { default: "pointer", ":disabled": "default" },
    opacity: { default: 1, ":disabled": 0.5 },
    scale: { default: null, ":active": "0.97", ":disabled": "1" },
    transitionProperty: "background-color, border-color, box-shadow, color, opacity, scale",
    transitionDuration: "200ms",
    // A finger needs a taller target than a pointer.
    minHeight: { default: null, [COARSE]: "2.5rem" },
  },
});

const variants = stylex.create({
  primary: {
    borderColor: "transparent",
    // Warms toward the overlap's violet under the pointer.
    backgroundColor: {
      default: color.ink,
      ":hover": `color-mix(in oklab, ${color.ink} 86%, ${color.overlap})`,
    },
    color: color.inverse,
  },
  secondary: {
    borderColor: "transparent",
    backgroundColor: color.panel,
    color: color.ink,
    boxShadow: {
      default: `0 0 0 1px ${color.line}, 0 8px 18px -14px rgb(0 0 0 / 0.45)`,
      ":hover": `0 0 0 1px ${color.lineStrong}, 0 10px 20px -14px rgb(0 0 0 / 0.55)`,
    },
  },
  ghost: {
    borderColor: "transparent",
    backgroundColor: { default: "transparent", ":hover": color.sunken },
    color: { default: color.muted, ":hover": color.ink },
  },
  danger: {
    borderColor: "transparent",
    backgroundColor: { default: color.panel, ":hover": color.criticalBg },
    color: color.critical,
    boxShadow: `0 0 0 1px color-mix(in oklab, ${color.critical} 28%, ${color.line})`,
  },
});

const sizes = stylex.create({
  sm: { height: "1.75rem", paddingInline: "0.75rem", fontSize: text.sm },
  md: { height: "2.125rem", paddingInline: "0.9375rem", fontSize: text.base },
  lg: { height: "2.75rem", paddingInline: "1.375rem", fontSize: text.md },
});

export type ButtonStyle = { variant?: keyof typeof variants; size?: keyof typeof sizes };

/** The styles of a button, for anything that should look like one, e.g. a `<Link>`. */
export function buttonStyle({ variant = "secondary", size = "md" }: ButtonStyle = {}) {
  return [base.button, variants[variant], sizes[size]] as const;
}

export function Button({
  variant,
  size,
  xstyle,
  type = "button",
  ...props
}: Omit<ComponentProps<"button">, "className" | "style"> & ButtonStyle & { xstyle?: stylex.StyleXStyles }) {
  return <button type={type} {...props} {...stylex.props(buttonStyle({ variant, size }), xstyle)} />;
}
