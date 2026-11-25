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
    borderRadius: radius.md,
    fontFamily: "inherit",
    fontWeight: 500,
    textDecoration: "none",
    whiteSpace: "nowrap",
    userSelect: "none",
    cursor: { default: "pointer", ":disabled": "default" },
    opacity: { default: 1, ":disabled": 0.5 },
    transitionProperty: "background-color, border-color, color, opacity",
    transitionDuration: "150ms",
    // A finger needs a taller target than a pointer.
    minHeight: { default: null, [COARSE]: "2.5rem" },
  },
});

const variants = stylex.create({
  primary: {
    borderColor: color.ink,
    backgroundColor: color.ink,
    color: color.inverse,
    opacity: { default: 1, ":hover": 0.9, ":disabled": 0.5 },
  },
  secondary: {
    borderColor: color.lineStrong,
    backgroundColor: { default: color.bg, ":hover": color.subtle },
    color: color.ink,
  },
  ghost: {
    borderColor: "transparent",
    backgroundColor: { default: "transparent", ":hover": color.sunken },
    color: { default: color.muted, ":hover": color.ink },
  },
  danger: {
    borderColor: color.lineStrong,
    backgroundColor: { default: color.bg, ":hover": color.criticalBg },
    color: color.critical,
  },
});

const sizes = stylex.create({
  sm: { height: "1.75rem", paddingInline: "0.5rem", fontSize: text.sm },
  md: { height: "2rem", paddingInline: "0.75rem", fontSize: text.base },
  lg: { height: "2.5rem", paddingInline: "1rem", fontSize: text.md },
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
