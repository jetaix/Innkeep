import "server-only";
import { asc } from "drizzle-orm";
import { cleanerAssignments, cleaners, cleanings, getDb, reservations } from "@/db";
import { getProperties } from "@/features/reservations/queries";
import { addDays, today } from "@/lib/dates";
import { buildSchedule } from "./compute";

/** How far ahead the schedule looks, and how far back it keeps showing what was done. */
export const AHEAD_DAYS = 120;
const BEHIND_DAYS = 3;

export async function getCleaning() {
  const db = getDb();
  const now = today();
  const properties = await getProperties();
  const allCleaners = await db.select().from(cleaners).orderBy(asc(cleaners.name)).all();
  const assignments = await db.select().from(cleanerAssignments).all();
  const schedule = buildSchedule({
    from: addDays(now, -BEHIND_DAYS),
    days: AHEAD_DAYS + BEHIND_DAYS,
    properties,
    stays: await db.select().from(reservations).all(),
    records: await db.select().from(cleanings).all(),
    cleaners: allCleaners,
    assignments,
  });
  return { today: now, properties, cleaners: allCleaners, assignments, schedule };
}
