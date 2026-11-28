import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Glass } from "../../brand/glass";
import { LogoMark } from "../../brand/logo";
import { color, font, radius, shadow, text } from "../../tokens.stylex";

const SMALL = "@media (min-width: 40rem)";

const styles = stylex.create({
  main: {
    position: "relative",
    isolation: "isolate",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100dvh",
    padding: "3rem 1.25rem",
    overflow: "hidden",
  },
  glass: {
    position: "absolute",
    zIndex: -1,
    top: "50%",
    left: "50%",
    width: { default: "22rem", [SMALL]: "34rem" },
    height: { default: "30rem", [SMALL]: "40rem" },
    translate: "-50% -50%",
  },
  archOne: { top: 0, left: 0, width: "62%", height: "88%", rotate: "-4deg" },
  archTwo: { bottom: 0, right: 0, width: "62%", height: "88%", rotate: "3deg" },
  door: {
    width: "100%",
    maxWidth: "24rem",
    padding: { default: "1.5rem", [SMALL]: "2rem" },
    borderRadius: "1.75rem",
    backgroundColor: color.panel,
    boxShadow: shadow.panel,
  },
  mark: { width: "2.25rem", height: "2.25rem" },
  title: {
    margin: "0.875rem 0 0",
    fontFamily: font.display,
    fontSize: "2rem",
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
  },
  intro: { margin: "0.5rem 0 1.5rem", color: color.muted, fontSize: text.md, lineHeight: 1.55 },
});

/** What the forms behind a door share. */
export const doorStyles = stylex.create({
  form: { display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.875rem" },
  field: { height: "2.75rem", borderRadius: radius.xl },
  wide: { width: "100%" },
  other: { margin: "1.25rem 0 0", color: color.muted, fontSize: text.md, lineHeight: 1.55 },
  link: {
    color: color.ink,
    fontWeight: 500,
    textDecorationLine: "underline",
    textUnderlineOffset: "0.2em",
  },
});

/** The page around the door: the two calendars as two doorways of glass, overlapping behind it. */
export function Doorway({ children }: { children: ReactNode }) {
  return (
    <main {...stylex.props(styles.main)}>
      <div aria-hidden {...stylex.props(styles.glass)}>
        <Glass tint="coral" xstyle={styles.archOne} />
        <Glass tint="blue" xstyle={styles.archTwo} />
      </div>
      {children}
    </main>
  );
}

/** The panel someone signs in, signs up or follows a link through. */
export function Door({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div {...stylex.props(styles.door)}>
      <LogoMark tone="color" xstyle={styles.mark} />
      <h1 {...stylex.props(styles.title)}>{title}</h1>
      <p {...stylex.props(styles.intro)}>{intro}</p>
      {children}
    </div>
  );
}
