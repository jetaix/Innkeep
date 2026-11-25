import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { Link, linkOptions } from "@tanstack/react-router";
import { X } from "lucide-react";
import type { Severity, Suggestion } from "@/features/insights/rules";
import { isISODate } from "@/lib/dates";
import { dismissSuggestion } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { color, text } from "../../tokens.stylex";
import { Button, buttonStyle } from "../../ui/button";
import { Badge, Notice } from "../../ui/primitives";

// Urgent is the violet of an overlap: the urgent rules are the double booking and its kin.
const TONE: Record<Severity, "clash" | "warn" | "neutral"> = {
  urgent: "clash",
  recommended: "warn",
  idea: "neutral",
};

const SEVERITIES: Severity[] = ["urgent", "recommended", "idea"];

const styles = stylex.create({
  list: { margin: 0, padding: 0, listStyle: "none" },
  item: {
    display: "flex",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  // Grouped: one heading per severity, most pressing first.
  group: {
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
  },
  groupHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    padding: "0.875rem 1rem 0.25rem",
    fontSize: text.sm,
    fontWeight: 500,
  },
  groupCount: { color: color.muted, fontWeight: 400, fontVariantNumeric: "tabular-nums" },
  urgent: { backgroundColor: `color-mix(in oklab, ${color.clashBg} 55%, transparent)` },
  quiet: { fontWeight: 400 },
  text: { flexGrow: 1, flexShrink: 1, flexBasis: "0%", minWidth: 0 },
  head: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" },
  title: { margin: 0, fontSize: text.md, fontWeight: 500, lineHeight: 1.4 },
  compactTitle: { fontSize: text.base },
  body: { margin: "0.375rem 0 0", maxWidth: "68ch", color: color.muted, lineHeight: 1.625 },
  action: { marginTop: "0.75rem" },
  compactAction: {
    display: "inline-block",
    marginTop: "0.25rem",
    color: { default: color.muted, ":hover": color.ink },
    fontSize: text.sm,
    textDecorationLine: "underline",
    textDecorationColor: color.lineStrong,
    textUnderlineOffset: 3,
  },
  form: { margin: 0 },
  failed: { margin: "1rem" },
});

/**
 * Where a suggestion's action leads. The rules name the screen that fixes the
 * problem as an address; this reads it back into a route and its parameters.
 */
function destination(href: string) {
  const url = new URL(href, window.location.origin);
  const property = url.pathname.match(/^\/properties\/(\d+)$/);
  if (property) return linkOptions({ to: "/properties/$id", params: { id: Number(property[1]) } });
  if (url.pathname === "/calendar") {
    const start = url.searchParams.get("start");
    const stay = Number(url.searchParams.get("r"));
    return linkOptions({
      to: "/calendar",
      search: {
        view: "weeks",
        start: isISODate(start) ? start : undefined,
        r: Number.isInteger(stay) && stay > 0 ? stay : undefined,
      },
    });
  }
  if (url.pathname === "/revenue") return linkOptions({ to: "/revenue" });
  if (url.pathname === "/reservations") return linkOptions({ to: "/reservations" });
  return linkOptions({ to: "/suggestions" });
}

export function SuggestionList({
  suggestions,
  compact = false,
}: {
  suggestions: Suggestion[];
  compact?: boolean;
}) {
  const t = useI18n("insights").m.insights;
  const dismiss = useMutation(dismissSuggestion);
  // In a group the heading names the severity; alone, each row carries its own badge.
  const Title = compact ? "h3" : "h4";
  const row = (suggestion: Suggestion) => (
    <li
      key={suggestion.key}
      {...stylex.props(styles.item, !compact && suggestion.severity === "urgent" && styles.urgent)}
    >
      <div {...stylex.props(styles.text)}>
        <div {...stylex.props(styles.head)}>
          {compact && <Badge tone={TONE[suggestion.severity]}>{t.severity[suggestion.severity]}</Badge>}
          <Title
            {...stylex.props(
              styles.title,
              compact && styles.compactTitle,
              !compact && suggestion.severity === "idea" && styles.quiet,
            )}
          >
            {suggestion.title}
          </Title>
        </div>
        {!compact && <p {...stylex.props(styles.body)}>{suggestion.body}</p>}
        <Link
          {...destination(suggestion.action.href)}
          {...stylex.props(
            compact
              ? styles.compactAction
              : [
                  buttonStyle({
                    size: "sm",
                    variant: suggestion.severity === "urgent" ? "primary" : "secondary",
                  }),
                  styles.action,
                ],
          )}
        >
          {suggestion.action.label}
        </Link>
      </div>
      {!compact && (
        <form
          {...stylex.props(styles.form)}
          onSubmit={(event) => {
            event.preventDefault();
            dismiss.mutate(suggestion.key);
          }}
        >
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            disabled={dismiss.isPending && dismiss.variables === suggestion.key}
            aria-label={t.list.dismissLabel(suggestion.title)}
            title={t.list.dismiss}
          >
            <X aria-hidden size={14} />
          </Button>
        </form>
      )}
    </li>
  );
  return (
    <>
      {dismiss.error && (
        <Notice tone="critical" role="alert" xstyle={styles.failed}>
          {dismiss.error.message}
        </Notice>
      )}
      {compact ? (
        <ul {...stylex.props(styles.list)}>{suggestions.map((suggestion) => row(suggestion))}</ul>
      ) : (
        SEVERITIES.map((severity) => {
          const group = suggestions.filter((suggestion) => suggestion.severity === severity);
          if (group.length === 0) return null;
          return (
            <section key={severity} aria-labelledby={`severity-${severity}`} {...stylex.props(styles.group)}>
              <h3 id={`severity-${severity}`} {...stylex.props(styles.groupHead)}>
                <Badge tone={TONE[severity]}>{t.severity[severity]}</Badge>
                <span {...stylex.props(styles.groupCount)}>{t.list.count(group.length)}</span>
              </h3>
              <ul {...stylex.props(styles.list)}>{group.map((suggestion) => row(suggestion))}</ul>
            </section>
          );
        })
      )}
    </>
  );
}
