import type { Night } from "@/features/pricing/compute";

/** Below this share of the lower price, two prices count as the same. */
export const NOTABLE = 0.05;

export type GapSummary = {
  /** Free nights that show a price on both platforms. */
  compared: number;
  /** Booking.com minus Airbnb, averaged over those nights, in minor units. */
  average: number;
  /** Nights where each platform is notably the cheaper one, and those where neither is. */
  airbnbCheaper: number;
  bookingCheaper: number;
  close: number;
  widest: { date: string; amount: number; dearer: "airbnb" | "booking" } | null;
};

/** Which platform asks notably less for a night, if either. */
export function cheaperOf(airbnb: number | null, booking: number | null): "airbnb" | "booking" | null {
  if (airbnb == null || booking == null) return null;
  if (Math.abs(booking - airbnb) < Math.min(airbnb, booking) * NOTABLE) return null;
  return airbnb < booking ? "airbnb" : "booking";
}

/** The difference between the two platforms' guest-facing prices over the free nights of a period. */
export function summariseGap(nights: Pick<Night, "date" | "takenBy" | "airbnb" | "booking">[]): GapSummary {
  const summary: GapSummary = {
    compared: 0,
    average: 0,
    airbnbCheaper: 0,
    bookingCheaper: 0,
    close: 0,
    widest: null,
  };
  let total = 0;
  for (const night of nights) {
    if (night.takenBy || night.airbnb == null || night.booking == null) continue;
    const difference = night.booking - night.airbnb;
    summary.compared++;
    total += difference;
    const cheaper = cheaperOf(night.airbnb, night.booking);
    if (cheaper === "airbnb") summary.airbnbCheaper++;
    else if (cheaper === "booking") summary.bookingCheaper++;
    else summary.close++;
    if (cheaper && Math.abs(difference) > (summary.widest?.amount ?? 0)) {
      summary.widest = {
        date: night.date,
        amount: Math.abs(difference),
        dearer: difference > 0 ? "booking" : "airbnb",
      };
    }
  }
  if (summary.compared > 0) summary.average = total / summary.compared;
  return summary;
}
