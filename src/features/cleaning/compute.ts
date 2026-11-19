import type {
  Cleaner,
  CleanerAssignment,
  CleaningRecord,
  CleaningStatus,
  Property,
  Reservation,
} from "@/db/schema";
import { addDays, diffDays, type ISODate } from "@/lib/dates";

/**
 * The cleaning schedule. Pure: plain rows in, plain rows out, no database and
 * no clock, so every rule is unit tested.
 *
 * The idea, and the shape of the feature, follow the cleaning schedule of
 * RentTools.io (MIT): a place needs cleaning each time a guest leaves, the
 * time to do it runs until the next guest arrives, and one cleaner booked
 * for two places on the same day is worth a warning. The code is Innkeep's own.
 */

type Stay = Pick<
  Reservation,
  "id" | "propertyId" | "kind" | "status" | "checkIn" | "checkOut" | "guestName" | "guests" | "source"
>;
type Place = Pick<Property, "id" | "name" | "checkInTime" | "checkOutTime" | "cleaningEnabled">;

export type Cleaning = {
  propertyId: number;
  date: ISODate;
  /** After a guest leaves, or added by hand by the host. */
  kind: "checkout" | "manual";
  /** The stay that ends on this day; null for a manual cleaning. */
  after: Stay | null;
  /** The next arrival at this place, when one is booked. */
  next: Stay | null;
  /** When the place is free to clean from, "HH:MM" on `date`. */
  from: string;
  /** The next guest arrives the same day: the window is hours, not days. */
  sameDay: boolean;
  /** Whole hours between check-out and the next check-in; null when no arrival is booked. */
  hours: number | null;
  status: CleaningStatus;
  notes: string;
  /** Who does it: the one picked for this day, else the property's usual cleaner. */
  cleaner: Cleaner | null;
  /** Whether the host picked this cleaner for this day specifically. */
  reassigned: boolean;
  /** The same cleaner has another place to clean that day. */
  clash: boolean;
  /** Someone who could take it instead: the property's backup, when free that day. */
  backup: Cleaner | null;
};

const minutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + (minute || 0);
};

export function buildSchedule(input: {
  from: ISODate;
  days: number;
  properties: Place[];
  /** Stays of every property; cancelled ones and blocks are ignored. */
  stays: Stay[];
  records: CleaningRecord[];
  cleaners: Cleaner[];
  assignments: CleanerAssignment[];
}): Cleaning[] {
  const { from, days, properties, stays, records, cleaners, assignments } = input;
  const until = addDays(from, days);
  const cleanerById = new Map(cleaners.map((cleaner) => [cleaner.id, cleaner]));
  const ranked = (propertyId: number) =>
    assignments
      .filter((assignment) => assignment.propertyId === propertyId)
      .sort((a, b) => a.priority - b.priority)
      .flatMap((assignment) => cleanerById.get(assignment.cleanerId) ?? []);
  const recordFor = (propertyId: number, date: ISODate) =>
    records.find((record) => record.propertyId === propertyId && record.date === date);

  const schedule: Cleaning[] = [];
  for (const place of properties) {
    if (!place.cleaningEnabled) continue;
    const guests = stays
      .filter(
        (stay) => stay.propertyId === place.id && stay.kind === "reservation" && stay.status === "confirmed",
      )
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    const [usual] = ranked(place.id);

    const add = (date: ISODate, after: Stay | null) => {
      const record = recordFor(place.id, date);
      const next = guests.find((stay) => stay.checkIn >= date && stay.id !== after?.id) ?? null;
      const picked = record?.cleanerId != null ? (cleanerById.get(record.cleanerId) ?? null) : null;
      schedule.push({
        propertyId: place.id,
        date,
        kind: after ? "checkout" : "manual",
        after,
        next,
        from: place.checkOutTime,
        sameDay: next?.checkIn === date,
        hours: next
          ? Math.max(
              0,
              Math.floor(
                (diffDays(date, next.checkIn) * 24 * 60 +
                  minutes(place.checkInTime) -
                  minutes(place.checkOutTime)) /
                  60,
              ),
            )
          : null,
        status: record?.status ?? "pending",
        notes: record?.notes ?? "",
        cleaner: picked ?? usual ?? null,
        reassigned: picked != null,
        clash: false,
        backup: null,
      });
    };

    for (const stay of guests) {
      if (stay.checkOut >= from && stay.checkOut < until) add(stay.checkOut, stay);
    }
    // Cleanings the host added by hand, on days no guest leaves.
    for (const record of records) {
      if (record.propertyId !== place.id || !record.manual) continue;
      if (record.date < from || record.date >= until) continue;
      if (schedule.some((entry) => entry.propertyId === place.id && entry.date === record.date)) continue;
      add(record.date, null);
    }
  }

  // One cleaner, two places, same day: flag both, and name a free backup for each.
  const open = schedule.filter((entry) => entry.status === "pending" && entry.cleaner);
  for (const entry of open) {
    const sameDay = open.filter((other) => other.date === entry.date);
    entry.clash = sameDay.some((other) => other !== entry && other.cleaner!.id === entry.cleaner!.id);
    if (!entry.clash) continue;
    const busy = new Set(sameDay.map((other) => other.cleaner!.id));
    entry.backup = ranked(entry.propertyId).find((cleaner) => !busy.has(cleaner.id)) ?? null;
  }

  return schedule.sort((a, b) => a.date.localeCompare(b.date) || a.propertyId - b.propertyId);
}

/** Cleanings still to do that nobody is assigned to. */
export function unassigned(schedule: Cleaning[]): Cleaning[] {
  return schedule.filter((entry) => entry.status === "pending" && !entry.cleaner);
}
