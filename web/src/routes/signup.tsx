import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { ApiError } from "../api/client";
import { signUp as signUpOptions } from "../api/mutations";
import { accountQuery } from "../api/queries";
import { Door, Doorway, doorStyles } from "../features/auth/door";
import { loadMessages, useI18n } from "../i18n";
import { Button, buttonStyle } from "../ui/button";
import { Field, Input } from "../ui/form";
import { Loading, Notice } from "../ui/primitives";

/** The shortest password the server takes (see `src/features/members/mutations.ts`). */
const MIN_PASSWORD = 10;

/** Creating an account: a name, an address and a password, and an empty Innkeep of one's own. */
export const Route = createFileRoute("/signup")({
  loader: ({ context }) => {
    void loadMessages("auth");
    void context.queryClient.prefetchQuery(accountQuery);
  },
  component: () => (
    <Doorway>
      <Suspense fallback={<Loading />}>
        <SignUpPage />
      </Suspense>
    </Doorway>
  ),
});

function SignUpPage() {
  const t = useI18n("auth").m.auth.signUp;
  const navigate = useNavigate();
  const { open, claimable } = useSuspenseQuery(accountQuery).data;
  const signUp = useMutation(signUpOptions);
  const refused = signUp.error instanceof ApiError ? signUp.error : null;
  // The server answers in English; the page says it in the reader's language.
  const error = !signUp.isError
    ? null
    : !refused
      ? signUp.error.message
      : refused.status === 429
        ? t.tooMany
        : refused.message.includes('"claim"')
          ? t.claimWrong
          : refused.message.includes('"email"') && /@/.test(signUp.variables?.email ?? "")
            ? t.taken
            : refused.status === 400
              ? t.check
              : refused.message;

  // Closed to strangers, but the owner of what was here before accounts still gets in with its password.
  if (!open && !claimable) {
    return (
      <>
        <title>{`${t.title} · Innkeep`}</title>
        <Door title={t.title} intro={t.closed}>
          <Link to="/login" {...stylex.props(buttonStyle({}))}>
            {t.signIn}
          </Link>
        </Door>
      </>
    );
  }

  return (
    <>
      <title>{`${t.title} · Innkeep`}</title>
      <Door title={t.title} intro={t.intro}>
        <form
          {...stylex.props(doorStyles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            signUp.mutate(
              {
                name: String(fields.get("name") ?? ""),
                email: String(fields.get("email") ?? ""),
                password: String(fields.get("password") ?? ""),
                claim: String(fields.get("claim") ?? ""),
              },
              { onSuccess: () => navigate({ to: "/overview" }) },
            );
          }}
        >
          <Field label={t.name} htmlFor="name" xstyle={doorStyles.wide}>
            <Input
              id="name"
              name="name"
              required
              autoFocus
              maxLength={100}
              autoComplete="name"
              xstyle={doorStyles.field}
            />
          </Field>
          <Field label={t.email} htmlFor="email" hint={t.emailHint} xstyle={doorStyles.wide}>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              xstyle={doorStyles.field}
            />
          </Field>
          <Field
            label={t.password}
            htmlFor="password"
            hint={t.passwordHint(MIN_PASSWORD)}
            xstyle={doorStyles.wide}
          >
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              xstyle={doorStyles.field}
            />
          </Field>
          {claimable && (
            <Field label={t.claim} htmlFor="claim" hint={t.claimHint} xstyle={doorStyles.wide}>
              <Input
                id="claim"
                name="claim"
                type="password"
                required={!open}
                autoComplete="off"
                maxLength={500}
                xstyle={doorStyles.field}
              />
            </Field>
          )}
          {error && (
            <Notice tone="critical" role="alert" xstyle={doorStyles.wide}>
              {error}
            </Notice>
          )}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={signUp.isPending}
            aria-busy={signUp.isPending}
          >
            {signUp.isPending ? t.creating : t.submit}
          </Button>
        </form>
        <p {...stylex.props(doorStyles.other)}>
          {t.haveAccount}{" "}
          <Link to="/login" {...stylex.props(doorStyles.link)}>
            {t.signIn}
          </Link>
        </p>
      </Door>
    </>
  );
}
