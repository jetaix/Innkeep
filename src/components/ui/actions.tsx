"use client";

import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useI18n } from "@/i18n/client";
import { Button, type ButtonStyle } from "./button";

/** Submit button that shows progress while its form's server action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  ...style
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  "aria-pressed"?: boolean;
} & ButtonStyle) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...style}>
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

/** Asks before running a destructive form action. */
export function ConfirmButton({
  children,
  message,
  ...style
}: { children: ReactNode; message: string } & ButtonStyle) {
  return (
    <Button
      type="submit"
      variant="danger"
      {...style}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
