import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { ApiError, rpc, unwrap } from "../api/client";
import { loadMessages, useI18n } from "../i18n";
import { Glass } from "../brand/glass";
import { LogoMark } from "../brand/logo";
import { color, font, radius, shadow, text } from "../tokens.stylex";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/form";
import { Loading, Notice } from "../ui/primitives";

export const Route = createFileRoute("/login")({
  loader: () => {
    void loadMessages("auth");
  },
  component: () => (
    <main {...stylex.props(styles.main)}>
      {/* The two calendars as two doorways of glass, overlapping behind the door. */}
      <div aria-hidden {...stylex.props(styles.glass)}>
        <Glass tint="coral" xstyle={styles.archOne} />
        <Glass tint="blue" xstyle={styles.archTwo} />
      </div>
      <Suspense fallback={<Loading />}>
        <LoginPage />
      </Suspense>
    </main>
  ),
});

const SMALL = "@media (min-width: 40rem)";

const styles = stylex.create({
  main: {
    position: "relative",
    isolation: "isolate",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    padding: "3rem 1.25rem",
    overflow: "hidden",
  },
  glass: {
    position: "absolute",
    zIndex: -1,
    top: "50%",
    left: "50%",
    width: { default: "22rem", [SMALL]: "34rem" },
    height: { default: "30rem", [SMALL]: "40rem" },
    translate: "-50% -50%",
  },
  archOne: { top: 0, left: 0, width: "62%", height: "88%", rotate: "-4deg" },
  archTwo: { bottom: 0, right: 0, width: "62%", height: "88%", rotate: "3deg" },
  door: {
    width: "100%",
    maxWidth: "23rem",
    padding: { default: "1.5rem", [SMALL]: "2rem" },
    borderRadius: "1.75rem",
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  mark: { width: "2.25rem", height: "2.25rem" },
  title: {
    margin: "0.875rem 0 0",
    fontFamily: font.display,
    fontSize: "2rem",
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  intro: { margin: "0.5rem 0 1.5rem", color: color.muted, fontSize: text.md, lineHeight: 1.55 },
  form: { display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.875rem" },
  field: { height: "2.75rem", borderRadius: radius.xl },
  wide: { width: "100%" },
});

function LoginPage() {
  const t = useI18n("auth").m.auth;
  const navigate = useNavigate();
  const signIn = useMutation({
    mutationFn: (json: { email: string; password: string }) => unwrap(rpc.session.$post({ json })),
    onSuccess: async (_data, _sent, _result, { client }) => {
      await client.invalidateQueries();
      // A visitor's own pages: the frame sends them on from here.
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
      <div {...stylex.props(styles.door)}>
        <LogoMark tone="color" xstyle={styles.mark} />
        <h1 {...stylex.props(styles.title)}>Innkeep</h1>
        <p {...stylex.props(styles.intro)}>{t.intro}</p>
        <form
          {...stylex.props(styles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            signIn.mutate({
              email: String(fields.get("email") ?? ""),
              password: String(fields.get("password") ?? ""),
            });
          }}
        >
          <Field label={t.email} htmlFor="email" hint={t.emailHint} xstyle={styles.wide}>
            <Input id="email" name="email" type="email" autoComplete="username" xstyle={styles.field} />
          </Field>
          <Field label={t.password} htmlFor="password" xstyle={styles.wide}>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              autoComplete="current-password"
              aria-describedby={error ? "password-error" : undefined}
              xstyle={styles.field}
            />
          </Field>
          {error && (
            <Notice tone="critical" role="alert" id="password-error" xstyle={styles.wide}>
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
      </div>
    </>
  );
}
