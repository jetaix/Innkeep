"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Card, Notice, SectionTitle } from "@/components/ui/primitives";
import { useI18n } from "@/i18n/client";
import { requestAdvice, type AdviceState } from "./actions";
import type { Advice } from "./ai";

const IMPACT_TONE = { high: "good", medium: "neutral", low: "neutral" } as const;

/** AI-written advice: the stored result, a button to (re)generate it, and its failure states. */
export function AdvicePanel({
  configured,
  advice,
  generatedLabel,
}: {
  configured: boolean;
  advice: Advice | null;
  generatedLabel: string | null;
}) {
  const { m } = useI18n();
  const t = m.insights.advice;
  const cta = m.assistant.cta;
  const [state, action, pending] = useActionState<AdviceState>(requestAdvice, { error: null });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <SectionTitle className="flex items-center gap-1.5">
            <Sparkles aria-hidden className="size-3.5" /> {t.title}
          </SectionTitle>
          <p className="mt-0.5 text-xs text-muted">{generatedLabel ?? t.source}</p>
        </div>
        {configured && (
          <form action={action}>
            <Button
              type="submit"
              variant={advice ? "secondary" : "primary"}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? t.thinking : advice ? t.refresh : t.get}
            </Button>
          </form>
        )}
      </div>

      <div aria-live="polite">
        {state.error && (
          <Notice tone="critical" role="alert" className="m-4">
            {state.error}
          </Notice>
        )}

        {!configured && (
          <p className="max-w-[70ch] px-4 py-4 leading-relaxed text-muted">
            {cta.before}
            <Link href="/assistant" className="font-medium text-ink underline underline-offset-2">
              {cta.link}
            </Link>
            {cta.after}
          </p>
        )}

        {advice && (
          <>
            <p className="max-w-[70ch] px-4 pt-4 leading-relaxed">{advice.summary}</p>
            <ol className="mt-3 divide-y divide-line border-t border-line">
              {advice.recommendations.map((item, index) => (
                <li key={index} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">{item.title}</h3>
                    <Badge tone={IMPACT_TONE[item.impact]}>{t.impact[item.impact]}</Badge>
                    <span className="text-xs text-muted">{item.property}</span>
                  </div>
                  <p className="mt-1.5 max-w-[70ch] leading-relaxed text-muted">{item.why}</p>
                  <ul className="mt-2 max-w-[70ch] list-disc space-y-1 pl-5 leading-relaxed">
                    {item.steps.map((step, stepIndex) => (
                      <li key={stepIndex}>{step}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {configured && <p className="border-t border-line px-4 py-2.5 text-xs text-muted">{t.privacy}</p>}
    </Card>
  );
}
