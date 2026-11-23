import { recordExtension } from "@/features/extension/status";
import { conversationSchema, ingestConversation } from "@/features/inbox/ingest";
import { hasBearerToken } from "@/lib/auth";

/**
 * Receives a conversation of the host's own inbox, from the Innkeep browser
 * extension, when the host opened it and turned that on in its settings.
 *
 *   POST /api/ingest/messages   { source, threadId, guestName, messages: [{ direction, body, sentAt }] }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
export async function POST(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await recordExtension(request);

  const parsed = conversationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const result = await ingestConversation(parsed.data);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: 409 });
}
