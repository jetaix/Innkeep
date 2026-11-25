import * as stylex from "@stylexjs/stylex";
import { color } from "../../tokens.stylex";

/** Tinted fill with a solid leading edge: the edge carries the channel, the text stays ink. */
export const bars = stylex.create({
  airbnb: {
    borderLeftColor: color.airbnb,
    backgroundColor: `color-mix(in oklab, ${color.airbnb} 18%, ${color.bg})`,
  },
  booking: {
    borderLeftColor: color.booking,
    backgroundColor: `color-mix(in oklab, ${color.booking} 18%, ${color.bg})`,
  },
  direct: {
    borderLeftColor: color.direct,
    backgroundColor: `color-mix(in oklab, ${color.direct} 18%, ${color.bg})`,
  },
  block: {
    borderLeftColor: color.block,
    backgroundColor: color.sunken,
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, ${color.ink} 10%, transparent) 5px 6px)`,
    color: color.muted,
  },
});

export const barOf = (stay: { kind: string; source: "airbnb" | "booking" | "direct" }) =>
  bars[stay.kind === "block" ? "block" : stay.source];
