import { ingestListing, listingSchema } from "@/features/properties/ingest";
import { recordExtension } from "@/features/extension/status";
import { hasBearerToken } from "@/lib/auth";

/**
 * Receives one listing from the Innkeep browser extension.
 *
 *   POST /api/ingest/listing   { source, listingId, listingUrl, title?, description?, details?, … }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
export async function POST(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await recordExtension(request);

  const parsed = listingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const result = await ingestListing(parsed.data);
  if (result.status === "unknown") return Response.json({ error: result.error }, { status: 409 });
  return Response.json({ ok: true, ...result });
}
