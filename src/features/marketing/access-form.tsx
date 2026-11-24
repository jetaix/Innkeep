"use client";

import { useActionState, useId } from "react";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/cn";
import { requestAccess, type AccessState } from "./actions";
import { pillClass } from "./pill";

const IDLE: AccessState = { status: "idle" };

/** The one thing the hosted page asks for: an email address, to be told when early access opens. */
export function AccessForm({ className }: { className?: string }) {
  const t = useI18n().m.marketing.access;
  const [state, action, pending] = useActionState(requestAccess, IDLE);
  const id = useId();

  if (state.status === "sent") {
    return (
      <p
        role="status"
        className={cn(
          "panel mx-auto flex min-h-14 max-w-md items-center justify-center rounded-full px-6 text-[15px] font-medium",
          className,
        )}
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className={cn("mx-auto max-w-md", className)}>
      <div className="panel flex items-center gap-1 rounded-full p-1.5 focus-within:shadow-[0_0_0_2px_var(--overlap),var(--shadow-panel)]">
        <label htmlFor={id} className="sr-only">
          {t.label}
        </label>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t.placeholder}
          aria-describedby={`${id}-note`}
          aria-invalid={state.status === "error"}
          className="h-11 min-w-0 flex-1 rounded-full bg-transparent px-4 text-base outline-none placeholder:text-faint"
        />
        {/* Hidden from people; a script that fills it is turned away. */}
        <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={cn(
            pillClass("primary"),
            "h-11 px-5 text-[15px] disabled:opacity-60 max-sm:px-3.5 max-sm:text-[13px]",
          )}
        >
          {pending ? t.pending : t.submit}
        </button>
      </div>
      <p
        id={`${id}-note`}
        role={state.status === "error" ? "alert" : undefined}
        className={cn(
          "mt-3 text-center text-[13px]",
          state.status === "error" ? "font-medium text-overlap" : "text-muted",
        )}
      >
        {state.status === "error" ? state.message : t.note}
      </p>
    </form>
  );
}
