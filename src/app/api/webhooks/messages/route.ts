import { and, eq, sql } from "drizzle-orm";
import { hasBearerToken } from "@/lib/auth";
import { conversations, getDb, messages, OTA_CHANNELS, properties, type Source } from "@/db";

/**
 * Inbound guest messages.
 *
 * Airbnb and Booking.com only expose messaging to approved partners, so this
 * endpoint is the open door: anything that can see a guest message (an email
 * parser on the notification emails, n8n, a partner-API bridge) can post it
 * here and it shows up in the inbox.
 *
 *   POST /api/webhooks/messages
 *   Authorization: Bearer $WEBHOOK_SECRET
 *   { "propertyId": 1, "source": "airbnb", "guestName": "Tom", "body": "Hi!",
 *     "threadId": "optional-stable-id", "sentAt": 1767225600000 }
 */
export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "Set WEBHOOK_SECRET to enable this endpoint" }, { status: 503 });

  if (!hasBearerToken(request, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const propertyId = Number(payload?.propertyId);
  const source = String(payload?.source ?? "") as Source;
  const guestName = String(payload?.guestName ?? "").trim();
  const body = String(payload?.body ?? "").trim();
  const sentAt = Number(payload?.sentAt) || Date.now();
  if (!Number.isInteger(propertyId) || !guestName || !body) {
    return Response.json({ error: "propertyId, guestName and body are required" }, { status: 400 });
  }
  if (source !== "direct" && !(OTA_CHANNELS as readonly string[]).includes(source)) {
    return Response.json({ error: "source must be airbnb, booking or direct" }, { status: 400 });
  }

  const db = getDb();
  if (!db.select({ id: properties.id }).from(properties).where(eq(properties.id, propertyId)).get()) {
    return Response.json({ error: "Unknown propertyId" }, { status: 404 });
  }

  // Without a thread id, one conversation per guest and property.
  const threadId = String(payload?.threadId ?? `${propertyId}:${guestName.toLowerCase()}`);
  const conversationId = db.transaction((tx) => {
    const existing = tx
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.source, source), eq(conversations.externalThreadId, threadId)))
      .get();
    const id =
      existing?.id ??
      tx
        .insert(conversations)
        .values({ propertyId, source, guestName, externalThreadId: threadId, lastMessageAt: sentAt })
        .returning({ id: conversations.id })
        .get().id;
    tx.insert(messages).values({ conversationId: id, direction: "in", body, sentAt }).run();
    tx.update(conversations)
      .set({ unread: sql`${conversations.unread} + 1`, lastMessageAt: sentAt })
      .where(eq(conversations.id, id))
      .run();
    return id;
  });

  return Response.json({ ok: true, conversationId }, { status: 201 });
}
