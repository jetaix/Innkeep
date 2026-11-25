import * as stylex from "@stylexjs/stylex";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { connectClaude, disconnectClaude } from "../../api/mutations";
import { adviceQuery } from "../../api/queries";
import { useI18n } from "../../i18n";
import { color, font, radius, text } from "../../tokens.stylex";
import { ConfirmButton, SubmitButton } from "../../ui/actions";
import { buttonStyle } from "../../ui/button";
import { Field, Input } from "../../ui/form";
import { Badge, Card, Hidden, Notice, SectionTitle } from "../../ui/primitives";

const CONSOLE_KEYS = "https://console.anthropic.com/settings/keys";

const styles = stylex.create({
  section: { display: "flex", flexDirection: "column", gap: "1.5rem" },
  status: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "1.25rem",
  },
  statusText: { minWidth: 0 },
  name: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "0.5rem",
    margin: 0,
    fontWeight: 500,
  },
  where: { margin: "0.25rem 0 0", color: color.muted, fontSize: text.base },
  stepsHead: {
    padding: "0.75rem 1.25rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: color.line,
  },
  subtitle: { margin: "0.125rem 0 0", color: color.muted, fontSize: text.sm },
  steps: { margin: 0, padding: 0, listStyle: "none", counterReset: "step" },
  step: {
    display: "flex",
    gap: "0.75rem",
    padding: "1rem 1.25rem",
    borderTopWidth: { default: 1, ":first-child": 0 },
    borderTopStyle: "solid",
    borderTopColor: color.line,
    counterIncrement: "step",
  },
  number: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "1.25rem",
    height: "1.25rem",
    borderRadius: radius.full,
    backgroundColor: color.sunken,
    fontSize: text.xs,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
    "::before": { content: "counter(step)" },
  },
  numberDone: { backgroundColor: `color-mix(in oklab, ${color.good} 10%, transparent)`, color: color.good },
  stepText: { flexGrow: 1, flexShrink: 1, flexBasis: "0%", minWidth: 0 },
  stepTitle: { margin: 0, fontSize: text.base, fontWeight: 500 },
  stepBody: { marginTop: "0.25rem", color: color.muted, fontSize: text.base, lineHeight: 1.625 },
  console: { display: "block", marginTop: "0.5rem" },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "0.75rem",
    marginTop: "0.75rem",
  },
  field: { alignSelf: "stretch" },
  key: { fontFamily: font.mono, fontSize: { default: text.field, "@media (min-width: 48rem)": text.sm } },
  pad: { padding: "1.25rem" },
  intro: { margin: "0.5rem 0 0", color: color.muted, fontSize: text.base },
  sent: {
    margin: "0.5rem 0 0",
    paddingInlineStart: "1.25rem",
    listStyleType: "disc",
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  sentLine: { marginTop: { default: "0.25rem", ":first-child": 0 } },
  line: { margin: "0.75rem 0 0", fontSize: text.base, lineHeight: 1.625 },
  close: { marginTop: "0.25rem" },
  muted: { color: color.muted },
  strong: { color: color.ink, fontWeight: 500 },
  small: { fontSize: text.sm },
  link: { color: color.ink, textDecoration: "underline", textUnderlineOffset: 2 },
  other: { margin: "0.5rem 0 0", color: color.muted, fontSize: text.base, lineHeight: 1.625 },
});

function Step({ title, done, children }: { title: string; done?: boolean; children: ReactNode }) {
  return (
    <li {...stylex.props(styles.step)}>
      <span aria-hidden {...stylex.props(styles.number, done && styles.numberDone)} />
      <div {...stylex.props(styles.stepText)}>
        <h3 {...stylex.props(styles.stepTitle)}>{title}</h3>
        <div {...stylex.props(styles.stepBody)}>{children}</div>
      </div>
    </li>
  );
}

