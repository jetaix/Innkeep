"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

/**
 * In the public demo, stops a form from being sent and says why, so a visitor
 * who presses Save gets an answer instead of an error. Forms that only filter
 * a page (sent with GET) go through. The server refuses changes on its own;
 * this is only the polite version.
 */
export function DemoGuard() {
  const t = useI18n().m.demo;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const stop = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method === "get") return;
      event.preventDefault();
      event.stopPropagation();
      setShown((count) => count + 1);
    };
    document.addEventListener("submit", stop, true);
    return () => document.removeEventListener("submit", stop, true);
  }, []);

  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(() => setShown(0), 4000);
    return () => clearTimeout(timer);
  }, [shown]);

  return (
    <p
      role="status"
      className={
        shown
          ? "fixed inset-x-4 bottom-4 z-50 mx-auto w-fit max-w-full rounded-lg bg-ink px-4 py-3 text-[13px] font-medium text-inverse shadow-pop"
          : "sr-only"
      }
    >
      {shown ? t.refused : ""}
    </p>
  );
}
