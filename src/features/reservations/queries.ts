import "server-only";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import { getDb, properties, reservations, type Reservation } from "@/db";
import { rangesOverlap, type ISODate } from "@/lib/dates";

export function getProperties() {
  return getDb().select().from(properties).orderBy(asc(properties.createdAt)).all();
}

/** Confirmed stays and blocks that overlap [from, to). Omit `to` for everything still ahead. */
export function getStays(from: ISODate, to?: ISODate): Reservation[] {
  return getDb()
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.status, "confirmed"),
        gt(reservations.checkOut, from),
        to ? lt(reservations.checkIn, to) : undefined,
      ),
    )
    .orderBy(asc(reservations.checkIn))
    .all();
}

/** Ids of stays that share a night with another stay on the same property. */
export function findConflicts(stays: Reservation[]): Set<number> {
  const conflicts = new Set<number>();
  for (const [index, a] of stays.entries()) {
    for (const b of stays.slice(index + 1)) {
      if (a.propertyId === b.propertyId && rangesOverlap(a, b)) conflicts.add(a.id).add(b.id);
    }
  }
  return conflicts;
}
