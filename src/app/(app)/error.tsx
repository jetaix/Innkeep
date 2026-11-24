"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

const never = () => () => {};

/**
 * Shown when a page of the dashboard fails. In the public demo the usual
 * cause is a visitor trying to change something, which the server refuses.
 */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useI18n().m.demo.error;
  const demo = useSyncExternalStore(
    never,
    () => document.querySelector("[data-demo]") != null,
    () => false,
  );
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-lg font-semibold tracking-tight">{demo ? t.demoTitle : t.title}</h1>
      <p className="mt-2 text-muted">{demo ? t.demoBody : t.body}</p>
      <Button className="mt-5" onClick={reset}>
        {t.retry}
      </Button>
    </div>
  );
}
