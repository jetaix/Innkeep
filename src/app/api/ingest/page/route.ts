import { recordExtension } from "@/features/extension/status";
import { ingestPage, pageSchema } from "@/features/properties/pages";
import { hasBearerToken } from "@/lib/auth";

/**
 * Receives one admin page, kept as shown, from the Innkeep browser extension.
 *
 *   POST /api/ingest/page   { source, listingId, page: { key, title, lines, images } }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
export async function POST(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  recordExtension(request);

  const parsed = pageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const result = ingestPage(parsed.data);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: 409 });
}
