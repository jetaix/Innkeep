import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { CHANNELS } from "@/channels";
import { conversations, getDb, messages, properties, type Conversation } from "@/db";
import { CopyButton, SubmitButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Card, EmptyState, Kbd, PageHeader, SourceBadge, SourceDot } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { sendMessage } from "@/features/inbox/actions";
import { cn } from "@/lib/cn";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.inbox.title };
}

export default async function InboxPage({ searchParams }: PageProps<"/inbox">) {
  const { m } = await getI18n();
  const t = m.inbox;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Inbox searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Inbox({ searchParams }: Pick<PageProps<"/inbox">, "searchParams">) {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.inbox;
  const selectedId = Number((await searchParams).c) || null;
  const db = getDb();

  // Opening a conversation marks it as read.
  if (selectedId)
    await db.update(conversations).set({ unread: 0 }).where(eq(conversations.id, selectedId)).run();

  const all = await db
    .select({ conversation: conversations, propertyName: properties.name })
    .from(conversations)
    .innerJoin(properties, eq(properties.id, conversations.propertyId))
    .orderBy(desc(conversations.lastMessageAt))
    .all();

  if (all.length === 0) {
    return (
      <EmptyState title={t.empty.title}>
        {t.empty.before} <code className="font-mono text-xs text-ink">POST /api/webhooks/messages</code>{" "}
        {t.empty.after}
      </EmptyState>
    );
  }

  const selectedIndex = all.findIndex((row) => row.conversation.id === selectedId);
  const selected = all[selectedIndex];
  // J / K step through conversations, as in most mail clients.
  const nextId = all[selectedIndex + 1]?.conversation.id ?? (selected ? undefined : all[0].conversation.id);
  const previousId = selectedIndex > 0 ? all[selectedIndex - 1].conversation.id : undefined;
  const thread = selected
    ? await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, selected.conversation.id))
        .orderBy(asc(messages.sentAt))
        .all()
    : [];
  const previews = new Map(
    await Promise.all(
      all.map(
        async ({ conversation }) =>
          [
            conversation.id,
            await db
              .select({ body: messages.body, direction: messages.direction })
              .from(messages)
              .where(eq(messages.conversationId, conversation.id))
              .orderBy(desc(messages.sentAt))
              .limit(1)
              .get(),
          ] as const,
      ),
    ),
  );

  return (
    <Card className="flex min-h-[32rem] max-w-6xl overflow-hidden md:h-[calc(100dvh-9rem)]">
      <ul
        className={`w-full shrink-0 divide-y divide-line overflow-y-auto md:w-80 md:border-r md:border-line ${
          selected ? "hidden md:block" : ""
        }`}
      >
        {all.map(({ conversation, propertyName }) => {
          const preview = previews.get(conversation.id);
          const active = conversation.id === selected?.conversation.id;
          return (
            <li key={conversation.id}>
              <Link
                href={`/inbox?c=${conversation.id}`}
                prefetch={false}
                aria-current={active ? "true" : undefined}
                data-shortcut={
                  conversation.id === nextId ? "j" : conversation.id === previousId ? "k" : undefined
                }
                className={cn("block px-4 py-3", active ? "bg-sunken" : "hover:bg-subtle")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate", conversation.unread ? "font-semibold" : "font-medium")}>
                    {conversation.guestName}
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {fmt.timeAgo(conversation.lastMessageAt)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <SourceDot source={conversation.source} />
                  <span className="truncate">
                    {m.common.sources[conversation.source]} · {propertyName}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p
                    className={cn("min-w-0 flex-1 truncate", conversation.unread ? "text-ink" : "text-muted")}
                  >
                    {preview?.direction === "out" && t.list.you}
                    {preview?.body}
                  </p>
                  {conversation.unread > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-inverse">
                      {conversation.unread}
                      <span className="sr-only"> {t.list.unread}</span>
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <Thread conversation={selected.conversation} propertyName={selected.propertyName} thread={thread} />
      ) : (
        <p className="hidden flex-1 items-center justify-center gap-1.5 text-muted md:flex">
          {t.list.selectBefore} <Kbd>J</Kbd> {t.list.selectAfter}
        </p>
      )}
    </Card>
  );
}

async function Thread({
  conversation,
  propertyName,
  thread,
}: {
  conversation: Conversation;
  propertyName: string;
  thread: (typeof messages.$inferSelect)[];
}) {
  const { m, fmt } = await getI18n();
  const t = m.inbox;
  const adapter = conversation.source === "direct" ? null : CHANNELS[conversation.source];
  const canDeliver = Boolean(adapter?.capabilities.messaging);

  return (
    <section className="flex min-w-0 flex-1 flex-col" aria-label={t.thread.label(conversation.guestName)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
        <Link href="/inbox" data-shortcut="Escape" className={buttonClass({ size: "sm" }, "md:hidden")}>
          {t.thread.back}
        </Link>
        <h2 className="font-semibold">{conversation.guestName}</h2>
        <SourceBadge source={conversation.source} />
        <span className="text-muted">{propertyName}</span>
      </header>

      <ol className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto px-4 py-4">
        {/* Reversed so the newest message stays in view without scripting. */}
        {[...thread].reverse().map((message) => {
          const outgoing = message.direction === "out";
          return (
            <li
              key={message.id}
              className={cn("flex max-w-[85%] flex-col", outgoing ? "items-end self-end" : "items-start")}
            >
              <p
                className={cn(
                  "rounded-2xl px-3.5 py-2 leading-relaxed break-words whitespace-pre-line",
                  outgoing ? "bg-ink text-inverse" : "bg-sunken",
                )}
              >
                {message.body}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span>{fmt.dateTime(message.sentAt)}</span>
                {outgoing && message.delivery === "local" && adapter && (
                  <>
                    <span className="font-medium text-warn">{t.thread.notSent(adapter.label)}</span>
                    <CopyButton value={message.body} />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <form action={sendMessage.bind(null, conversation.id)} className="border-t border-line p-3">
        <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="body">
            {t.reply.label(conversation.guestName)}
          </label>
          <Textarea id="body" name="body" rows={2} required placeholder={t.reply.placeholder} />
          <SubmitButton variant="primary" pendingLabel={t.reply.saving}>
            {canDeliver || !adapter ? t.reply.send : t.reply.save}
          </SubmitButton>
        </div>
        {adapter && !canDeliver && (
          <p className="mt-2 text-xs text-muted">
            {t.reply.hintBefore(adapter.label)}{" "}
            <a href={adapter.inboxUrl} target="_blank" rel="noreferrer" className="underline">
              {t.reply.hintLink(adapter.label)}
            </a>
            {t.reply.hintAfter}
          </p>
        )}
      </form>
    </section>
  );
}
