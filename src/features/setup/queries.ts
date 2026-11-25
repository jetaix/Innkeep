import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { getDb, listings, OTA_CHANNELS, properties, reservations } from "@/db";
import { getExtensionStatus, getLastUpdate } from "@/features/extension/status";
import { today } from "@/lib/dates";

/** The property being set up, with the calendar links saved so far. */
export async function getSetupProperty(id: number) {
  const db = getDb();
  const property = await db.select().from(properties).where(eq(properties.id, id)).get();
  if (!property) return null;
  return { property, listings: await db.select().from(listings).where(eq(listings.propertyId, id)).all() };
}

/** What Innkeep knows about the property at the end of the guide: its coming stays, and how many have a name. */
export async function getSetupSummary(id: number) {
  const stays = await getDb()
    .select({ guestName: reservations.guestName })
    .from(reservations)
    .where(
      and(
        eq(reservations.propertyId, id),
        eq(reservations.kind, "reservation"),
        eq(reservations.status, "confirmed"),
        gt(reservations.checkOut, today()),
      ),
    )
    .all();
  return { stays: stays.length, named: stays.filter((stay) => stay.guestName).length };
}

/** Asked every few seconds by a waiting step: has the extension connected, and when did it last read reservations? */
export async function getSetupProgress() {
  const [{ state }, ...read] = await Promise.all([
    getExtensionStatus(),
    ...OTA_CHANNELS.map((channel) => getLastUpdate(channel)),
  ]);
  return { extension: state === "ready", readAt: Math.max(0, ...read.map((last) => last?.at ?? 0)) };
}
