import * as stylex from "@stylexjs/stylex";

/**
 * The dashboard's colours, as in `src/app/globals.css`: monochrome, with
 * colour kept for the booking sources and the three states. Dark values
 * follow the system here; the host's own choice comes with the shell.
 */
const DARK = "@media (prefers-color-scheme: dark)";

export const color = stylex.defineVars({
  bg: { default: "#ffffff", [DARK]: "#0f0f11" },
  subtle: { default: "#f7f7f6", [DARK]: "#151518" },
  line: { default: "#e7e7e4", [DARK]: "#25252a" },
  lineStrong: { default: "#d4d4d0", [DARK]: "#34343b" },
  ink: { default: "#18181b", [DARK]: "#ededf0" },
  muted: { default: "#6b6b73", [DARK]: "#9b9ba4" },
  inverse: { default: "#ffffff", [DARK]: "#0f0f11" },
  critical: { default: "#c62a2f", [DARK]: "#ff8589" },
});

export const font = stylex.defineVars({
  sans: "ui-sans-serif, system-ui, sans-serif",
});
