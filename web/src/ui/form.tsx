import * as stylex from "@stylexjs/stylex";
import type { ComponentProps, ReactNode } from "react";
import { color, radius, text } from "../tokens.stylex";

const WIDE = "@media (min-width: 48rem)";
const COARSE = "@media (pointer: coarse)";

const styles = stylex.create({
  control: {
    display: "block",
    width: "100%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.lineStrong,
    borderRadius: radius.md,
    backgroundColor: { default: color.bg, ":read-only": color.subtle },
    color: { default: color.ink, ":read-only": color.muted, "::placeholder": color.faint },
    paddingInline: "0.625rem",
    fontFamily: "inherit",
    // 16 px on phones: iOS zooms the page when a smaller field takes focus.
    fontSize: { default: text.field, [WIDE]: text.base },
    minHeight: { default: null, [COARSE]: "2.5rem" },
  },
  line: { height: "2rem" },
  area: { paddingBlock: "0.375rem", lineHeight: 1.625 },
  // A select is never read-only, though the browser's `:read-only` matches it.
  select: { paddingInlineEnd: "1.75rem", backgroundColor: color.bg, color: color.ink },
  label: {
    display: "block",
    marginBottom: "0.25rem",
    color: color.muted,
    fontSize: text.sm,
    fontWeight: 500,
  },
  hint: { margin: "0.25rem 0 0", color: color.faint, fontSize: text.sm },
});

type Styled<T> = Omit<T, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

export function Input({ xstyle, ...props }: Styled<ComponentProps<"input">>) {
  return <input {...props} {...stylex.props(styles.control, styles.line, xstyle)} />;
}

export function Textarea({ xstyle, ...props }: Styled<ComponentProps<"textarea">>) {
  return <textarea {...props} {...stylex.props(styles.control, styles.area, xstyle)} />;
}

export function Select({ xstyle, ...props }: Styled<ComponentProps<"select">>) {
  return <select {...props} {...stylex.props(styles.control, styles.line, styles.select, xstyle)} />;
}

/** A labelled control. Pass the control's `id` so the label is clickable and announced. */
export function Field({
  label,
  htmlFor,
  hint,
  xstyle,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  xstyle?: stylex.StyleXStyles;
  children: ReactNode;
}) {
  return (
    <div {...stylex.props(xstyle)}>
      <label htmlFor={htmlFor} {...stylex.props(styles.label)}>
        {label}
      </label>
      {children}
      {hint && <p {...stylex.props(styles.hint)}>{hint}</p>}
    </div>
  );
}
