"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import { chooseTelegramChat, findTelegramChatsAction, type TelegramChatsState } from "./actions";

/** Lets the host pick the chat the bot writes to from the ones Telegram knows, instead of typing a number. */
export function TelegramFind() {
  const t = useI18n().m.cleaning.telegram.find;
  const [state, find, searching] = useActionState<TelegramChatsState>(findTelegramChatsAction, {
    chats: null,
    error: null,
  });

  return (
    <div className="mt-3 space-y-3">
      <p>{t.intro}</p>
      <form action={find}>
        <Button type="submit" size="sm" variant="primary" disabled={searching} aria-busy={searching}>
          {searching ? t.searching : state.chats ? t.again : t.button}
        </Button>
      </form>
      {state.error && (
        <Notice tone="critical" role="alert">
          {t.failed(state.error)}
        </Notice>
      )}
      {state.chats?.length === 0 && <Notice tone="warn">{t.none}</Notice>}
      {state.chats && state.chats.length > 0 && (
        <ul className="divide-y divide-line rounded-md border border-line">
          {state.chats.map((chat) => (
            <li key={chat.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <span className="min-w-0">
                <span className="font-medium text-ink">{chat.title}</span>{" "}
                <span className="text-xs">{t.kinds[chat.kind]}</span>
              </span>
              <form action={chooseTelegramChat}>
                <input type="hidden" name="id" value={chat.id} />
                <input type="hidden" name="title" value={chat.title} />
                <SubmitButton size="sm">{t.use}</SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
