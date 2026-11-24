"use client";

import { X } from "lucide-react";
import { useId, useRef, type ReactNode } from "react";
import { useI18n } from "@/i18n/client";
import { Button, type ButtonStyle } from "./button";

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
  className,
  ...style
}: {
  /** The button's text. */
  label: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
} & ButtonStyle) {
  const { m } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();

  return (
    <>
      <Button
        className={className}
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
        className="m-auto w-[calc(100vw-2rem)] max-w-md rounded-lg border border-line bg-bg p-0 text-ink shadow-xl backdrop:bg-black/40"
        // A click on the backdrop lands on the dialog element itself. Escape is the dialog's own.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        // Let the form start its action first, then get out of the way.
        onSubmit={(event) => {
          const element = event.currentTarget;
          setTimeout(() => element.close(), 0);
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
          <div className="min-w-0">
            <h2 id={heading} className="text-sm font-semibold">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={m.common.actions.close}
            title={m.common.actions.close}
            onClick={() => dialog.current?.close()}
          >
            <X aria-hidden />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </dialog>
    </>
  );
}
