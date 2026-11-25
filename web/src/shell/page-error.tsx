import * as stylex from "@stylexjs/stylex";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { ApiError } from "../api/client";
import { useI18n } from "../i18n";
import { LogoMark } from "../brand/logo";
import { color, font, text } from "../tokens.stylex";
import { Button } from "../ui/button";

const styles = stylex.create({
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "30rem",
    marginInline: "auto",
    paddingBlock: "5rem",
    textAlign: "center",
  },
  mark: { width: "2.25rem", height: "2.25rem" },
  title: {
    margin: "1.125rem 0 0",
    fontFamily: font.display,
    fontSize: text.title,
    fontWeight: 400,
    letterSpacing: "-0.025em",
    lineHeight: 1.15,
    textWrap: "balance",
  },
  body: {
    margin: "0.625rem 0 1.5rem",
    color: color.muted,
    fontSize: text.md,
    lineHeight: 1.6,
    textWrap: "pretty",
  },
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
      <LogoMark tone="color" xstyle={styles.mark} />
      <h1 {...stylex.props(styles.title)}>{refused ? t.demoTitle : t.title}</h1>
      <p {...stylex.props(styles.body)}>{refused ? t.demoBody : t.body}</p>
      <Button
        variant="primary"
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
