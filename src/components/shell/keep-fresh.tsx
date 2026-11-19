"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Keeps the dashboard current without the host doing anything: when the app
 * is opened or its tab comes back into view, stale calendars are imported
 * again and the page re-reads the database (which also picks up details the
 * browser extension just sent from another tab).
 */
export function KeepFresh({ syncIfStale }: { syncIfStale: () => Promise<boolean> }) {
  const router = useRouter();

  useEffect(() => {
    let running = false;
    async function freshen() {
      if (document.visibilityState !== "visible" || running) return;
      running = true;
      try {
        // The action refreshes the page itself when it imported something.
        if (!(await syncIfStale())) router.refresh();
      } finally {
        running = false;
      }
    }

    void syncIfStale();
    document.addEventListener("visibilitychange", freshen);
    return () => document.removeEventListener("visibilitychange", freshen);
  }, [router, syncIfStale]);

  return null;
}
