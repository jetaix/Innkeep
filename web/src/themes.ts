import * as stylex from "@stylexjs/stylex";
import { color, shadow } from "./tokens.stylex";

/**
 * The tokens re-pointed for a part of the page.
 *
 * `light` and `dark` hold the host's own choice against the system's. The
 * three `brand` sets are the public pages: a pale mineral ground with tinted
 * glass, where coral is Airbnb, blue is Booking.com, green is a direct
 * booking, and the colour two of them make where they overlap is the only
 * accent. Every component keeps working inside any of them.
 *
 * A theme starts again from the system's values for every token it does not
 * name, so the sets that hold a choice against the system name them all.
 */
const DARK = "@media (prefers-color-scheme: dark)";

export const light = stylex.createTheme(color, {
  bg: "#ffffff",
  subtle: "#f7f7f6",
  sunken: "#efefed",
  line: "#e7e7e4",
  lineStrong: "#d4d4d0",
  ink: "#18181b",
  muted: "#6b6b73",
  faint: "#9a9aa2",
  inverse: "#ffffff",
  airbnb: "#e0475c",
  booking: "#2f5fd6",
  direct: "#0f8f7c",
  block: "#9a9aa2",
  good: "#18794e",
  warn: "#9a6700",
  warnBg: "#fff6d6",
  critical: "#c62a2f",
  criticalBg: "#ffecec",
  focus: "#18181b",
});

export const dark = stylex.createTheme(color, {
  bg: "#0f0f11",
  subtle: "#151518",
  sunken: "#1d1d21",
  line: "#25252a",
  lineStrong: "#34343b",
  ink: "#ededf0",
  muted: "#9b9ba4",
  faint: "#6c6c75",
  inverse: "#0f0f11",
  airbnb: "#f0647a",
  booking: "#6b8ff5",
  direct: "#2bb8a3",
  block: "#6c6c75",
  good: "#4cc38a",
  warn: "#f1c453",
  warnBg: "#2b2410",
  critical: "#ff8589",
  criticalBg: "#2e1517",
  focus: "#ededf0",
});

const POP_LIGHT = "0 16px 48px -12px rgb(0 0 0 / 0.22), 0 0 0 1px rgb(0 0 0 / 0.06)";
const POP_DARK = "0 16px 48px -12px rgb(0 0 0 / 0.7), 0 0 0 1px rgb(255 255 255 / 0.08)";

export const lightShadow = stylex.createTheme(shadow, { pop: POP_LIGHT });
export const darkShadow = stylex.createTheme(shadow, { pop: POP_DARK });

/** The public pages, following the system. */
export const brand = stylex.createTheme(color, {
  bg: { default: "#f3f4ef", [DARK]: "#0d0f13" },
  subtle: { default: "#eaece4", [DARK]: "#14171c" },
  sunken: { default: "#e1e4da", [DARK]: "#1b1f26" },
  line: { default: "#d9dcd1", [DARK]: "#252a32" },
  lineStrong: { default: "#bfc4b6", [DARK]: "#363c46" },
  ink: { default: "#15171c", [DARK]: "#eef0ea" },
  muted: { default: "#555a61", [DARK]: "#a3a8ae" },
  faint: { default: "#868b90", [DARK]: "#6f757c" },
  inverse: { default: "#ffffff", [DARK]: "#0d0f13" },
  panel: { default: "#ffffff", [DARK]: "#171a20" },
  glassCoral: { default: "#ff5d73", [DARK]: "#ff6f83" },
  glassBlue: { default: "#3d6df2", [DARK]: "#5b84ff" },
  glassGreen: { default: "#10a88f", [DARK]: "#1fc2a6" },
  overlap: { default: "#4b2bbd", [DARK]: "#b6a2ff" },
  airbnb: { default: "#ff5d73", [DARK]: "#ff6f83" },
  booking: { default: "#3d6df2", [DARK]: "#5b84ff" },
  direct: { default: "#10a88f", [DARK]: "#1fc2a6" },
  block: { default: "#8b8f94", [DARK]: "#6f757c" },
  critical: { default: "#4b2bbd", [DARK]: "#b6a2ff" },
  criticalBg: { default: "#ece6ff", [DARK]: "#251d44" },
  focus: { default: "#4b2bbd", [DARK]: "#b6a2ff" },
  glassBlend: { default: "multiply", [DARK]: "normal" },
  glassTint: { default: "#ffffff", [DARK]: "#0d0f13" },
  glassHi: { default: "rgb(255 255 255 / 0.55)", [DARK]: "rgb(255 255 255 / 0.14)" },
});

export const brandLight = stylex.createTheme(color, {
  bg: "#f3f4ef",
  subtle: "#eaece4",
  sunken: "#e1e4da",
  line: "#d9dcd1",
  lineStrong: "#bfc4b6",
  ink: "#15171c",
  muted: "#555a61",
  faint: "#868b90",
  inverse: "#ffffff",
  panel: "#ffffff",
  glassCoral: "#ff5d73",
  glassBlue: "#3d6df2",
  glassGreen: "#10a88f",
  overlap: "#4b2bbd",
  airbnb: "#ff5d73",
  booking: "#3d6df2",
  direct: "#10a88f",
  block: "#8b8f94",
  good: "#18794e",
  warn: "#9a6700",
  warnBg: "#fff6d6",
  critical: "#4b2bbd",
  criticalBg: "#ece6ff",
  focus: "#4b2bbd",
  glassBlend: "multiply",
  glassTint: "#ffffff",
  glassHi: "rgb(255 255 255 / 0.55)",
});

export const brandDark = stylex.createTheme(color, {
  bg: "#0d0f13",
  subtle: "#14171c",
  sunken: "#1b1f26",
  line: "#252a32",
  lineStrong: "#363c46",
  ink: "#eef0ea",
  muted: "#a3a8ae",
  faint: "#6f757c",
  inverse: "#0d0f13",
  panel: "#171a20",
  glassCoral: "#ff6f83",
  glassBlue: "#5b84ff",
  glassGreen: "#1fc2a6",
  overlap: "#b6a2ff",
  airbnb: "#ff6f83",
  booking: "#5b84ff",
  direct: "#1fc2a6",
  block: "#6f757c",
  good: "#4cc38a",
  warn: "#f1c453",
  warnBg: "#2b2410",
  critical: "#b6a2ff",
  criticalBg: "#251d44",
  focus: "#b6a2ff",
  glassBlend: "normal",
  glassTint: "#0d0f13",
  glassHi: "rgb(255 255 255 / 0.14)",
});

const PANEL_LIGHT =
  "0 1px 0 rgb(255 255 255 / 0.9) inset, 0 40px 80px -40px rgb(21 23 28 / 0.28), 0 12px 28px -18px rgb(21 23 28 / 0.18), 0 0 0 1px rgb(21 23 28 / 0.05)";
const PANEL_DARK =
  "0 1px 0 rgb(255 255 255 / 0.06) inset, 0 40px 80px -40px rgb(0 0 0 / 0.8), 0 0 0 1px rgb(255 255 255 / 0.07)";

export const brandShadow = stylex.createTheme(shadow, {
  panel: { default: PANEL_LIGHT, [DARK]: PANEL_DARK },
});
export const brandLightShadow = stylex.createTheme(shadow, { pop: POP_LIGHT, panel: PANEL_LIGHT });
export const brandDarkShadow = stylex.createTheme(shadow, { pop: POP_DARK, panel: PANEL_DARK });
