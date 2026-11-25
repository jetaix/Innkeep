import type * as stylex from "@stylexjs/stylex";
import { type ReactNode, useState } from "react";
import { useI18n } from "../i18n";
import { Button, type ButtonStyle } from "./button";

/** Submit button that shows progress while its form's request is on its way. */
export function SubmitButton({
  children,
  pending,
  pendingLabel,
  ...rest
}: {
  children: ReactNode;
  /** Pass the mutation's `isPending`. */
  pending: boolean;
  pendingLabel?: string;
  xstyle?: stylex.StyleXStyles;
  "aria-pressed"?: boolean;
} & ButtonStyle) {
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { m } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <span aria-live="polite">{copied ? m.common.actions.copied : (label ?? m.common.actions.copy)}</span>
    </Button>
  );
}

/** Asks before doing something that cannot be undone. */
export function ConfirmButton({
  children,
  message,
  onConfirm,
  pending,
  ...style
}: {
  children: ReactNode;
  message: string;
  onConfirm: () => void;
  pending?: boolean;
} & ButtonStyle) {
  return (
    <Button
      variant="danger"
      disabled={pending}
      aria-busy={pending}
      {...style}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {children}
    </Button>
  );
}
