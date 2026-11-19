import Link from "next/link";
import { X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { getI18n } from "@/i18n/server";
import { dismissSuggestion } from "./actions";
import type { Severity, Suggestion } from "./rules";

const TONE: Record<Severity, "critical" | "warn" | "neutral"> = {
  urgent: "critical",
  recommended: "warn",
  idea: "neutral",
};

export async function SuggestionList({
  suggestions,
  compact = false,
}: {
  suggestions: Suggestion[];
  compact?: boolean;
}) {
  const t = (await getI18n()).m.insights;
  return (
    <ul className="divide-y divide-line">
      {suggestions.map((suggestion) => (
        <li key={suggestion.key} className="flex gap-3 px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={TONE[suggestion.severity]}>{t.severity[suggestion.severity]}</Badge>
              <h3 className="font-medium">{suggestion.title}</h3>
            </div>
            {!compact && <p className="mt-1.5 max-w-[70ch] leading-relaxed text-muted">{suggestion.body}</p>}
            <Link
              href={suggestion.action.href}
              className={
                compact
                  ? "mt-1 inline-block text-xs text-muted underline underline-offset-2 hover:text-ink"
                  : buttonClass({ size: "sm" }, "mt-3")
              }
            >
              {suggestion.action.label}
            </Link>
          </div>
          {!compact && (
            <form action={dismissSuggestion.bind(null, suggestion.key)}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                aria-label={t.list.dismissLabel(suggestion.title)}
                title={t.list.dismiss}
              >
                <X aria-hidden />
              </Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
