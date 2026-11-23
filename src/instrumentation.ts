/**
 * Background calendar sync, then the Telegram message about cleanings to
 * arrange. Runs inside the Next.js server process, so a self-hosted instance
 * needs no separate worker or cron job. SYNC_INTERVAL_MINUTES=0 turns the
 * sync off.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // A landing-only deployment has no calendars to sync.
  if (process.env.LANDING_ONLY === "1") return;
  // A serverless host freezes the process between requests: a scheduler calls /api/cron instead.
  if (process.env.VERCEL) return;

  const minutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? 15);
  const syncing = Number.isFinite(minutes) && minutes > 0;
  const { telegramBot } = await import("@/lib/telegram");
  // Telegram notifications still go out when the sync is switched off.
  if (!syncing && !telegramBot()) return;

  const scope = globalThis as unknown as { __innkeepSync?: NodeJS.Timeout };
  if (scope.__innkeepSync) return;

  const { syncAll } = await import("@/channels/sync");
  const { notifyCleanings } = await import("@/features/cleaning/notify");
  const run = async () => {
    if (syncing) await syncAll().catch((error) => console.error("[innkeep] calendar sync failed", error));
    // After the sync, so a booking that just arrived is announced in the same run.
    await notifyCleanings().catch((error) => console.error("[innkeep] Telegram notification failed", error));
  };

  // Catch up straight away after a restart, then keep going on the interval.
  setTimeout(run, 5_000).unref();
  scope.__innkeepSync = setInterval(run, (syncing ? minutes : 15) * 60_000);
  scope.__innkeepSync.unref();
}
