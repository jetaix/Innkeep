import * as stylex from "@stylexjs/stylex";
import { color, font, text } from "../../tokens.stylex";

const styles = stylex.create({
  section: { paddingTop: "4rem" },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.5rem",
    fontWeight: 400,
    letterSpacing: "-0.025em",
  },
  intro: { margin: "0.5rem 0 0", color: color.muted, fontSize: text.base },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "0.75rem 0 0",
    padding: 0,
    listStyle: "none",
    color: color.muted,
    fontSize: text.base,
    wordBreak: "break-all",
  },
  link: { color: { default: "inherit", ":hover": color.ink }, textUnderlineOffset: 2 },
});

/** The pages a comparison's claims were read from. */
export function Sources({ title, intro, sources }: { title: string; intro: string; sources: string[] }) {
  return (
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.title)}>{title}</h2>
      <p {...stylex.props(styles.intro)}>{intro}</p>
      <ul {...stylex.props(styles.list)}>
        {sources.map((source) => (
          <li key={source}>
            {source.startsWith("https://") ? (
              <a href={source} rel="noreferrer nofollow" {...stylex.props(styles.link)}>
                {source}
              </a>
            ) : (
              source
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
