import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { useI18n } from "../i18n";
import { color, text } from "../tokens.stylex";
import { buttonStyle } from "../ui/button";

const styles = stylex.create({
  box: { maxWidth: "28rem", marginInline: "auto", padding: "6rem 1.25rem", textAlign: "center" },
  title: { margin: 0, fontSize: text.lg, fontWeight: 600, letterSpacing: "-0.025em" },
  body: { margin: "0.5rem 0 1.25rem", color: color.muted },
});

/** Shown for an address that leads nowhere: a guide or a property that does not exist, a mistyped path. */
export function NotFound() {
  const t = useI18n().m.common.notFound;
  return (
    <main {...stylex.props(styles.box)}>
      <title>{`${t.title} · Innkeep`}</title>
      <h1 {...stylex.props(styles.title)}>{t.title}</h1>
      <p {...stylex.props(styles.body)}>{t.body}</p>
      <Link to="/" {...stylex.props(buttonStyle())}>
        {t.home}
      </Link>
    </main>
  );
}
