import * as stylex from "@stylexjs/stylex";
import type { ComponentProps } from "react";
import type { Source } from "@/db/schema";
import { color, font, radius } from "../tokens.stylex";

/**
 * The glass of the dashboard.
 *
 * A booking is a slab of tinted glass in its source's colour: coral for
 * Airbnb, blue for Booking.com, green for a direct booking, grey and hatched
 * for dates the host closed. Where two stays share a night the slab is the
 * violet two sheets make where they overlap. The source's name is always
 * written on or beside it; colour never carries the meaning alone.
 */
export type SlabTone = Source | "block" | "clash";

const styles = stylex.create({
  slab: {
    borderRadius: radius.slab,
    // The colour mixed into the panel, so the ink label stays readable in both modes.
    backgroundColor: `color-mix(in oklab, var(--g) 56%, ${color.panel})`,
    backgroundImage: `linear-gradient(180deg, ${color.glassHi}, transparent 60%)`,
    color: color.ink,
    boxShadow: `inset 0 1px 0 ${color.glassHi}, inset 0 0 0 1px color-mix(in oklab, var(--g) 40%, transparent), 0 10px 16px -12px color-mix(in oklab, var(--g) 80%, transparent)`,
  },
  // A lighter sheet of the same colour, for an area rather than a booking.
  wash: {
    backgroundColor: `color-mix(in oklab, var(--g) 14%, ${color.panel})`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, var(--g) 22%, transparent)`,
  },
  hatch: {
    backgroundColor: `color-mix(in oklab, ${color.block} 26%, ${color.panel})`,
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, ${color.block} 34%, transparent) 5px 6px)`,
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${color.block} 30%, transparent)`,
  },
  // A number that a page is about, in the display face.
  figure: {
    fontFamily: font.display,
    fontWeight: 400,
    letterSpacing: "-0.03em",
    lineHeight: 1.05,
    fontVariantNumeric: "tabular-nums",
  },
});

const tints = stylex.create({
  airbnb: { "--g": color.airbnb },
  booking: { "--g": color.booking },
  direct: { "--g": color.direct },
  block: { "--g": color.block },
  clash: { "--g": color.clash },
});

/** Styles of a booking slab, for anything that should be one. Spread into `stylex.props`. */
export function slabStyle(tone: SlabTone) {
  return tone === "block"
    ? ([styles.slab, tints.block, styles.hatch] as const)
    : ([styles.slab, tints[tone]] as const);
}

/** A pale sheet of one source's colour, for a region that belongs to it. */
export function washStyle(tone: SlabTone) {
  return [styles.wash, tints[tone]] as const;
}

/** Sets `--g` to a source's colour, for a component that draws its own glass. */
export function tintStyle(tone: SlabTone) {
  return tints[tone];
}

/** The display-face figure style: give it a size where it is used. */
export const figureStyle = styles.figure;

type Styled<T> = Omit<T, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

export function Slab({ tone, xstyle, ...props }: Styled<ComponentProps<"div">> & { tone: SlabTone }) {
  return <div {...props} {...stylex.props(slabStyle(tone), xstyle)} />;
}
