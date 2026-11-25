import * as stylex from "@stylexjs/stylex";
import { useState } from "react";
import { pillStyle } from "../../brand/pill";
import { useI18n } from "../../i18n";

/** Copies the install request for an AI assistant: the main action for a host who is not technical. */
export function CopyRequest({ value, label }: { value: string; label: string }) {
  const { m } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      {...stylex.props(pillStyle("primary", "lg"))}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      <span aria-live="polite">{copied ? m.common.actions.copied : label}</span>
    </button>
  );
}
