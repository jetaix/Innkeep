"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

const KEY = "innkeep:update-prompt-dismissed";
const listeners = new Set<() => void>();

function read() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Hides its content until the browser tab is closed, once the host says "Later". */
export function DismissForNow({ children }: { children: ReactNode }) {
  const { m } = useI18n();
  const dismissed = useSyncExternalStore(subscribe, read, () => false);
  if (dismissed) return null;

  return (
    <div className="relative">
      {children}
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-3 right-4 md:right-8"
        onClick={() => {
          try {
            sessionStorage.setItem(KEY, "1");
          } catch {
            // Private windows may refuse storage; the prompt then simply stays.
          }
          listeners.forEach((listener) => listener());
        }}
      >
        {m.common.actions.later}
      </Button>
    </div>
  );
}
