import * as stylex from "@stylexjs/stylex";

/**
 * Design tokens: one world for the dashboard and the public pages.
 *
 * A pale mineral ground, white panels that float over it, and tinted glass.
 * Colour always means something: coral is Airbnb, blue is Booking.com, green
 * is a direct booking, violet is where two of them overlap, and the three
 * states (good, warning, critical) keep their own. Dark is its own set of
 * values, not an inversion.
 *
 * The values here follow the system. A host who picked light or dark, and
 * the public pages, re-point the same tokens with the themes in `themes.ts`.
 */
const DARK = "@media (prefers-color-scheme: dark)";

export const color = stylex.defineVars({
  // The ground the app stands on: a pale mineral grey-green, near-black in the dark.
  bg: { default: "#f3f4ef", [DARK]: "#0d0f13" },
  subtle: { default: "#eaece4", [DARK]: "#14171c" },
  sunken: { default: "#e1e4da", [DARK]: "#1b1f26" },
  line: { default: "#d9dcd1", [DARK]: "#252a32" },
  lineStrong: { default: "#bfc4b6", [DARK]: "#363c46" },
  ink: { default: "#15171c", [DARK]: "#eef0ea" },
  muted: { default: "#555a61", [DARK]: "#a3a8ae" },
  faint: { default: "#868b90", [DARK]: "#6f757c" },
  inverse: { default: "#ffffff", [DARK]: "#0d0f13" },
  // The surface product material is shown on: it floats over the ground.
  panel: { default: "#ffffff", [DARK]: "#171a20" },

  // Booking sources, as tinted glass.
  airbnb: { default: "#ff5d73", [DARK]: "#ff6f83" },
  booking: { default: "#3d6df2", [DARK]: "#5b84ff" },
  direct: { default: "#10a88f", [DARK]: "#1fc2a6" },
  block: { default: "#8b8f94", [DARK]: "#6f757c" },

  // States.
  good: { default: "#18794e", [DARK]: "#4cc38a" },
  warn: { default: "#8a5d00", [DARK]: "#f1c453" },
  warnBg: { default: "#fbefc4", [DARK]: "#2b2410" },
  critical: { default: "#c62a2f", [DARK]: "#ff8589" },
  criticalBg: { default: "#ffe7e6", [DARK]: "#2e1517" },
  // Two stays on the same night: the colour two sheets of glass make where they overlap.
  clash: { default: "#4b2bbd", [DARK]: "#b6a2ff" },
  clashBg: { default: "#ece6ff", [DARK]: "#251d44" },

  // What the keyboard focus ring and a text selection are drawn in.
  focus: { default: "#4b2bbd", [DARK]: "#b6a2ff" },

  // The glass colours of the mark and of decoration.
  glassCoral: { default: "#ff5d73", [DARK]: "#ff6f83" },
  glassBlue: { default: "#3d6df2", [DARK]: "#5b84ff" },
  glassGreen: { default: "#10a88f", [DARK]: "#1fc2a6" },
  overlap: { default: "#4b2bbd", [DARK]: "#b6a2ff" },
  glassBlend: { default: "multiply", [DARK]: "normal" },
  glassTint: { default: "#ffffff", [DARK]: "#0d0f13" },
  glassHi: { default: "rgb(255 255 255 / 0.55)", [DARK]: "rgb(255 255 255 / 0.14)" },
});

export const shadow = stylex.defineVars({
  pop: {
    default: "0 16px 48px -12px rgb(0 0 0 / 0.22), 0 0 0 1px rgb(0 0 0 / 0.06)",
    [DARK]: "0 16px 48px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.08)",
  },
  // A working card: close to the ground, so a page of them stays calm.
  card: {
    default:
      "0 1px 0 rgb(255 255 255 / 0.9) inset, 0 0 0 1px rgb(21 23 28 / 0.05), 0 20px 36px -30px rgb(21 23 28 / 0.3)",
    [DARK]:
      "0 1px 0 rgb(255 255 255 / 0.05) inset, 0 0 0 1px rgb(255 255 255 / 0.06), 0 20px 36px -26px rgb(0 0 0 / 0.75)",
  },
  // The one panel a page lifts higher than the rest.
  panel: {
    default:
      "0 1px 0 rgb(255 255 255 / 0.9) inset, 0 40px 80px -40px rgb(21 23 28 / 0.28), 0 12px 28px -18px rgb(21 23 28 / 0.18), 0 0 0 1px rgb(21 23 28 / 0.05)",
    [DARK]:
      "0 1px 0 rgb(255 255 255 / 0.06) inset, 0 40px 80px -40px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(255 255 255 / 0.07)",
  },
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
  lg: "1.125rem", // 18 px: a panel's own title
  title: "1.75rem", // 28 px: page titles, in the display face
  field: "1rem", // 16 px: keeps a phone from zooming into a field
});

export const radius = stylex.defineVars({
  sm: "4px",
  md: "8px",
  lg: "16px", // a card
  xl: "20px",
  slab: "12px", // a booking on a calendar
  field: "10px", // a form field
  full: "999px",
});
