import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { sync } from "../api/mutations";

/**
 * Keeps the dashboard current without the host doing anything: when the app
 * is opened or its tab comes back into view, stale calendars are imported
 * again and the pages read their data again (which also picks up details the
 * browser extension just sent from another tab).
 */
export function KeepFresh() {
  const client = useQueryClient();
  const { mutateAsync } = useMutation(sync);

  useEffect(() => {
    let running = false;
    async function freshen() {
      if (document.visibilityState !== "visible" || running) return;
      running = true;
      try {
        // An import refreshes every page on its own; without one, read again anyway.
        const { synced } = await mutateAsync(true);
        if (!synced) await client.invalidateQueries();
      } catch {
        // Offline, or the server is restarting: the next return to the tab tries again.
      } finally {
        running = false;
      }
    }

    mutateAsync(true).catch(() => {});
    document.addEventListener("visibilitychange", freshen);
    return () => document.removeEventListener("visibilitychange", freshen);
  }, [client, mutateAsync]);

  return null;
}
