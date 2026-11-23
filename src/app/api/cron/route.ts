import { syncAll } from "@/channels/sync";
import { notifyCleanings } from "@/features/cleaning/notify";
import { hasBearerToken } from "@/lib/auth";

/**
 * One round of background work, for hosts with no process that stays awake:
 * imports every calendar, then sends the Telegram messages that are due.
 * A scheduler calls it; on a server of your own the timer in
 * `instrumentation.ts` does the same and this is not needed.
 *
 *   GET /api/cron
 *   Authorization: Bearer $CRON_SECRET
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Set CRON_SECRET to enable scheduled runs" }, { status: 503 });
  if (!hasBearerToken(request, secret)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sync = await syncAll();
  // A failed message must not hide the sync that worked; it is retried on the next run.
  const notified = await notifyCleanings().catch((cause: unknown) => ({
    error: cause instanceof Error ? cause.message : String(cause),
  }));
  return Response.json({ ok: true, sync, notified });
}
