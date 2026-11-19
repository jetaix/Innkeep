import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { connection } from "next/server";
import { ConfirmButton } from "@/components/ui/actions";
import { buttonClass } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { getDb, nightlyPrices, reservations } from "@/db";
import { disconnectClaude } from "@/features/assistant/actions";
import { ConnectForm } from "@/features/assistant/connect-form";
import { getKeyStatus } from "@/features/assistant/key";
import { AdvicePanel } from "@/features/insights/advice-panel";
import { AI_MODEL, aiConfigured } from "@/features/insights/ai";
import { getAdvice } from "@/features/insights/queries";
import { getI18n } from "@/i18n/server";
import { today } from "@/lib/dates";

const CONSOLE_KEYS = "https://console.anthropic.com/settings/keys";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.assistant.title };
}

export default async function AssistantPage() {
  const t = (await getI18n()).m.assistant;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Assistant />
      </Suspense>
    </>
  );
}

function Step({ title, done, children }: { title: string; done?: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-3 px-5 py-4 [counter-increment:step]">
      <span
        aria-hidden
        className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums before:content-[counter(step)] ${
          done ? "bg-good/10 text-good" : "bg-sunken"
        }`}
      />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{title}</h3>
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      </div>
    </li>
  );
}

async function Assistant() {
  await connection();
  const { m, fmt } = await getI18n();
  const t = m.assistant;
  const key = getKeyStatus();
  const connected = aiConfigured();
  const stored = getAdvice();

  // How much real data the model would get today, so thin advice is no surprise.
  const db = getDb();
  const now = today();
  const realStays =
    db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.kind, "reservation"),
          eq(reservations.status, "confirmed"),
          lte(reservations.checkOut, now),
          gte(reservations.amount, 1),
        ),
      )
      .get()?.total ?? 0;
  const freePrices =
    db.select({ total: count() }).from(nightlyPrices).where(gte(nightlyPrices.date, now)).get()?.total ?? 0;

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            Claude
            <Badge tone={connected ? "good" : "neutral"}>
              {connected ? t.status.connected : t.status.notConnected}
            </Badge>
          </p>
          {connected && (
            <p className="mt-1 text-[13px] text-muted">
              {key.source === "saved"
                ? t.status.saved(key.ending, AI_MODEL)
                : key.source === "environment"
                  ? `${t.status.environment(key.ending, AI_MODEL)} ${t.status.environmentNote}`
                  : t.status.token(AI_MODEL)}
            </p>
          )}
        </div>
        {key.source === "saved" && (
          <form action={disconnectClaude}>
            <ConfirmButton size="sm" message={t.status.disconnectConfirm}>
              {t.status.disconnect}
            </ConfirmButton>
          </form>
        )}
      </Card>

      {key.source !== "environment" && (
        <Card>
          <div className="border-b border-line px-5 py-3">
            <SectionTitle>{t.steps.title}</SectionTitle>
            <p className="mt-0.5 text-xs text-muted">{t.steps.subtitle}</p>
          </div>
          <ol className="divide-y divide-line [counter-reset:step]">
            <Step title={t.steps.account.title} done={connected}>
              {t.steps.account.body}
              <span className="mt-2 block">
                <a
                  href={CONSOLE_KEYS}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass({ size: "sm" })}
                >
                  {t.steps.account.link}
                  <ExternalLink aria-hidden />
                  <span className="sr-only">{m.common.actions.newTab}</span>
                </a>
              </span>
            </Step>
            <Step title={t.steps.paste.title} done={connected}>
              {connected ? t.steps.paste.done : t.steps.paste.body}
              {!connected && <ConnectForm />}
            </Step>
            <Step title={t.steps.ask.title}>{connected ? t.steps.ask.body : t.steps.ask.waiting}</Step>
          </ol>
        </Card>
      )}

      {connected && (
        <AdvicePanel
          configured
          advice={stored?.advice ?? null}
          generatedLabel={
            stored ? m.insights.advice.generated(fmt.dateTime(stored.generatedAt), stored.model) : null
          }
        />
      )}

      <Card className="p-5">
        <SectionTitle>{t.data.title}</SectionTitle>
        <p className="mt-2 text-[13px] text-muted">{t.data.intro}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-muted">
          {t.data.sent.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          <strong className="font-medium text-ink">{t.data.neverTitle}</strong> {t.data.never}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed">{t.data.counts(realStays, freePrices)}</p>
        {(realStays < 3 || freePrices === 0) && (
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{t.data.thin}</p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-muted">{t.data.market}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{t.data.cost}</p>
      </Card>

      <Card className="p-5">
        <SectionTitle>{t.other.title}</SectionTitle>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {t.other.body}{" "}
          <Link href="/settings" className="text-ink underline underline-offset-2">
            {t.other.link}
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
