"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { CHANNELS } from "@/channels";
import { conversations, getDb, messages } from "@/db";
import { parseForm, text } from "@/lib/form";

export async function sendMessage(conversationId: number, form: FormData) {
  const parsed = parseForm(z.object({ body: text.min(1) }), form);
  if (!parsed.success) return;
  const { body } = parsed.data;

  const db = getDb();
  const conversation = db.select().from(conversations).where(eq(conversations.id, conversationId)).get();
  if (!conversation) return;

  // Direct guests have no channel to deliver to; channel guests need a messaging adapter.
  const send = conversation.source === "direct" ? undefined : CHANNELS[conversation.source].sendMessage;
  let delivery: "delivered" | "local" = "local";
  if (send && conversation.externalThreadId) {
    await send(conversation.externalThreadId, body);
    delivery = "delivered";
  }

  const now = Date.now();
  db.insert(messages).values({ conversationId, direction: "out", body, delivery, sentAt: now }).run();
  db.update(conversations).set({ lastMessageAt: now }).where(eq(conversations.id, conversationId)).run();
  refresh();
}
