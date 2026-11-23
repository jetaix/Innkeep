"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { Notice } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import { signIn, type SignInState } from "./actions";

export function LoginForm() {
  const t = useI18n().m.auth;
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null });

  return (
    <form action={action} className="space-y-3">
      <Field label={t.password} htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-describedby={state.error ? "password-error" : undefined}
        />
      </Field>
      {state.error && (
        <Notice tone="critical" role="alert" id="password-error">
          {state.error}
        </Notice>
      )}
      <Button type="submit" variant="primary" disabled={pending} aria-busy={pending}>
        {pending ? t.checking : t.submit}
      </Button>
    </form>
  );
}
