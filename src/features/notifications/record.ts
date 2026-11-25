import { lt } from "drizzle-orm";
import { type getDb, reservationEvents, type Source } from "@/db";
import { reservationEvent, type Snapshot } from "./compute";

type Db = ReturnType<typeof getDb>;
/** The database, or a transaction on it. */
type Writer = Pick<Db, "insert" | "delete">;

/** Events are only read by the browser extension, minutes after they happen. */
const KEEP_MS = 30 * 24 * 60 * 60_000;

/** Notes a change to a stay for the browser's notifications, when it is one the host should hear about. */
export async function recordReservationEvent(
  db: Writer,
  stay: { id: number; source: Source },
  before: Snapshot | null,
  after: Snapshot,
  today: string,
) {
  const event = reservationEvent(stay.source, before, after, today);
  if (!event) return;
  await db
    .insert(reservationEvents)
    .values({ reservationId: stay.id, kind: event.kind, detail: event.detail, at: Date.now() })
    .run();
  await db
    .delete(reservationEvents)
    .where(lt(reservationEvents.at, Date.now() - KEEP_MS))
    .run();
}
