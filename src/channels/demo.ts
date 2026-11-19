import { addDays, today } from "@/lib/dates";
import { generateICal, type CalendarEvent } from "@/lib/ical";
import type { OtaChannel } from "@/db/schema";

/**
 * Built-in sample feeds so the app can be explored without real listings.
 * A listing whose iCal URL is `demo://airbnb/1` reads from here instead of
 * the network. Each stay is [days from today, nights, is a manual block].
 */
const STAYS: Record<string, [number, number, boolean?][]> = {
  "airbnb/1": [
    [-2, 4],
    [6, 3],
    [14, 5],
    [24, 2, true],
  ],
  "booking/1": [
    [2, 3],
    [10, 3],
    [20, 4],
  ],
  "airbnb/2": [
    [1, 6],
    [12, 2],
    [18, 7],
  ],
  "booking/2": [
    [8, 3],
    [27, 4],
  ],
  "airbnb/3": [
    [0, 3],
    [9, 4],
  ],
  // Overlaps the second Airbnb stay on purpose, to show double-booking detection.
  "booking/3": [
    [11, 3],
    [22, 5],
  ],
};

export const DEMO_SCHEME = "demo://";

export function demoFeed(url: string): string {
  const key = url.slice(DEMO_SCHEME.length);
  const stays = STAYS[key];
  if (!stays) throw new Error(`Unknown demo feed "${url}"`);
  const channel = key.split("/")[0] as OtaChannel;
  const base = today();

  const events: CalendarEvent[] = stays.map(([offset, nights, isBlock], i) => {
    const start = addDays(base, offset);
    if (channel === "airbnb") {
      return {
        uid: `demo-${key}-${i}@airbnb.com`,
        start,
        end: addDays(start, nights),
        summary: isBlock ? "Airbnb (Not available)" : "Reserved",
        description: isBlock
          ? ""
          : `Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMDEMO${i}${key.at(-1)}\nPhone Number (Last 4 Digits): 48${i}${key.at(-1)}`,
      };
    }
    return {
      uid: `demo-${key}-${i}@booking.com`,
      start,
      end: addDays(start, nights),
      summary: "CLOSED - Not available",
      description: "",
    };
  });

  return generateICal(`Demo ${key}`, events);
}
