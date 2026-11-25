import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { LogoMark } from "../brand/logo";
import { useI18n } from "../i18n";
import { color, font, text } from "../tokens.stylex";
import { buttonStyle } from "../ui/button";

const styles = stylex.create({
  box: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "30rem",
    marginInline: "auto",
    padding: "7rem 1.25rem",
    textAlign: "center",
  },
  mark: { width: "2.5rem", height: "2.5rem" },
  title: {
    margin: "1.25rem 0 0",
    fontFamily: font.display,
    fontSize: "2.25rem",
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    textWrap: "balance",
  },
  body: {
    margin: "0.75rem 0 1.75rem",
    color: color.muted,
    fontSize: text.md,
    lineHeight: 1.6,
    textWrap: "pretty",
  },
});

/** Shown for an address that leads nowhere: a guide or a property that does not exist, a mistyped path. */
export function NotFound() {
  const t = useI18n().m.common.notFound;
  return (
    <main {...stylex.props(styles.box)}>
      <title>{`${t.title} · Innkeep`}</title>
      <LogoMark tone="color" xstyle={styles.mark} />
      <h1 {...stylex.props(styles.title)}>{t.title}</h1>
      <p {...stylex.props(styles.body)}>{t.body}</p>
      <Link to="/" {...stylex.props(buttonStyle({ variant: "primary", size: "lg" }))}>
        {t.home}
      </Link>
    </main>
  );
}
