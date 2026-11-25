import * as stylex from "@stylexjs/stylex";
import type { Reservation } from "@/db/schema";
import { addDays, type ISODate } from "@/lib/dates";
import { color } from "../../tokens.stylex";
import { type SlabTone, tintStyle } from "../../ui/slab";

/**
 * The glass of the calendar. A booking is a slab in its source's colour,
 * mixed into the panel so its ink label stays readable in light and dark;
 * closed dates are grey and hatched; nights two stays share are violet.
 * The pieces carry no radius and no side edge, so a stay drawn a day at a
 * time reads as one slab: the grid rounds its two ends.
 */
const glass = stylex.create({
  slab: {
    backgroundColor: `color-mix(in oklab, var(--g) 56%, ${color.panel})`,
    backgroundImage: `linear-gradient(180deg, ${color.glassHi}, transparent 62%)`,
    boxShadow: `inset 0 1px 0 ${color.glassHi}, 0 9px 14px -11px color-mix(in oklab, var(--g) 85%, transparent)`,
    color: color.ink,
  },
  hatch: {
    backgroundColor: `color-mix(in oklab, ${color.block} 24%, ${color.panel})`,
    backgroundImage: `repeating-linear-gradient(135deg, transparent 0 5px, color-mix(in oklab, ${color.block} 38%, transparent) 5px 6px)`,
    boxShadow: `inset 0 1px 0 ${color.glassHi}`,
    color: color.ink,
  },
});

const slab = (tone: SlabTone) =>
  tone === "block" ? ([glass.hatch, tintStyle("block")] as const) : ([glass.slab, tintStyle(tone)] as const);

/** One slab per meaning, for the legend and the grids. */
export const bars = {
  airbnb: slab("airbnb"),
  booking: slab("booking"),
  direct: slab("direct"),
  block: slab("block"),
  clash: slab("clash"),
} as const;

export const barOf = (stay: { kind: string; source: "airbnb" | "booking" | "direct" }) =>
  bars[stay.kind === "block" ? "block" : stay.source];

/** A period two stays of one property both hold: from the later arrival to the earlier departure. */
export type Overlap = { propertyId: number; from: ISODate; to: ISODate };

/** Where the stays marked as conflicting overlap, pair by pair. */
export function overlapsOf(stays: Reservation[], conflicts: Set<number>): Overlap[] {
  const marked = stays.filter((stay) => conflicts.has(stay.id));
  const found: Overlap[] = [];
  for (const [index, a] of marked.entries()) {
    for (const b of marked.slice(index + 1)) {
      if (a.propertyId !== b.propertyId) continue;
      const from = a.checkIn > b.checkIn ? a.checkIn : b.checkIn;
      const to = a.checkOut < b.checkOut ? a.checkOut : b.checkOut;
      if (from < to) found.push({ propertyId: a.propertyId, from, to });
    }
  }
  return found;
}

/** The nights of one property that two stays share. */
export function sharedNights(overlaps: Overlap[], propertyId: number): Set<ISODate> {
  const nights = new Set<ISODate>();
  for (const overlap of overlaps) {
    if (overlap.propertyId !== propertyId) continue;
    for (let night = overlap.from; night < overlap.to; night = addDays(night, 1)) nights.add(night);
  }
  return nights;
}
