/**
 * Background calendar sync, then the Telegram message about cleanings to
 * arrange. Runs inside the server's own process, so a self-hosted Innkeep
 * needs no separate worker or cron job. SYNC_INTERVAL_MINUTES=0 turns the
 * sync off. On a serverless host nothing stays awake: a scheduler calls
 * `/api/cron` instead, and this is never started.
 */
export async function startBackground() {
  // A landing-only deployment has no calendars to sync.
  if (process.env.LANDING_ONLY === "1") return;

  const minutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? 15);
  const syncing = Number.isFinite(minutes) && minutes > 0;
  const { telegramBot } = await import("../../src/lib/telegram");
  // Telegram notifications still go out when the sync is switched off.
  if (!syncing && !telegramBot()) return;

  const { syncAll } = await import("../../src/channels/sync");
  const { notifyCleanings } = await import("../../src/features/cleaning/notify");
  const { withData } = await import("../../src/db");
  // The timer works on the host's own data, like the scheduler's request does.
  const run = () =>
    withData("real", async () => {
      if (syncing) await syncAll().catch((error) => console.error("[innkeep] calendar sync failed", error));
      // After the sync, so a booking that just arrived is announced in the same run.
      await notifyCleanings().catch((error) =>
        console.error("[innkeep] Telegram notification failed", error),
      );
    });

  // Catch up straight away after a restart, then keep going on the interval.
  setTimeout(run, 5_000).unref();
  setInterval(run, (syncing ? minutes : 15) * 60_000).unref();
}
