/** Tinted fill with a solid leading edge: the edge carries the channel, the text stays ink. */
export const BAR = {
  airbnb: "border-airbnb bg-[color-mix(in_oklab,var(--airbnb)_18%,var(--bg))]",
  booking: "border-booking bg-[color-mix(in_oklab,var(--booking)_18%,var(--bg))]",
  direct: "border-direct bg-[color-mix(in_oklab,var(--direct)_18%,var(--bg))]",
  block: "border-block bg-sunken hatch text-muted",
} as const;

export const barOf = (stay: { kind: string; source: "airbnb" | "booking" | "direct" }) =>
  BAR[stay.kind === "block" ? "block" : stay.source];
