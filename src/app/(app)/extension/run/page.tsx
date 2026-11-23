import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/primitives";
import { REQUIRED_EXTENSION } from "@/features/extension/status";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.extension.run.title };
}

/**
 * The page the browser extension watches for. When it sees this address it
 * takes the tab through the host's pages. If the extension is missing or too
 * old nothing happens, so the page says what to do instead.
 */
export default async function RunPage() {
  const t = (await getI18n()).m.extension.run;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Card className="max-w-xl p-6">
        <p role="status" className="font-medium">
          {t.starting}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{t.keepOpen}</p>
        <div className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
          <p className="font-medium text-ink">{t.stuck.title}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>{t.stuck.reload(REQUIRED_EXTENSION)}</li>
            <li>{t.stuck.popup}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/extension" className={buttonClass({ size: "sm" })}>
              {t.stuck.guide}
            </Link>
            <Link href="/settings#data" className={buttonClass({ size: "sm" })}>
              {t.stuck.data}
            </Link>
          </div>
        </div>
      </Card>
    </>
  );
}
