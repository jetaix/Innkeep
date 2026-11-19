/**
 * Background calendar sync. Runs inside the Next.js server process, so a
 * self-hosted instance needs no separate worker or cron job.
 * SYNC_INTERVAL_MINUTES=0 turns it off.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const minutes = Number(process.env.SYNC_INTERVAL_MINUTES ?? 15);
  if (!Number.isFinite(minutes) || minutes <= 0) return;

  const scope = globalThis as unknown as { __innkeepSync?: NodeJS.Timeout };
  if (scope.__innkeepSync) return;

  const { syncAll } = await import("@/channels/sync");
  const run = () => syncAll().catch((error) => console.error("[innkeep] calendar sync failed", error));

  // Catch up straight away after a restart, then keep going on the interval.
  setTimeout(run, 5_000).unref();
  scope.__innkeepSync = setInterval(run, minutes * 60_000);
  scope.__innkeepSync.unref();
}
