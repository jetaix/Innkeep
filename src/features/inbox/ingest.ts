import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { conversations, getDb, listings, messages, OTA_CHANNELS, reservations, type OtaChannel } from "@/db";

/**
 * A conversation as a platform's own inbox shows it, sent by the browser
 * extension when the host opens it there and has turned that on. Messages
 * already kept are recognised, so reading a conversation again only adds
 * what is new. Nothing is ever sent back to the platform.
 */
export const conversationSchema = z.object({
  source: z.enum(OTA_CHANNELS),
  threadId: z
    .string()
    .trim()
    .regex(/^\d{3,20}$/),
  guestName: z.string().trim().min(1).max(80),
  messages: z
    .array(
      z.object({
        direction: z.enum(["in", "out"]),
        body: z.string().trim().min(1).max(5000),
        /** When it was sent; null when the page did not say clearly. */
        sentAt: z.number().int().positive().nullish(),
      }),
    )
    .min(1)
    .max(500),
});

type Incoming = z.infer<typeof conversationSchema>["messages"][number];

/** Who, when and the opening words: the inbox gives a message no id of its own. */
export const messageKey = (message: Incoming) =>
  `${message.direction}|${message.sentAt ?? ""}|${message.body.slice(0, 80)}`;

/** Messages from the guest after the host's last one: what still waits for an answer. */
export const awaitingReply = (thread: Pick<Incoming, "direction">[]) => {
  const lastOut = thread.findLastIndex((message) => message.direction === "out");
  return thread.length - 1 - lastOut;
};

/**
 * The property a conversation is about. With one listing on the platform
 * there is no doubt; with several, the guest's own reservation says which.
 */
async function propertyFor(source: OtaChannel, guestName: string): Promise<number | null> {
  const db = getDb();
  const owned = await db
    .select({ propertyId: listings.propertyId })
    .from(listings)
    .where(eq(listings.channel, source))
    .all();
  const properties = [...new Set(owned.map((listing) => listing.propertyId))];
  if (properties.length <= 1) return properties[0] ?? null;

  const first = guestName.split(/\s+/)[0].toLowerCase();
  const stays = await db
    .select({ propertyId: reservations.propertyId, guestName: reservations.guestName })
    .from(reservations)
    .where(and(eq(reservations.source, source), isNotNull(reservations.guestName)))
    .all();
  const matches = new Set(
    stays
      .filter((stay) => stay.guestName?.toLowerCase().split(/\s+/)[0] === first)
      .map((stay) => stay.propertyId),
  );
  return matches.size === 1 ? [...matches][0] : null;
}

export async function ingestConversation(
  input: z.input<typeof conversationSchema>,
): Promise<{ ok: true; added: number; total: number } | { ok: false; error: string }> {
  const parsed = conversationSchema.parse(input);
  const db = getDb();
  const known = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.source, parsed.source), eq(conversations.externalThreadId, parsed.threadId)))
    .get();
  const propertyId = known?.propertyId ?? (await propertyFor(parsed.source, parsed.guestName));
  if (propertyId == null) {
    return {
      ok: false,
      error: "Innkeep cannot tell which of your properties this conversation is about.",
    };
  }

  const now = Date.now();
  // A message with no clear time keeps its place: just before now, in the order shown.
  const timed = parsed.messages.map((message, index) => ({
    ...message,
    key: messageKey(message),
    at: message.sentAt ?? now - (parsed.messages.length - index) * 1000,
  }));
  const lastAt = Math.max(...timed.map((message) => message.at));

  let added = 0;
  await db.transaction(async (tx) => {
    const conversation =
      known ??
      (await tx
        .insert(conversations)
        .values({
          propertyId,
          source: parsed.source,
          guestName: parsed.guestName,
          externalThreadId: parsed.threadId,
          lastMessageAt: lastAt,
        })
        .returning()
        .get());

    for (const message of timed) {
      const row = await tx
        .insert(messages)
        .values({
          conversationId: conversation.id,
          direction: message.direction,
          body: message.body,
          sentAt: message.at,
          externalKey: message.key,
        })
        .onConflictDoNothing({ target: [messages.conversationId, messages.externalKey] })
        .returning({ id: messages.id })
        .get();
      if (row) added++;
    }

    if (added > 0 || !known) {
      await tx
        .update(conversations)
        .set({
          guestName: parsed.guestName,
          lastMessageAt: Math.max(lastAt, known?.lastMessageAt ?? 0),
          unread: awaitingReply(parsed.messages),
        })
        .where(eq(conversations.id, conversation.id))
        .run();
    }
  });
  return { ok: true, added, total: parsed.messages.length };
}
