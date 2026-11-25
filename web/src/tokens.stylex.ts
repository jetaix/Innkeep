import * as stylex from "@stylexjs/stylex";

/**
 * Design tokens, as in `src/app/globals.css`.
 *
 * The dashboard is monochrome on purpose: the only colours on screen are the
 * three booking sources and the three states (good, warning, critical), so
 * colour always means something. Dark is its own set of values, not an
 * inversion.
 *
 * The values here follow the system. A host who picked light or dark, and
 * the public pages, re-point the same tokens with the themes in `themes.ts`.
 */
const DARK = "@media (prefers-color-scheme: dark)";

export const color = stylex.defineVars({
  bg: { default: "#ffffff", [DARK]: "#0f0f11" },
  subtle: { default: "#f7f7f6", [DARK]: "#151518" },
  sunken: { default: "#efefed", [DARK]: "#1d1d21" },
  line: { default: "#e7e7e4", [DARK]: "#25252a" },
  lineStrong: { default: "#d4d4d0", [DARK]: "#34343b" },
  ink: { default: "#18181b", [DARK]: "#ededf0" },
  muted: { default: "#6b6b73", [DARK]: "#9b9ba4" },
  faint: { default: "#9a9aa2", [DARK]: "#6c6c75" },
  inverse: { default: "#ffffff", [DARK]: "#0f0f11" },

  // Booking sources.
  airbnb: { default: "#e0475c", [DARK]: "#f0647a" },
  booking: { default: "#2f5fd6", [DARK]: "#6b8ff5" },
  direct: { default: "#0f8f7c", [DARK]: "#2bb8a3" },
  block: { default: "#9a9aa2", [DARK]: "#6c6c75" },

  // States.
  good: { default: "#18794e", [DARK]: "#4cc38a" },
  warn: { default: "#9a6700", [DARK]: "#f1c453" },
  warnBg: { default: "#fff6d6", [DARK]: "#2b2410" },
  critical: { default: "#c62a2f", [DARK]: "#ff8589" },
  criticalBg: { default: "#ffecec", [DARK]: "#2e1517" },

  // What the keyboard focus ring and a text selection are drawn in.
  focus: { default: "#18181b", [DARK]: "#ededf0" },

  // Brand: the glass colours of the mark and the public pages.
  panel: "#ffffff",
  glassCoral: "#ff5d73",
  glassBlue: "#3d6df2",
  glassGreen: "#10a88f",
  overlap: "#4b2bbd",
  glassBlend: "multiply",
  glassTint: "#ffffff",
  glassHi: "rgb(255 255 255 / 0.55)",
});

export const shadow = stylex.defineVars({
  pop: {
    default: "0 16px 48px -12px rgb(0 0 0 / 0.22), 0 0 0 1px rgb(0 0 0 / 0.06)",
    [DARK]: "0 16px 48px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.08)",
  },
  panel:
    "0 1px 0 rgb(255 255 255 / 0.9) inset, 0 40px 80px -40px rgb(21 23 28 / 0.28), 0 12px 28px -18px rgb(21 23 28 / 0.18), 0 0 0 1px rgb(21 23 28 / 0.05)",
});

export const font = stylex.defineVars({
  sans: '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, monospace',
  display: '"Funnel Display Variable", "Geist Variable", ui-sans-serif, system-ui, sans-serif',
});

/** The type scale in use, so a size is picked by name and not retyped. */
export const text = stylex.defineVars({
  xs: "0.6875rem", // 11 px: badges, keys
  sm: "0.75rem", // 12 px: labels, hints
  base: "0.8125rem", // 13 px: the dashboard's body size
  md: "0.875rem", // 14 px
  lg: "1.125rem", // 18 px: page titles
  field: "1rem", // 16 px: keeps a phone from zooming into a field
});

export const radius = stylex.defineVars({
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  full: "999px",
});
