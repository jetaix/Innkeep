import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { chooseTelegramChat, findTelegramChats } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, radius, text } from "../../tokens.stylex";
import { Button } from "../../ui/button";
import { Notice } from "../../ui/primitives";

const styles = stylex.create({
  find: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginTop: "0.75rem",
  },
  plain: { margin: 0 },
  whole: { alignSelf: "stretch" },
  list: {
    alignSelf: "stretch",
    margin: 0,
    padding: 0,
    listStyle: "none",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: color.line,
    borderRadius: radius.md,
  },
  chat: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  about: { minWidth: 0 },
  title: { color: color.ink, fontWeight: 500 },
  kind: { fontSize: text.sm },
});

/** Lets the host pick the chat the bot writes to from the ones Telegram knows, instead of typing a number. */
export function TelegramFind() {
  const t = useI18n("cleaning").m.cleaning.telegram.find;
  const find = useMutation(findTelegramChats);
  const choose = useMutation(chooseTelegramChat);
  const chats = find.data?.chats ?? null;
  const error = find.data?.error ?? find.error?.message;

  return (
    <div {...stylex.props(styles.find)}>
      <p {...stylex.props(styles.plain)}>{t.intro}</p>
      <Button
        size="sm"
        variant="primary"
        disabled={find.isPending}
        aria-busy={find.isPending}
        onClick={() => find.mutate()}
      >
        {find.isPending ? t.searching : chats ? t.again : t.button}
      </Button>
      {error && (
        <Notice tone="critical" role="alert" xstyle={styles.whole}>
          {t.failed(error)}
        </Notice>
      )}
      {choose.error && (
        <Notice tone="critical" role="alert" xstyle={styles.whole}>
          {choose.error.message}
        </Notice>
      )}
      {chats?.length === 0 && (
        <Notice tone="warn" xstyle={styles.whole}>
          {t.none}
        </Notice>
      )}
      {chats && chats.length > 0 && (
        <ul {...stylex.props(styles.list)}>
          {chats.map((chat) => (
            <li key={chat.id} {...stylex.props(styles.chat)}>
              <span {...stylex.props(styles.about)}>
                <span {...stylex.props(styles.title)}>{chat.title}</span>{" "}
                <span {...stylex.props(styles.kind)}>{t.kinds[chat.kind]}</span>
              </span>
              <Button
                size="sm"
                disabled={choose.isPending}
                aria-busy={choose.isPending && choose.variables.id === chat.id}
                onClick={() => choose.mutate({ id: chat.id, title: chat.title })}
              >
                {t.use}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
