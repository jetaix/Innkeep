import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { invite, removeMember, revokeInvitation, setMemberRole } from "../../api/mutations";
import { membersQuery, sessionQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import type { Role } from "../../roles";
import { color, font, radius, text } from "../../tokens.stylex";
import { ConfirmButton, CopyButton, SubmitButton } from "../../ui/actions";
import { Button } from "../../ui/button";
import { Field, Input, Select } from "../../ui/form";
import { Badge, Notice } from "../../ui/primitives";

const ROLES: readonly Role[] = ["visitor", "admin"];

const styles = stylex.create({
  parts: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  list: { margin: 0, padding: 0, listStyle: "none" },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: "0.75rem",
    rowGap: "0.5rem",
    paddingBlock: "0.75rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  who: { flexBasis: "12rem", flexGrow: 1, minWidth: 0 },
  name: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    fontWeight: 500,
  },
  small: { margin: 0, color: color.muted, fontSize: text.sm, overflowWrap: "anywhere" },
  role: { width: "auto", minWidth: "9rem" },
  form: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.75rem" },
  title: { margin: 0, fontSize: text.md, fontWeight: 600 },
  fields: {
    display: "grid",
    gridTemplateColumns: { default: "minmax(0, 1fr)", "@media (min-width: 40rem)": "minmax(0, 1fr) 12rem" },
    gap: "0.75rem",
    alignSelf: "stretch",
  },
  link: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    alignSelf: "stretch",
    padding: "0.625rem 0.75rem",
    borderRadius: radius.md,
    backgroundColor: color.sunken,
  },
  address: {
    flexBasis: "12rem",
    flexGrow: 1,
    minWidth: 0,
    fontFamily: font.mono,
    fontSize: text.sm,
    overflowWrap: "anywhere",
  },
  stretch: { alignSelf: "stretch" },
  roles: { display: "flex", flexDirection: "column", gap: "0.125rem", margin: 0 },
  roleLine: { display: "flex", flexWrap: "wrap", columnGap: "0.5rem" },
  roleName: { fontSize: text.sm, fontWeight: 500 },
  code: { fontFamily: font.mono, fontSize: text.sm },
});

/**
 * Who can open this Innkeep, with which role, and the way in for someone
 * new: an invitation link the admin sends themselves. Innkeep sends no email.
 */
export function Members() {
  const { m, fmt } = useI18n("settings");
  const t = m.settings.members;
  const { passwordSet, member: me } = useSuspenseQuery(sessionQuery).data;
  const { members, invitations } = useSuspenseQuery(membersQuery).data;
  const change = useMutation(setMemberRole);
  const remove = useMutation(removeMember);
  const revoke = useMutation(revokeInvitation);
  const create = useMutation(invite);
  // The link of the invitation just made: shown once, here, and kept nowhere.
  const [link, setLink] = useState<string | null>(null);
  const failed = change.error ?? remove.error ?? revoke.error ?? create.error;

  if (!passwordSet) {
    return (
      <p {...stylex.props(styles.small)}>
        {t.needsPassword.before}
        <code {...stylex.props(styles.code)}>APP_PASSWORD</code>
        {t.needsPassword.after}
      </p>
    );
  }

  return (
    <div {...stylex.props(styles.parts)}>
      <ul {...stylex.props(styles.list)}>
        <li {...stylex.props(styles.row)}>
          <div {...stylex.props(styles.who)}>
            <p {...stylex.props(styles.name)}>
              {t.owner}
              {!me && <Badge>{t.you}</Badge>}
            </p>
            <p {...stylex.props(styles.small)}>{t.ownerNote}</p>
          </div>
          <Badge>{m.common.roles.admin}</Badge>
        </li>
        {members.map((member) => (
          <li key={member.id} {...stylex.props(styles.row)}>
            <div {...stylex.props(styles.who)}>
              <p {...stylex.props(styles.name)}>
                {member.name}
                {me?.id === member.id && <Badge>{t.you}</Badge>}
              </p>
              <p {...stylex.props(styles.small)}>{member.email}</p>
            </div>
            <Select
              aria-label={`${t.role}, ${member.name}`}
              value={member.role}
              disabled={change.isPending}
              onChange={(event) =>
                change.mutate({ member: member.id, role: event.currentTarget.value as Role })
              }
              xstyle={styles.role}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {m.common.roles[role]}
                </option>
              ))}
            </Select>
            <ConfirmButton
              variant="ghost"
              size="sm"
              message={t.confirmRemove(member.name)}
              pending={remove.isPending}
              onConfirm={() => remove.mutate(member.id)}
            >
              {t.remove}
            </ConfirmButton>
          </li>
        ))}
      </ul>

      {invitations.length > 0 && (
        <div>
          <h3 {...stylex.props(styles.title)}>{t.invite.waiting}</h3>
          <ul {...stylex.props(styles.list)}>
            {invitations.map((invitation) => (
              <li key={invitation.id} {...stylex.props(styles.row)}>
                <p {...stylex.props(styles.small, styles.who)}>
                  {t.invite.pending(
                    m.common.roles[invitation.role],
                    invitation.email,
                    fmt.date(new Date(invitation.expiresAt).toISOString().slice(0, 10)),
                  )}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(invitation.id)}
                >
                  {t.invite.revoke}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const sent = event.currentTarget;
          const fields = new FormData(sent);
          create.mutate(
            { role: fields.get("role") as Role, email: String(fields.get("email") ?? "") },
            {
              onSuccess: ({ token }) => {
                setLink(`${window.location.origin}/join?token=${token}`);
                sent.reset();
              },
            },
          );
        }}
        {...stylex.props(styles.form)}
      >
        <h3 {...stylex.props(styles.title)}>{t.invite.title}</h3>
        <div {...stylex.props(styles.fields)}>
          <Field label={t.invite.note} htmlFor="invite-email">
            <Input id="invite-email" name="email" maxLength={200} placeholder={t.invite.notePlaceholder} />
          </Field>
          <Field label={t.role} htmlFor="invite-role">
            <Select id="invite-role" name="role" defaultValue="visitor">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {m.common.roles[role]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <dl {...stylex.props(styles.roles)}>
          {ROLES.map((role) => (
            <div key={role} {...stylex.props(styles.roleLine)}>
              <dt {...stylex.props(styles.roleName)}>{m.common.roles[role]}</dt>
              <dd {...stylex.props(styles.small)}>{t.can[role]}</dd>
            </div>
          ))}
        </dl>
        <SubmitButton variant="primary" pending={create.isPending} pendingLabel={t.invite.creating}>
          {t.invite.submit}
        </SubmitButton>
        {link && (
          <div role="status" {...stylex.props(styles.stretch)}>
            <p {...stylex.props(styles.small)}>{t.invite.ready}</p>
            <div {...stylex.props(styles.link)}>
              <span {...stylex.props(styles.address)}>{link}</span>
              <CopyButton value={link} />
            </div>
          </div>
        )}
      </form>
      {failed && (
        <Notice tone="critical" role="alert">
          {failed.message}
        </Notice>
      )}
    </div>
  );
}
