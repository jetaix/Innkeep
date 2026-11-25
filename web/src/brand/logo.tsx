import * as stylex from "@stylexjs/stylex";
import { useId } from "react";
import { color, font } from "../tokens.stylex";

/** One arch of the mark: a doorway, drawn from `x` to `x + 11`. */
const arch = (x: number) =>
  `M${x + 1.5} 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11a1.5 1.5 0 0 1-1.5 1.5Z`;

export const MARK = { left: arch(2.5), right: arch(10.5) } as const;

const styles = stylex.create({
  mark: { width: "1.25rem", height: "1.25rem" },
  coral: { fill: color.glassCoral },
  blue: { fill: color.glassBlue },
  overlap: { fill: color.overlap },
  logo: { display: "inline-flex", alignItems: "center", gap: "0.5rem", letterSpacing: "-0.025em" },
  ink: { fontSize: "0.9375rem", fontWeight: 600 },
  color: { fontFamily: font.display, fontSize: "1.1875rem", fontWeight: 500 },
});

/**
 * The mark: two doorways that overlap, one per calendar, darker where they
 * meet. In `ink` it inherits the text colour, so it stays monochrome inside
 * the dashboard; in `color` it uses the brand glass colours of the public pages.
 */
export function LogoMark({ tone = "ink", xstyle }: { tone?: "ink" | "color"; xstyle?: stylex.StyleXStyles }) {
  const clip = useId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...stylex.props(styles.mark, xstyle)}>
      {tone === "ink" ? (
        <g fill="currentColor">
          <path d={MARK.left} opacity="0.5" />
          <path d={MARK.right} opacity="0.5" />
          <clipPath id={clip}>
            <path d={MARK.left} />
          </clipPath>
          <path d={MARK.right} clipPath={`url(#${clip})`} />
        </g>
      ) : (
        <>
          <path d={MARK.left} {...stylex.props(styles.coral)} />
          <path d={MARK.right} {...stylex.props(styles.blue)} />
          <clipPath id={clip}>
            <path d={MARK.left} />
          </clipPath>
          <path d={MARK.right} clipPath={`url(#${clip})`} {...stylex.props(styles.overlap)} />
        </>
      )}
    </svg>
  );
}

export function Logo({ tone = "ink", xstyle }: { tone?: "ink" | "color"; xstyle?: stylex.StyleXStyles }) {
  return (
    <span {...stylex.props(styles.logo, styles[tone], xstyle)}>
      <LogoMark tone={tone} />
      Innkeep
    </span>
  );
}
