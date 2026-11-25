import * as stylex from "@stylexjs/stylex";
import { color, font, shadow } from "../../tokens.stylex";

export const SM = "@media (min-width: 40rem)";
export const MD = "@media (min-width: 48rem)";
export const LG = "@media (min-width: 64rem)";

/** What the landing page's sections share: their measure, their titles, their links. */
export const kit = stylex.create({
  // A section of the page, on the page's measure.
  section: {
    maxWidth: "72rem",
    marginInline: "auto",
    paddingTop: { default: "9rem", [SM]: "12rem" },
    paddingInline: { default: "1.25rem", [SM]: "2rem" },
    scrollMarginTop: "6rem",
  },
  h2: {
    margin: 0,
    fontFamily: font.display,
    fontSize: { default: "2.25rem", [SM]: "3.75rem" },
    fontWeight: 400,
    lineHeight: 1.04,
    letterSpacing: "-0.03em",
    textWrap: "balance",
  },
  // The paragraph under a section's title.
  lead: {
    margin: "1.5rem 0 0",
    color: color.muted,
    fontSize: "1.125rem",
    lineHeight: 1.625,
    textWrap: "pretty",
  },
  // The same paragraph on a field of glass: the ink takes some of the field's colour.
  tinted: { color: `color-mix(in oklab, ${color.ink} 72%, var(--g))` },
  intro: { maxWidth: "48rem", marginInline: "auto", textAlign: "center" },
  centered: { marginInline: "auto" },
  link: {
    color: "inherit",
    textDecorationLine: "underline",
    textDecorationColor: { default: color.lineStrong, ":hover": color.ink },
    textUnderlineOffset: 4,
  },
  // A link that stands on its own line under a text.
  more: { display: "inline-block", fontSize: "0.9375rem", fontWeight: 500 },
  // The white surface the product is shown on, for an element that is not a `div`.
  panel: { backgroundColor: color.panel, boxShadow: shadow.panel },
  term: {
    margin: 0,
    fontFamily: font.display,
    fontSize: "1.25rem",
    fontWeight: 400,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
  },
  definition: {
    margin: "0.5rem 0 0",
    color: color.muted,
    fontSize: "0.9375rem",
    lineHeight: 1.625,
  },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.75rem" },
  // Behind the content of its field.
  behind: { zIndex: -1 },
});
