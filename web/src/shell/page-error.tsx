import * as stylex from "@stylexjs/stylex";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { ApiError } from "../api/client";
import { useI18n } from "../i18n";
import { color, text } from "../tokens.stylex";
import { Button } from "../ui/button";

const styles = stylex.create({
  box: { maxWidth: "28rem", marginInline: "auto", paddingBlock: "4rem", textAlign: "center" },
  title: { margin: 0, fontSize: text.lg, fontWeight: 600, letterSpacing: "-0.025em" },
  body: { margin: "0.5rem 0 1.25rem", color: color.muted },
});

/**
 * Shown in place of a page that failed, inside the frame, so the menu still
 * works. In the public demo the usual cause is a page that is the host's
 * alone, which the server refuses to a visitor.
 */
export function PageError({ error, reset }: ErrorComponentProps) {
  const t = useI18n().m.demo.error;
  const queries = useQueryErrorResetBoundary();
  const refused = error instanceof ApiError && error.status === 403;
  return (
    <div role="alert" {...stylex.props(styles.box)}>
      <h1 {...stylex.props(styles.title)}>{refused ? t.demoTitle : t.title}</h1>
      <p {...stylex.props(styles.body)}>{refused ? t.demoBody : t.body}</p>
      <Button
        onClick={() => {
          // Forget the failed answers, so trying again asks the server again.
          queries.reset();
          reset();
        }}
      >
        {t.retry}
      </Button>
    </div>
  );
}
