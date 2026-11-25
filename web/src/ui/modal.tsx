import * as stylex from "@stylexjs/stylex";
import { X } from "lucide-react";
import { type ReactNode, useId, useRef } from "react";
import { useI18n } from "../i18n";
import { color, radius, shadow, text } from "../tokens.stylex";
import { Button, type ButtonStyle } from "./button";

const styles = stylex.create({
  dialog: {
    width: "calc(100vw - 2rem)",
    maxWidth: "28rem",
    margin: "auto",
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.xl,
    backgroundColor: color.panel,
    color: color.ink,
    boxShadow: shadow.panel,
    "::backdrop": { backgroundColor: "rgb(13 15 19 / 0.45)", backdropFilter: "blur(6px)" },
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.75rem 1.25rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  headText: { minWidth: 0 },
  title: { margin: 0, fontSize: text.md, fontWeight: 600, letterSpacing: "-0.01em" },
  description: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  body: { padding: "1.25rem" },
});

/**
 * A button that opens its children in a dialog. Built on the browser's own
 * `<dialog>`, which traps focus, closes on Escape and hands focus back to the
 * button. A form sent from inside closes it: the page behind shows the result.
 */
export function Modal({
  label,
  title,
  description,
  children,
  xstyle,
  ...style
}: {
  /** The button's text. */
  label: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  xstyle?: stylex.StyleXStyles;
} & ButtonStyle) {
  const { m } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();

  return (
    <>
      <Button
        xstyle={xstyle}
        {...style}
        onClick={() => {
          dialog.current?.showModal();
          // Start in the form, not on the close button.
          dialog.current?.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea")?.focus();
        }}
      >
        {label}
      </Button>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the keyboard closes it with Escape or the close button */}
      <dialog
        ref={dialog}
        aria-labelledby={heading}
        {...stylex.props(styles.dialog)}
        // A click on the backdrop lands on the dialog element itself. Escape is the dialog's own.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        // Let the form start its request first, then get out of the way.
        onSubmit={(event) => {
          const element = event.currentTarget;
          setTimeout(() => element.close(), 0);
        }}
      >
        <div {...stylex.props(styles.head)}>
          <div {...stylex.props(styles.headText)}>
            <h2 id={heading} {...stylex.props(styles.title)}>
              {title}
            </h2>
            {description && <p {...stylex.props(styles.description)}>{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={m.common.actions.close}
            title={m.common.actions.close}
            onClick={() => dialog.current?.close()}
          >
            <X aria-hidden size={14} />
          </Button>
        </div>
        <div {...stylex.props(styles.body)}>{children}</div>
      </dialog>
    </>
  );
}
