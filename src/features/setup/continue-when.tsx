"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

export type SetupProgress = { extension: boolean; readAt: number };

/**
 * Lets a step of the guide go on by itself: asks Innkeep every few seconds
 * whether the extension has connected, or has read a reservations page since
 * this step was opened, and opens `href` when it has. What it shows is announced once.
 */
export function ContinueWhen({
  progress,
  want,
  href,
  children,
}: {
  progress: () => Promise<SetupProgress>;
  want: "extension" | "read";
  href: string;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    let asking = false;
    // The last read as Innkeep's own clock had it when this step opened.
    let readBefore: number | null = null;
    const timer = setInterval(async () => {
      if (asking || document.visibilityState !== "visible") return;
      asking = true;
      try {
        const now = await progress();
        const first = readBefore === null;
        readBefore ??= now.readAt;
        if (want === "extension" ? now.extension : !first && now.readAt > readBefore) router.replace(href);
      } finally {
        asking = false;
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [router, progress, want, href]);

  return (
    <div
      role="status"
      className="rounded-md border border-line bg-subtle px-3 py-2.5 text-[13px] leading-relaxed"
    >
      {children}
    </div>
  );
}
