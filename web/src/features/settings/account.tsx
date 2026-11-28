import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ApiError } from "../../api/client";
import { changePassword, signOut } from "../../api/mutations";
import { sessionQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { Button } from "../../ui/button";
import { Field, Input } from "../../ui/form";
import { Badge, Notice } from "../../ui/primitives";

/** The shortest password the server takes (see `src/features/members/mutations.ts`). */
const MIN_PASSWORD = 10;

const styles = stylex.create({
  parts: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  who: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem" },
  identity: { flexBasis: "12rem", flexGrow: 1, minWidth: 0 },
  name: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    fontWeight: 500,
  },
  small: { margin: 0, color: color.muted, fontSize: text.sm, overflowWrap: "anywhere" },
  form: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" },
  title: { margin: 0, fontSize: text.md, fontWeight: 600 },
  fields: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@media (min-width: 40rem)": "minmax(0, 1fr) minmax(0, 1fr)",
    },
    gap: "0.75rem",
    alignSelf: "stretch",
  },
});

/** Who is signed in, the way out, and their password. */
export function Account() {
  const { m } = useI18n("settings");
  const t = m.settings.account;
  const { member, role } = useSuspenseQuery(sessionQuery).data;
  const navigate = useNavigate();
  const leave = useMutation(signOut);
  const change = useMutation(changePassword);
  if (!member) return null;
  const refused = change.error instanceof ApiError ? change.error : null;
  const error = !change.isError
    ? null
    : refused?.message.includes('"current"')
      ? t.wrongCurrent
      : refused?.status === 400
        ? t.tooShort(MIN_PASSWORD)
        : change.error.message;

  return (
    <div {...stylex.props(styles.parts)}>
      <div {...stylex.props(styles.who)}>
        <div {...stylex.props(styles.identity)}>
          <p {...stylex.props(styles.name)}>
            {member.name}
            {role && <Badge>{m.common.roles[role]}</Badge>}
          </p>
          <p {...stylex.props(styles.small)}>{member.email}</p>
        </div>
        <Button
          size="sm"
          disabled={leave.isPending}
          onClick={() => leave.mutate(undefined, { onSuccess: () => navigate({ to: "/login" }) })}
        >
          {m.common.account.signOut}
        </Button>
      </div>
      <form
        {...stylex.props(styles.form)}
        onSubmit={(event) => {
          event.preventDefault();
          const sent = event.currentTarget;
          const fields = new FormData(sent);
          change.mutate(
            {
              current: String(fields.get("current") ?? ""),
              password: String(fields.get("password") ?? ""),
            },
            { onSuccess: () => sent.reset() },
          );
        }}
      >
        <h3 {...stylex.props(styles.title)}>{t.change}</h3>
        <div {...stylex.props(styles.fields)}>
          <Field label={t.current} htmlFor="current-password">
            <Input
              id="current-password"
              name="current"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label={t.next} htmlFor="new-password" hint={t.hint(MIN_PASSWORD)}>
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
            />
          </Field>
        </div>
        <SubmitButton pending={change.isPending} pendingLabel={t.saving}>
          {t.save}
        </SubmitButton>
        {change.isSuccess && (
          <p role="status" {...stylex.props(styles.small)}>
            {t.saved}
          </p>
        )}
      </form>
      {(error || leave.error) && (
        <Notice tone="critical" role="alert">
          {error ?? leave.error?.message}
        </Notice>
      )}
    </div>
  );
}