/** Paste a key, test it with Anthropic, keep it if it works. */
function ConnectForm() {
  const { m, locale } = useI18n("assistant");
  const t = m.assistant.connect;
  const connect = useMutation(connectClaude);
  // A key Anthropic turns down comes back as an answer; anything else is the request failing.
  const error = connect.error?.message ?? connect.data?.error;

  return (
    <form
      {...stylex.props(styles.form)}
      onSubmit={(event) => {
        event.preventDefault();
        connect.mutate({ apiKey: String(new FormData(event.currentTarget).get("apiKey") ?? ""), locale });
      }}
    >
      <Field label={t.label} htmlFor="apiKey" hint={t.hint} xstyle={styles.field}>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          xstyle={styles.key}
          aria-describedby={error ? "apiKey-error" : undefined}
        />
      </Field>
      {error && (
        <Notice tone="critical" role="alert" id="apiKey-error">
          {error}
        </Notice>
      )}
      <SubmitButton variant="primary" pending={connect.isPending} pendingLabel={t.testing}>
        {t.submit}
      </SubmitButton>
    </form>
  );
}

/**
 * Connecting Claude for the written advice: whether it is connected, the
 * steps to connect it, and exactly what is sent. A section of the
 * Suggestions page.
 */
export function ClaudeSection() {
  const { m } = useI18n("assistant");
  const t = m.assistant;
  const { configured: connected, claude } = useSuspenseQuery(adviceQuery).data;
  const { key, model, realStays, freePrices } = claude;
  const disconnect = useMutation(disconnectClaude);

  return (
    <div {...stylex.props(styles.section)}>
      <Card xstyle={styles.status}>
        <div {...stylex.props(styles.statusText)}>
          <p {...stylex.props(styles.name)}>
            Claude
            <Badge tone={connected ? "good" : "neutral"}>
              {connected ? t.status.connected : t.status.notConnected}
            </Badge>
          </p>
          {connected && (
            <p {...stylex.props(styles.where)}>
              {key.source === "saved"
                ? t.status.saved(key.ending, model)
                : key.source === "environment"
                  ? `${t.status.environment(key.ending, model)} ${t.status.environmentNote}`
                  : t.status.token(model)}
            </p>
          )}
          {disconnect.error && (
            <Notice tone="critical" role="alert" xstyle={styles.line}>
              {disconnect.error.message}
            </Notice>
          )}
        </div>
        {key.source === "saved" && (
          <ConfirmButton
            size="sm"
            message={t.status.disconnectConfirm}
            pending={disconnect.isPending}
            onConfirm={() => disconnect.mutate()}
          >
            {t.status.disconnect}
          </ConfirmButton>
        )}
      </Card>

      {key.source !== "environment" && (
        <Card>
          <div {...stylex.props(styles.stepsHead)}>
            <SectionTitle>{t.steps.title}</SectionTitle>
            <p {...stylex.props(styles.subtitle)}>{t.steps.subtitle}</p>
          </div>
          <ol {...stylex.props(styles.steps)}>
            <Step title={t.steps.account.title} done={connected}>
              {t.steps.account.body}
              <span {...stylex.props(styles.console)}>
                <a
                  href={CONSOLE_KEYS}
                  target="_blank"
                  rel="noreferrer"
                  {...stylex.props(buttonStyle({ size: "sm" }))}
                >
                  {t.steps.account.link}
                  <ExternalLink aria-hidden size={14} />
                  <Hidden>{m.common.actions.newTab}</Hidden>
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

      <Card xstyle={styles.pad}>
        <SectionTitle>{t.data.title}</SectionTitle>
        <p {...stylex.props(styles.intro)}>{t.data.intro}</p>
        <ul {...stylex.props(styles.sent)}>
          {t.data.sent.map((line) => (
            <li key={line} {...stylex.props(styles.sentLine)}>
              {line}
            </li>
          ))}
        </ul>
        <p {...stylex.props(styles.line, styles.muted)}>
          <strong {...stylex.props(styles.strong)}>{t.data.neverTitle}</strong> {t.data.never}
        </p>
        <p {...stylex.props(styles.line)}>{t.data.counts(realStays, freePrices)}</p>
        {(realStays < 3 || freePrices === 0) && (
          <p {...stylex.props(styles.line, styles.muted, styles.close)}>{t.data.thin}</p>
        )}
        <p {...stylex.props(styles.line, styles.muted, styles.small)}>{t.data.market}</p>
        <p {...stylex.props(styles.line, styles.muted, styles.small, styles.close)}>{t.data.cost}</p>
      </Card>

      <Card xstyle={styles.pad}>
        <SectionTitle>{t.other.title}</SectionTitle>
        <p {...stylex.props(styles.other)}>
          {t.other.body}{" "}
          <Link to="/settings" search={{ tab: "assistant" }} {...stylex.props(styles.link)}>
            {t.other.link}
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}
