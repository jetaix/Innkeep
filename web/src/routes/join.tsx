import * as stylex from "@stylexjs/stylex";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { ApiError, rpc, unwrap } from "../api/client";
import { invitationQuery } from "../api/queries";
import { LogoMark } from "../brand/logo";
import { loadMessages, useI18n } from "../i18n";
import { VISITOR_HOME } from "../roles";
import { color, font, radius, shadow, text } from "../tokens.stylex";
import { Button, buttonStyle } from "../ui/button";
import { Field, Input } from "../ui/form";
import { Loading, Notice } from "../ui/primitives";

/** The shortest password the server takes (see `src/features/members/mutations.ts`). */
const MIN_PASSWORD = 10;

/** Where an invitation link leads: the person chooses a name, an address and a password, and is in. */
export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" && search.token.length <= 100 ? search.token : undefined,
  }),
  loader: () => {
    void loadMessages("auth");
  },
  component: () => (
    <main {...stylex.props(styles.page)}>
      <Suspense fallback={<Loading />}>
        <JoinPage />
      </Suspense>
    </main>
  ),
});

const SMALL = "@media (min-width: 30rem)";

const styles = stylex.create({
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    padding: "1.5rem 1rem",
    backgroundColor: color.bg,
    color: color.ink,
  },
  door: {
    width: "100%",
    maxWidth: "26rem",
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
  strong: { display: "block", color: color.ink, fontWeight: 500 },
  form: { display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.875rem" },
  field: { height: "2.75rem", borderRadius: radius.xl },
  wide: { width: "100%" },
  back: { alignSelf: "flex-start" },
});

function JoinPage() {
  const { m } = useI18n("auth");
  const t = m.auth.join;
  const { token = "" } = Route.useSearch();
  const navigate = useNavigate();
  const invitation = useQuery({ ...invitationQuery(token), enabled: token !== "", retry: false });
  const join = useMutation({
    mutationFn: (json: { name: string; email: string; password: string }) =>
      unwrap(rpc.invitations[":token"].$post({ param: { token }, json })),
    onSuccess: async ({ role }, _sent, _result, { client }) => {
      // The link is used up: asking about it again would only fail.
      client.removeQueries({ queryKey: ["invitation"] });
      await client.invalidateQueries();
      await navigate({ to: role === "visitor" ? VISITOR_HOME : "/overview" });
    },
  });
  // The server answers in English; the page says it in the reader's language.
  const error = !join.isError
    ? null
    : !(join.error instanceof ApiError)
      ? join.error.message
      : join.error.message.includes('"invitation"')
        ? t.invalid
        : join.error.message.includes('"email"') && join.variables && /@/.test(join.variables.email)
          ? t.taken
          : join.error.status === 400
            ? t.check
            : join.error.message;

  if (invitation.isPending && token !== "") return <Loading />;
  const offered = invitation.data;

  return (
    <>
      <title>{`${t.title} · Innkeep`}</title>
      <div {...stylex.props(styles.door)}>
        <LogoMark tone="color" xstyle={styles.mark} />
        <h1 {...stylex.props(styles.title)}>{t.title}</h1>
        {!offered ? (
          <>
            <p {...stylex.props(styles.intro)}>{t.invalid}</p>
            <Link to="/login" {...stylex.props(buttonStyle({}), styles.back)}>
              {t.signIn}
            </Link>
          </>
        ) : (
          <>
            <p {...stylex.props(styles.intro)}>
              <span {...stylex.props(styles.strong)}>{t.invited(m.common.roles[offered.role])}</span>
              {t.can[offered.role]}
            </p>
            <form
              {...stylex.props(styles.form)}
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                join.mutate({
                  name: String(fields.get("name") ?? ""),
                  email: String(fields.get("email") ?? ""),
                  password: String(fields.get("password") ?? ""),
                });
              }}
            >
              <Field label={t.name} htmlFor="name" xstyle={styles.wide}>
                <Input
                  id="name"
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                  xstyle={styles.field}
                />
              </Field>
              <Field label={t.email} htmlFor="email" hint={t.emailHint} xstyle={styles.wide}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  defaultValue={/@/.test(offered.email) ? offered.email : ""}
                  xstyle={styles.field}
                />
              </Field>
              <Field
                label={t.password}
                htmlFor="password"
                hint={t.passwordHint(MIN_PASSWORD)}
                xstyle={styles.wide}
              >
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={MIN_PASSWORD}
                  autoComplete="new-password"
                  xstyle={styles.field}
                />
              </Field>
              {error && (
                <Notice tone="critical" role="alert" xstyle={styles.wide}>
                  {error}
                </Notice>
              )}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={join.isPending}
                aria-busy={join.isPending}
              >
                {join.isPending ? t.joining : t.submit}
              </Button>
            </form>
          </>
        )}
      </div>
    </>
  );
}
