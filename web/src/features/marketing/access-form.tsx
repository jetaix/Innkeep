import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { useId } from "react";
import { requestAccess } from "../../api/mutations";
import { Panel } from "../../brand/glass";
import { pillStyle } from "../../brand/pill";
import { useI18n } from "../../i18n";
import { color, shadow } from "../../tokens.stylex";
import { kit } from "./landing-kit";

// StyleX reads a media query only from the file that uses it.
const SM = "@media (min-width: 40rem)";

const styles = stylex.create({
  measure: { maxWidth: "28rem", marginInline: "auto" },
  sent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "3.5rem",
    marginBlock: 0,
    paddingInline: "1.5rem",
    borderRadius: "999px",
    fontSize: "0.9375rem",
    fontWeight: 500,
  },
  form: { marginBlock: 0 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.375rem",
    borderRadius: "999px",
    boxShadow: { default: shadow.panel, ":focus-within": `0 0 0 2px ${color.overlap}, ${shadow.panel}` },
  },
  // Present for a screen reader, absent from the picture.
  label: {
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    minWidth: 0,
    height: "2.75rem",
    margin: 0,
    paddingBlock: 0,
    paddingInline: "1rem",
    borderWidth: 0,
    borderRadius: "999px",
    backgroundColor: "transparent",
    color: { default: "inherit", "::placeholder": color.faint },
    fontFamily: "inherit",
    fontSize: "1rem",
    // The row around it shows the focus.
    outlineStyle: "none",
  },
  trap: { display: "none" },
  submit: {
    height: "2.75rem",
    paddingInline: { default: "0.875rem", [SM]: "1.25rem" },
    fontSize: { default: "0.8125rem", [SM]: "0.9375rem" },
    opacity: { default: 1, ":disabled": 0.6 },
  },
  note: { margin: "0.75rem 0 0", color: color.muted, fontSize: "0.8125rem", textAlign: "center" },
  problem: { color: color.overlap, fontWeight: 500 },
});

/** The one thing the hosted page asks for: an email address, to be told when early access opens. */
export function AccessForm({ xstyle }: { xstyle?: stylex.StyleXStyles }) {
  const { m, locale } = useI18n("marketing");
  const t = m.marketing.access;
  const request = useMutation(requestAccess);
  const id = useId();
  // The server answers a refused address in words; a request that never arrived has none.
  const problem = request.isError ? t.failed : request.data?.status === "error" ? request.data.message : null;

  if (request.data?.status === "sent") {
    return (
      <p role="status" {...stylex.props(kit.panel, styles.measure, styles.sent, xstyle)}>
        {request.data.message}
      </p>
    );
  }

  return (
    <form
      {...stylex.props(styles.measure, styles.form, xstyle)}
      onSubmit={(event) => {
        event.preventDefault();
        const sent = new FormData(event.currentTarget);
        request.mutate({
          email: String(sent.get("email") ?? ""),
          company: String(sent.get("company") ?? ""),
          locale,
        });
      }}
    >
      <Panel xstyle={styles.row}>
        <label htmlFor={id} {...stylex.props(styles.label)}>
          {t.label}
        </label>
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder={t.placeholder}
          aria-describedby={`${id}-note`}
          aria-invalid={problem !== null}
          {...stylex.props(styles.input)}
        />
        {/* Hidden from people; a script that fills it is turned away. */}
        <input name="company" tabIndex={-1} autoComplete="off" aria-hidden {...stylex.props(styles.trap)} />
        <button
          type="submit"
          disabled={request.isPending}
          aria-busy={request.isPending}
          {...stylex.props(pillStyle("primary"), styles.submit)}
        >
          {request.isPending ? t.pending : t.submit}
        </button>
      </Panel>
      <p
        id={`${id}-note`}
        role={problem !== null ? "alert" : undefined}
        {...stylex.props(styles.note, problem !== null && styles.problem)}
      >
        {problem ?? t.note}
      </p>
    </form>
  );
}
