import "@fontsource-variable/funnel-display/wght.css";
import * as stylex from "@stylexjs/stylex";
import type { ComponentProps, ReactNode } from "react";
import { useTheme } from "../theme";
import { brand, brandDark, brandDarkShadow, brandLight, brandLightShadow, brandShadow } from "../themes";
import { color, font, shadow } from "../tokens.stylex";

const MOVES = "@media (prefers-reduced-motion: no-preference)";
const SCROLL_DRIVEN = "@supports (animation-timeline: scroll())";

// Grain, so the colour reads as a material and not as a gradient.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Depth planes: glass further away moves less as the page scrolls. */
const drift = stylex.keyframes({ to: { translate: "0 var(--drift, -80px)" } });

const styles = stylex.create({
  scope: {
    "--focus": color.focus,
    backgroundColor: color.bg,
    color: color.ink,
    accentColor: color.overlap,
    caretColor: color.overlap,
    scrollbarColor: `${color.lineStrong} transparent`,
  },
  /*
   * A slab of tinted glass. `--g` is its colour. It blends with whatever is
   * under it, so two slabs that overlap darken each other, which is the
   * whole idea of the brand: an overlap is a double booking.
   */
  glass: {
    position: "absolute",
    backgroundImage: `radial-gradient(120% 80% at 20% 0%, ${color.glassHi}, transparent 55%), linear-gradient(170deg, color-mix(in oklab, var(--g) 58%, ${color.glassTint}) 0%, var(--g) 78%)`,
    opacity: "var(--glass-opacity, 0.82)",
    mixBlendMode: color.glassBlend,
    boxShadow: `inset 0 2px 0 ${color.glassHi}, inset 0 0 0 1.5px color-mix(in oklab, ${color.glassHi} 55%, transparent), inset 0 -32px 48px -32px rgb(0 0 0 / 0.22), 0 56px 90px -44px color-mix(in oklab, var(--g) 75%, transparent)`,
    "::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      backgroundImage: GRAIN,
      mixBlendMode: "soft-light",
      opacity: 0.95,
      pointerEvents: "none",
    },
  },
  /* A field of one glass colour that a white product panel floats over. */
  field: {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    backgroundColor: `color-mix(in oklab, var(--g) 16%, ${color.bg})`,
    backgroundImage: `radial-gradient(90% 70% at 85% 10%, color-mix(in oklab, var(--g) 30%, ${color.bg}), transparent 60%)`,
  },
  panel: { backgroundColor: color.panel, boxShadow: shadow.panel },
  display: { fontFamily: font.display },
  // Moves with the page's own scroll.
  plane: {
    animationName: { default: null, [SCROLL_DRIVEN]: { default: null, [MOVES]: drift } },
    animationTimingFunction: "linear",
    animationFillMode: "both",
    animationTimeline: { default: null, [SCROLL_DRIVEN]: "scroll(root)" },
    animationRange: { default: null, [SCROLL_DRIVEN]: "0 120vh" },
  },
  // Moves while the slab itself crosses the screen.
  planeInView: {
    animationName: { default: null, [SCROLL_DRIVEN]: { default: null, [MOVES]: drift } },
    animationTimingFunction: "linear",
    animationFillMode: "both",
    animationTimeline: { default: null, [SCROLL_DRIVEN]: "view()" },
  },
  opacity: (value: number) => ({ "--glass-opacity": value }),
  drift: (pixels: number) => ({ "--drift": `${pixels}px` }),
});

const tints = stylex.create({
  coral: { "--g": color.glassCoral },
  blue: { "--g": color.glassBlue },
  green: { "--g": color.glassGreen },
  overlap: { "--g": color.overlap },
});

const shapes = stylex.create({
  arch: { borderRadius: "999px 999px 2rem 2rem" },
  pill: { borderRadius: "999px" },
  tile: { borderRadius: "22%" },
});

export type Tint = keyof typeof tints;

type Styled<T> = Omit<T, "className" | "style"> & { xstyle?: stylex.StyleXStyles };

/**
 * The world of the public pages: a pale mineral ground with tinted glass.
 * It re-points the shared tokens, so every component keeps working inside it
 * and the dashboard is untouched.
 */
export function Brand({ xstyle, ...props }: Styled<ComponentProps<"div">>) {
  const theme = useTheme();
  return (
    <div
      {...props}
      {...stylex.props(
        brand,
        brandShadow,
        theme === "light" && [brandLight, brandLightShadow],
        theme === "dark" && [brandDark, brandDarkShadow],
        styles.scope,
        xstyle,
      )}
    />
  );
}

/** A slab of glass. Decoration only: place and size it with `xstyle`. */
export function Glass({
  tint,
  shape = "arch",
  opacity,
  drift: distance,
  plane,
  xstyle,
}: {
  tint: Tint;
  shape?: keyof typeof shapes;
  opacity?: number;
  /** How far it travels as the page scrolls, in pixels. Negative is up. */
  drift?: number;
  /** What its travel follows: the page's scroll, or its own way across the screen. */
  plane?: "page" | "view";
  xstyle?: stylex.StyleXStyles;
}) {
  return (
    <div
      aria-hidden
      {...stylex.props(
        styles.glass,
        tints[tint],
        shapes[shape],
        plane === "page" && styles.plane,
        plane === "view" && styles.planeInView,
        opacity !== undefined && styles.opacity(opacity),
        distance !== undefined && styles.drift(distance),
        xstyle,
      )}
    />
  );
}

/** A field of one glass colour, for a product panel to float over. */
export function GlassField({ tint, xstyle, ...props }: Styled<ComponentProps<"div">> & { tint: Tint }) {
  return <div {...props} {...stylex.props(styles.field, tints[tint], xstyle)} />;
}

/** The white surface the product is shown on. */
export function Panel({ xstyle, ...props }: Styled<ComponentProps<"div">>) {
  return <div {...props} {...stylex.props(styles.panel, xstyle)} />;
}

/** Text in the display face of the public pages. */
export function Display({ children, xstyle }: { children: ReactNode; xstyle?: stylex.StyleXStyles }) {
  return <span {...stylex.props(styles.display, xstyle)}>{children}</span>;
}
