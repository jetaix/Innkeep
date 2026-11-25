import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { getDb, listings, properties, reservations } from "@/db";
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
