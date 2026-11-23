import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.DATABASE_PATH = ":memory:";
vi.mock("server-only", () => ({}));

import { asc, eq } from "drizzle-orm";
import { conversations, getDb, listings, messages, properties } from "@/db";
import { awaitingReply, ingestConversation } from "./ingest";

const thread = {
  source: "airbnb" as const,
  threadId: "2700000001",
  guestName: "Camille",
  messages: [
    { direction: "out" as const, body: "Bonjour Camille, bienvenue.", sentAt: 1_800_000_000_000 },
    { direction: "in" as const, body: "Merci, à quelle heure puis-je arriver ?", sentAt: 1_800_000_060_000 },
  ],
};

describe("awaitingReply", () => {
  it("counts the guest's messages since the host last wrote", () => {
    expect(awaitingReply([{ direction: "out" }, { direction: "in" }, { direction: "in" }])).toBe(2);
    expect(awaitingReply([{ direction: "in" }, { direction: "out" }])).toBe(0);
    expect(awaitingReply([{ direction: "in" }])).toBe(1);
  });
});

describe("ingestConversation", () => {
  beforeAll(async () => {
    const db = getDb();
    const property = await db
      .insert(properties)
      .values({ name: "Flat", icalToken: "t", createdAt: Date.now() })
      .returning({ id: properties.id })
      .get();
    await db.insert(listings).values({ propertyId: property.id, channel: "airbnb" }).run();
  });

  it("keeps a conversation and marks what waits for an answer", async () => {
    expect(await ingestConversation(thread)).toEqual({ ok: true, added: 2, total: 2 });
    const conversation = await getDb().select().from(conversations).get();
    expect(conversation).toMatchObject({ guestName: "Camille", unread: 1, lastMessageAt: 1_800_000_060_000 });
  });

  it("adds only what is new when the conversation is read again", async () => {
    const longer = {
      ...thread,
      messages: [
        ...thread.messages,
        { direction: "out" as const, body: "À partir de 16 h.", sentAt: 1_800_000_120_000 },
      ],
    };
    expect(await ingestConversation(longer)).toEqual({ ok: true, added: 1, total: 3 });
    expect(await ingestConversation(longer)).toEqual({ ok: true, added: 0, total: 3 });
    const conversation = await getDb().select().from(conversations).get();
    expect(conversation?.unread).toBe(0);
    const kept = await getDb()
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversation!.id))
      .orderBy(asc(messages.sentAt))
      .all();
    expect(kept.map((message) => message.direction)).toEqual(["out", "in", "out"]);
  });

  it("refuses a conversation when no property is on that platform", async () => {
    const result = await ingestConversation({ ...thread, source: "booking", threadId: "999" });
    expect(result.ok).toBe(false);
  });
});
