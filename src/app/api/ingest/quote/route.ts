import { recordExtension } from "@/features/extension/status";
import { ingestQuote, quoteSchema } from "@/features/pricing/ingest";
import { hasBearerToken } from "@/lib/auth";

/**
 * Receives what a guest is shown for one stay, from the Innkeep browser extension.
 *
 *   POST /api/ingest/quote   { source, listingId, checkIn, checkOut, guests?, total, original? }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
export async function POST(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await recordExtension(request);

  const parsed = quoteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const result = await ingestQuote(parsed.data);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: 409 });
}
