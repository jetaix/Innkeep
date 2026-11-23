import { ingestReservations, ingestSchema } from "@/features/reservations/ingest";
import { CHANNELS } from "@/channels";
import { recordExtension, recordUpdate } from "@/features/extension/status";
import { reservationLinks } from "@/features/reservations/platform-links";
import { hasBearerToken } from "@/lib/auth";

/**
 * Receives reservation details from the Innkeep browser extension.
 *
 *   GET  /api/ingest/reservations   connection test; answers with the host's reservations pages
 *   POST /api/ingest/reservations   { source, reservations: [...] }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
async function authorise(request: Request): Promise<Response | null> {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await recordExtension(request);
  return null;
}

export async function GET(request: Request) {
  return (
    (await authorise(request)) ??
    Response.json({
      ok: true,
      app: "innkeep",
      // Where the extension's settings page sends the host next.
      links: (await reservationLinks()).map((link) => ({
        label: CHANNELS[link.channel].label,
        href: link.href,
      })),
    })
  );
}

export async function POST(request: Request) {
  const denied = await authorise(request);
  if (denied) return denied;

  const parsed = ingestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid payload", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }
  const result = await ingestReservations(parsed.data);
  await recordUpdate(parsed.data.source, result.updated + result.unchanged + result.added);
  return Response.json({ ok: true, ...result });
}
