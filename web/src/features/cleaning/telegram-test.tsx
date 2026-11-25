import * as stylex from "@stylexjs/stylex";
import { useMutation } from "@tanstack/react-query";
import { sendTelegramTest } from "../../api/mutations";
import { useI18n } from "../../i18n";
import { Button } from "../../ui/button";
import { Notice } from "../../ui/primitives";

const styles = stylex.create({
  form: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" },
  whole: { width: "100%" },
});

/** Sends a message to the host's Telegram and says whether it went through. */
export function TelegramTest() {
  const t = useI18n("cleaning").m.cleaning.telegram;
  const test = useMutation(sendTelegramTest);
  // Telegram's refusal comes back as an answer; anything else that went wrong is the request's own error.
  const error = test.data?.error ?? test.error?.message;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        test.mutate();
      }}
      {...stylex.props(styles.form)}
    >
      <Button type="submit" size="sm" disabled={test.isPending} aria-busy={test.isPending}>
        {test.isPending ? t.testSending : t.testButton}
      </Button>
      <span aria-live="polite">{!test.isPending && test.data?.sent && t.testSent}</span>
      {!test.isPending && error && (
        <Notice tone="critical" role="alert" xstyle={styles.whole}>
          {t.testFailed(error)}
        </Notice>
      )}
    </form>
  );
}
