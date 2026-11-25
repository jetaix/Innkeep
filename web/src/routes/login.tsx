import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { ApiError, rpc, unwrap } from "../api/client";
import { loadMessages, useI18n } from "../i18n";
import { color, text } from "../tokens.stylex";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/form";
import { Card, Loading, Notice } from "../ui/primitives";

export const Route = createFileRoute("/login")({
  loader: () => {
    void loadMessages("auth");
  },
  component: () => (
    <main {...stylex.props(styles.main)}>
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    </main>
  ),
});

const styles = stylex.create({
  main: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    maxWidth: "24rem",
    minHeight: "100dvh",
    marginInline: "auto",
    padding: "3rem 1.25rem",
  },
  title: { margin: 0, fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.025em" },
  intro: { margin: "0.25rem 0 1.25rem", color: color.muted, fontSize: text.md },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
    padding: "1.25rem",
  },
  wide: { width: "100%" },
});

function LoginPage() {
  const t = useI18n("auth").m.auth;
  const navigate = useNavigate();
  const signIn = useMutation({
    mutationFn: (password: string) => unwrap(rpc.session.$post({ json: { password } })),
    onSuccess: async (_data, _password, _result, { client }) => {
      await client.invalidateQueries();
      await navigate({ to: "/overview" });
    },
  });
  // The server answers in English; the page says it in the host's language.
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
      <h1 {...stylex.props(styles.title)}>Innkeep</h1>
      <p {...stylex.props(styles.intro)}>{t.intro}</p>
      <Card>
        <form
          {...stylex.props(styles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            signIn.mutate(String(new FormData(event.currentTarget).get("password") ?? ""));
          }}
        >
          <Field label={t.password} htmlFor="password" xstyle={styles.wide}>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              aria-describedby={error ? "password-error" : undefined}
            />
          </Field>
          {error && (
            <Notice tone="critical" role="alert" id="password-error" xstyle={styles.wide}>
              {error}
            </Notice>
          )}
          <Button type="submit" variant="primary" disabled={signIn.isPending} aria-busy={signIn.isPending}>
            {signIn.isPending ? t.checking : t.submit}
          </Button>
        </form>
      </Card>
    </>
  );
}
