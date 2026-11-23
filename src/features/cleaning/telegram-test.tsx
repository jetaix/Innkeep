"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import { sendTelegramTest, type TelegramTestState } from "./actions";

/** Sends a message to the host's Telegram and says whether it went through. */
export function TelegramTest() {
  const t = useI18n().m.cleaning.telegram;
  const [state, action, pending] = useActionState<TelegramTestState>(sendTelegramTest, {
    sent: false,
    error: null,
  });

  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <Button type="submit" size="sm" disabled={pending} aria-busy={pending}>
        {pending ? t.testSending : t.testButton}
      </Button>
      <span aria-live="polite">{state.sent && t.testSent}</span>
      {state.error && (
        <Notice tone="critical" role="alert" className="w-full">
          {t.testFailed(state.error)}
        </Notice>
      )}
    </form>
  );
}
