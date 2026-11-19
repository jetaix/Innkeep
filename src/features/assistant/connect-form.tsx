"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import { connectClaude, type ConnectState } from "./actions";

/** Paste a key, test it with Anthropic, keep it if it works. */
export function ConnectForm() {
  const t = useI18n().m.assistant.connect;
  const [state, action, pending] = useActionState<ConnectState, FormData>(connectClaude, { error: null });

  return (
    <form action={action} className="mt-3 space-y-3">
      <Field label={t.label} htmlFor="apiKey" hint={t.hint}>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          className="font-mono text-xs"
          aria-describedby={state.error ? "apiKey-error" : undefined}
        />
      </Field>
      {state.error && (
        <Notice tone="critical" role="alert" id="apiKey-error">
          {state.error}
        </Notice>
      )}
      <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
        {pending ? t.testing : t.submit}
      </Button>
    </form>
  );
}
