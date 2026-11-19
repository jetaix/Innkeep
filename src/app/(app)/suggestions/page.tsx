import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SubmitButton } from "@/components/ui/actions";
import { Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { Loading } from "@/components/ui/loading";
import { restoreSuggestions } from "@/features/insights/actions";
import { AdvicePanel } from "@/features/insights/advice-panel";
import { aiConfigured } from "@/features/insights/ai";
import { getAdvice, getSuggestions } from "@/features/insights/queries";
import { SuggestionList } from "@/features/insights/suggestion-list";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getI18n()).m.insights.title };
}

export default async function SuggestionsPage() {
  const t = (await getI18n()).m.insights;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Suggestions />
      </Suspense>
    </>
  );
}

async function Suggestions() {
  await connection();
  const { locale, m, fmt } = await getI18n();
  const t = m.insights;
  const { active, dismissed } = getSuggestions(locale);
  const stored = getAdvice();

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SectionTitle>{active.length === 0 ? t.list.nothing : t.list.count(active.length)}</SectionTitle>
          {dismissed > 0 && (
            <form action={restoreSuggestions}>
              <SubmitButton variant="ghost" size="sm">
                {t.list.restore(dismissed)}
              </SubmitButton>
            </form>
          )}
        </div>
        {active.length > 0 ? (
          <SuggestionList suggestions={active} />
        ) : (
          <p className="px-4 py-6 text-muted">{t.list.allClear}</p>
        )}
      </Card>

      <AdvicePanel
        configured={aiConfigured()}
        advice={stored?.advice ?? null}
        generatedLabel={stored ? t.advice.generated(fmt.dateTime(stored.generatedAt), stored.model) : null}
      />
    </div>
  );
}
