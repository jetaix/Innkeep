import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { restoreSuggestions } from "../../api/mutations";
import { adviceQuery, suggestionsQuery } from "../../api/queries";
import { AdvicePanel } from "../../features/insights/advice-panel";
import { ClaudeSection } from "../../features/insights/claude-section";
import { SuggestionList } from "../../features/insights/suggestion-list";
import { currentLocale, loadMessages, useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { SubmitButton } from "../../ui/actions";
import { Card, Loading, Notice, PageHeader, SectionTitle } from "../../ui/primitives";

export const Route = createFileRoute("/_app/suggestions")({
  // Started while this route's code downloads; the components read the same queries.
  loader: ({ context: { queryClient } }) => {
    void loadMessages("insights", "assistant");
    return Promise.all([
      queryClient.ensureQueryData(suggestionsQuery(currentLocale())),
      queryClient.ensureQueryData(adviceQuery),
    ]);
  },
  component: SuggestionsPage,
});

const styles = stylex.create({
  page: { display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "48rem" },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  form: { margin: 0 },
  failed: { margin: "1rem" },
  clear: { margin: 0, padding: "1.5rem 1rem", color: color.muted },
  claude: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    paddingTop: "1rem",
    scrollMarginTop: "1.5rem",
  },
  claudeHead: { paddingInline: "0.25rem" },
  claudeTitle: { margin: 0, fontSize: text.base, fontWeight: 600 },
  claudeAbout: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.base },
});

function SuggestionsPage() {
  const t = useI18n("insights").m.insights;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Suspense fallback={<Loading />}>
        <Suggestions />
      </Suspense>
    </>
  );
}

function Suggestions() {
  const { locale, m, fmt } = useI18n("insights", "assistant");
  const t = m.insights;
  const { active, dismissed } = useSuspenseQuery(suggestionsQuery(locale)).data;
  const { advice: stored, configured } = useSuspenseQuery(adviceQuery).data;
  const restore = useMutation(restoreSuggestions);

  return (
    <div {...stylex.props(styles.page)}>
      <Card>
        <div {...stylex.props(styles.head)}>
          <SectionTitle>{active.length === 0 ? t.list.nothing : t.list.count(active.length)}</SectionTitle>
          {dismissed > 0 && (
            <form
              {...stylex.props(styles.form)}
              onSubmit={(event) => {
                event.preventDefault();
                restore.mutate();
              }}
            >
              <SubmitButton variant="ghost" size="sm" pending={restore.isPending}>
                {t.list.restore(dismissed)}
              </SubmitButton>
            </form>
          )}
        </div>
        {restore.error && (
          <Notice tone="critical" role="alert" xstyle={styles.failed}>
            {restore.error.message}
          </Notice>
        )}
        {active.length > 0 ? (
          <SuggestionList suggestions={active} />
        ) : (
          <p {...stylex.props(styles.clear)}>{t.list.allClear}</p>
        )}
      </Card>

      <AdvicePanel
        configured={configured}
        advice={stored?.advice ?? null}
        generatedLabel={stored ? t.advice.generated(fmt.dateTime(stored.generatedAt), stored.model) : null}
      />

      {/* The advice above is Claude's, set up here. */}
      <section id="claude" aria-labelledby="claude-heading" {...stylex.props(styles.claude)}>
        <div {...stylex.props(styles.claudeHead)}>
          <h2 id="claude-heading" {...stylex.props(styles.claudeTitle)}>
            {m.assistant.title}
          </h2>
          <p {...stylex.props(styles.claudeAbout)}>{m.assistant.description}</p>
        </div>
        <ClaudeSection />
      </section>
    </div>
  );
}
