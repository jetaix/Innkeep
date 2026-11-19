import Link from "next/link";
import { Puzzle } from "lucide-react";
import { connection } from "next/server";
import { getI18n } from "@/i18n/server";
import { getExtensionStatus } from "./status";

/**
 * Stays in the corner of every page until the browser extension is installed
 * and current: without it Innkeep only knows dates, not guests or payouts.
 */
export async function ExtensionSetupButton() {
  await connection();
  const { state } = getExtensionStatus();
  if (state === "ready") return null;
  const t = (await getI18n()).m.extension.button;

  return (
    <Link
      href="/extension"
      className="fixed right-4 bottom-4 z-40 flex h-10 items-center gap-2 rounded-full bg-ink pr-4 pl-3.5 text-[13px] font-medium text-inverse shadow-pop transition-opacity hover:opacity-90"
    >
      <Puzzle aria-hidden className="size-4" strokeWidth={1.75} />
      {state === "outdated" ? t.update : t.add}
    </Link>
  );
}
