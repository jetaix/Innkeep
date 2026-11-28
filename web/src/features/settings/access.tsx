import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { approveAccess, approveEmail, removeAccess } from "../../api/mutations";
import { accessRequestsQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { Button } from "../../ui/button";
import { Field, Input } from "../../ui/form";
import { Notice } from "../../ui/primitives";

const styles = stylex.create({
  parts: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  list: { margin: 0, padding: 0, listStyle: "none" },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.25rem",
    paddingBlock: "0.625rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  who: { flexBasis: "12rem", flexGrow: 1, minWidth: 0 },
  email: { margin: 0, fontWeight: 500, overflowWrap: "anywhere" },
  small: { margin: 0, color: color.muted, fontSize: text.sm },
  title: { margin: "0 0 0.25rem", fontSize: text.md, fontWeight: 600 },
  form: { display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "0.75rem" },
  field: { flexBasis: "14rem", flexGrow: 1, minWidth: 0 },
});

/**
 * The addresses that asked for an account and the ones let in. Approving
 * sends nothing: the host tells the person themselves.
 */
export function Access() {
  const { m, fmt } = useI18n("settings");
  const t = m.settings.access;
  const { requests } = useSuspenseQuery(accessRequestsQuery).data;
  const approve = useMutation(approveAccess);
  const remove = useMutation(removeAccess);
  const add = useMutation(approveEmail);
  const waiting = requests.filter((request) => request.status === "pending");
  const approved = requests.filter((request) => request.status === "approved");
  const busy = approve.isPending || remove.isPending;
  const failed = approve.error ?? remove.error ?? add.error;
  const day = (at: number) => fmt.date(new Date(at).toISOString().slice(0, 10));

  return (
    <div {...stylex.props(styles.parts)}>
      <p {...stylex.props(styles.small)}>{t.noEmail}</p>
      <div>
        <h3 {...stylex.props(styles.title)}>{t.waiting}</h3>
        {waiting.length === 0 ? (
          <p {...stylex.props(styles.small)}>{t.none}</p>
        ) : (
          <ul {...stylex.props(styles.list)}>
            {waiting.map((request) => (
              <li key={request.id} {...stylex.props(styles.row)}>
                <div {...stylex.props(styles.who)}>
                  <p {...stylex.props(styles.email)}>{request.email}</p>
                  <p {...stylex.props(styles.small)}>{t.asked(day(request.createdAt))}</p>
                </div>
                <Button
                  size="sm"
                  disabled={busy}
                  aria-label={`${t.approve}, ${request.email}`}
                  onClick={() => approve.mutate(request.id)}
                >
                  {t.approve}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  aria-label={`${t.remove}, ${request.email}`}
                  onClick={() => remove.mutate(request.id)}
                >
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {approved.length > 0 && (
        <div>
          <h3 {...stylex.props(styles.title)}>{t.approved}</h3>
          <ul {...stylex.props(styles.list)}>
            {approved.map((request) => (
              <li key={request.id} {...stylex.props(styles.row)}>
                <p {...stylex.props(styles.email, styles.who)}>{request.email}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  aria-label={`${t.remove}, ${request.email}`}
                  onClick={() => remove.mutate(request.id)}
                >
                  {t.remove}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form
        {...stylex.props(styles.form)}
        onSubmit={(event) => {
          event.preventDefault();
          const sent = event.currentTarget;
          add.mutate(String(new FormData(sent).get("email") ?? ""), { onSuccess: () => sent.reset() });
        }}
      >
        <Field label={t.add} htmlFor="access-email" xstyle={styles.field}>
          <Input id="access-email" name="email" type="email" required maxLength={254} />
        </Field>
        <SubmitButton pending={add.isPending} pendingLabel={t.saving}>
          {t.submit}
        </SubmitButton>
      </form>
      {failed && (
        <Notice tone="critical" role="alert">
          {failed instanceof ApiError && failed.status === 400 ? t.invalid : failed.message}
        </Notice>
      )}
    </div>
  );
}
