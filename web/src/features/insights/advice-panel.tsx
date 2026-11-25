import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import type { Advice } from "@/features/insights/ai";
import { requestAdvice } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { Button } from "../../ui/button";
import { Badge, Card, Notice, SectionTitle } from "../../ui/primitives";

const IMPACT_TONE = { high: "good", medium: "neutral", low: "neutral" } as const;

const styles = stylex.create({
  head: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "0.75rem 1rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  title: { display: "flex", alignItems: "center", gap: "0.375rem" },
  source: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  form: { margin: 0 },
  failed: { margin: "1rem" },
  setup: { margin: 0, maxWidth: "70ch", padding: "1rem", color: color.muted, lineHeight: 1.625 },
  link: { color: color.ink, fontWeight: 500, textDecoration: "underline", textUnderlineOffset: 2 },
  summary: { margin: 0, maxWidth: "70ch", padding: "1rem 1rem 0", lineHeight: 1.625 },
  list: {
    margin: "0.75rem 0 0",
    padding: 0,
    listStyle: "none",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  item: {
    padding: "0.875rem 1rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  itemHead: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  itemTitle: { margin: 0, fontSize: text.base, fontWeight: 500 },
  property: { color: color.muted, fontSize: text.sm },
  why: { margin: "0.375rem 0 0", maxWidth: "70ch", color: color.muted, lineHeight: 1.625 },
  steps: {
    margin: "0.5rem 0 0",
    maxWidth: "70ch",
    paddingInlineStart: "1.25rem",
    listStyleType: "disc",
    lineHeight: 1.625,
  },
  step: { marginTop: { default: "0.25rem", ":first-child": 0 } },
  privacy: {
    margin: 0,
    padding: "0.625rem 1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: text.sm,
  },
});

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
  const { m, locale } = useI18n("insights", "assistant");
  const t = m.insights.advice;
  const cta = m.assistant.cta;
  const ask = useMutation(requestAdvice);
  // The model's own refusals come back as an answer; anything else is the request failing.
  const error = ask.error?.message ?? ask.data?.error;

  return (
    <Card>
      <div {...stylex.props(styles.head)}>
        <div>
          <SectionTitle xstyle={styles.title}>
            <Sparkles aria-hidden size={14} /> {t.title}
          </SectionTitle>
          <p {...stylex.props(styles.source)}>{generatedLabel ?? t.source}</p>
        </div>
        {configured && (
          <form
            {...stylex.props(styles.form)}
            onSubmit={(event) => {
              event.preventDefault();
              ask.mutate(locale);
            }}
          >
            <Button
              type="submit"
              variant={advice ? "secondary" : "primary"}
              disabled={ask.isPending}
              aria-busy={ask.isPending}
            >
              {ask.isPending ? t.thinking : advice ? t.refresh : t.get}
            </Button>
          </form>
        )}
      </div>

      <div aria-live="polite">
        {error && (
          <Notice tone="critical" role="alert" xstyle={styles.failed}>
            {error}
          </Notice>
        )}

        {!configured && (
          <p {...stylex.props(styles.setup)}>
            {cta.before}
            <Link to="/suggestions" hash="claude" {...stylex.props(styles.link)}>
              {cta.link}
            </Link>
            {cta.after}
          </p>
        )}

        {advice && (
          <>
            <p {...stylex.props(styles.summary)}>{advice.summary}</p>
            <ol {...stylex.props(styles.list)}>
              {advice.recommendations.map((item, index) => (
                <li key={index} {...stylex.props(styles.item)}>
                  <div {...stylex.props(styles.itemHead)}>
                    <h3 {...stylex.props(styles.itemTitle)}>{item.title}</h3>
                    <Badge tone={IMPACT_TONE[item.impact]}>{t.impact[item.impact]}</Badge>
                    <span {...stylex.props(styles.property)}>{item.property}</span>
                  </div>
                  <p {...stylex.props(styles.why)}>{item.why}</p>
                  <ul {...stylex.props(styles.steps)}>
                    {item.steps.map((step, stepIndex) => (
                      <li key={stepIndex} {...stylex.props(styles.step)}>
                        {step}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>

      {configured && <p {...stylex.props(styles.privacy)}>{t.privacy}</p>}
    </Card>
  );
}
