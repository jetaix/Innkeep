import { recordExtension } from "@/features/extension/status";
import { ingestPrices, pricesSchema } from "@/features/pricing/ingest";
import { hasBearerToken } from "@/lib/auth";

/**
 * Receives nightly prices from the Innkeep browser extension.
 *
 *   POST /api/ingest/prices   { source, listingId, prices: [{ date, amount, plan?, note? }] }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
export async function POST(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  recordExtension(request);

  const parsed = pricesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const result = ingestPrices(parsed.data);
  return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: 409 });
}
