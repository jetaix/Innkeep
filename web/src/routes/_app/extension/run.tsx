import * as stylex from "@stylexjs/stylex";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { extensionQuery, sessionQuery } from "../../../api/queries";
import { loadMessages, useI18n } from "../../../i18n";
import { color, text } from "../../../tokens.stylex";
import { buttonStyle } from "../../../ui/button";
import { Card, PageHeader } from "../../../ui/primitives";

/**
 * The page the browser extension watches for. When it sees this address it
 * takes the tab through the host's pages. If the extension is missing or too
 * old nothing happens, so the page says what to do instead.
 *
 * The extension reads the address only (`/extension/run?scope=…&key=…`), so
 * the route declares no search of its own: the router leaves the address as
 * `/extension/start` wrote it.
 */
export const Route = createFileRoute("/_app/extension/run")({
  beforeLoad: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData(sessionQuery);
    if (!session.signedIn) throw redirect({ to: "/overview" });
  },
  loader: ({ context: { queryClient } }) => {
    void loadMessages("extension");
    return queryClient.ensureQueryData(extensionQuery);
  },
  component: RunPage,
});

const styles = stylex.create({
  card: { maxWidth: "36rem", padding: "1.5rem" },
  starting: { margin: 0, fontSize: text.md, fontWeight: 500 },
  keep: { margin: "0.5rem 0 0", color: color.muted, fontSize: text.base, lineHeight: 1.625 },
  stuck: {
    marginTop: "1.25rem",
    paddingTop: "1rem",
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: color.line,
    color: color.muted,
    fontSize: text.base,
    lineHeight: 1.625,
  },
  stuckTitle: { margin: 0, color: color.ink, fontWeight: 500 },
  bullets: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "0.375rem 0 0",
    paddingInlineStart: "1.25rem",
    listStyleType: "disc",
  },
  buttons: { display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" },
});

function RunPage() {
  const t = useI18n("extension").m.extension.run;
  const { required } = useSuspenseQuery(extensionQuery).data;
  return (
    <>
      <PageHeader title={t.title} description={t.description} />
      <Card xstyle={styles.card}>
        <p role="status" {...stylex.props(styles.starting)}>
          {t.starting}
        </p>
        <p {...stylex.props(styles.keep)}>{t.keepOpen}</p>
        <div {...stylex.props(styles.stuck)}>
          <p {...stylex.props(styles.stuckTitle)}>{t.stuck.title}</p>
          <ul {...stylex.props(styles.bullets)}>
            <li>{t.stuck.reload(required)}</li>
            <li>{t.stuck.popup}</li>
          </ul>
          <div {...stylex.props(styles.buttons)}>
            <Link to="/extension" {...stylex.props(buttonStyle({ size: "sm" }))}>
              {t.stuck.guide}
            </Link>
            <Link to="/settings" search={{ tab: "data" }} {...stylex.props(buttonStyle({ size: "sm" }))}>
              {t.stuck.data}
            </Link>
          </div>
        </div>
      </Card>
    </>
  );
}
