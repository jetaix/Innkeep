import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { ApiError } from "../api/client";
import { signIn as signInOptions } from "../api/mutations";
import { accountQuery } from "../api/queries";
import { Door, Doorway, doorStyles } from "../features/auth/door";
import { loadMessages, useI18n } from "../i18n";
import { VISITOR_HOME } from "../roles";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/form";
import { Loading, Notice } from "../ui/primitives";

export const Route = createFileRoute("/login")({
  loader: () => {
    void loadMessages("auth");
  },
  component: () => (
    <Doorway>
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    </Doorway>
  ),
});

function LoginPage() {
  const t = useI18n("auth").m.auth;
  const navigate = useNavigate();
  // Whether to offer an account at all: a host may have closed sign-up.
  const account = useQuery(accountQuery);
  const signIn = useMutation(signInOptions);
  // The server answers in English; the page says it in the reader's language.
  const error = !signIn.isError
    ? null
    : signIn.error instanceof ApiError && signIn.error.status === 429
      ? t.tooMany
      : signIn.error instanceof ApiError && signIn.error.status === 401
        ? t.wrong
        : signIn.error.message;
  return (
    <>
      <title>{`${t.title} · Innkeep`}</title>
      <Door title={t.title} intro={t.intro}>
        <form
          {...stylex.props(doorStyles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            signIn.mutate(
              { email: String(fields.get("email") ?? ""), password: String(fields.get("password") ?? "") },
              { onSuccess: ({ role }) => navigate({ to: role === "visitor" ? VISITOR_HOME : "/overview" }) },
            );
          }}
        >
          <Field label={t.email} htmlFor="email" xstyle={doorStyles.wide}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              xstyle={doorStyles.field}
            />
          </Field>
          <Field label={t.password} htmlFor="password" xstyle={doorStyles.wide}>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              aria-describedby={error ? "sign-in-error" : undefined}
              xstyle={doorStyles.field}
            />
          </Field>
          {error && (
            <Notice tone="critical" role="alert" id="sign-in-error" xstyle={doorStyles.wide}>
              {error}
            </Notice>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={signIn.isPending}
            aria-busy={signIn.isPending}
          >
            {signIn.isPending ? t.checking : t.submit}
          </Button>
        </form>
        <p {...stylex.props(doorStyles.other)}>{t.forgot}</p>
        {account.data?.open && (
          <p {...stylex.props(doorStyles.other)}>
            {t.noAccount}{" "}
            <Link to="/signup" {...stylex.props(doorStyles.link)}>
              {t.createAccount}
            </Link>
          </p>
        )}
      </Door>
    </>
  );
}
