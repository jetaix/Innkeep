import type { CalendarEvent } from "@/lib/ical";
import type { OtaChannel, Source } from "@/db/schema";

/**
 * A channel adapter describes how Innkeep talks to one booking platform.
 *
 * Today both adapters work over iCal, the only integration Airbnb and
 * Booking.com offer without a partner agreement. `pushContent` and
 * `sendMessage` are the seams for their partner APIs: implement them in an
 * adapter and the rest of the app (publish buttons, inbox delivery) picks
 * them up through `capabilities`.
 */
export type ChannelAdapter = {
  id: OtaChannel;
  label: string;
  capabilities: {
    /** Listing content can be pushed through an API. */
    content: boolean;
    /** Guest messages can be sent through an API. */
    messaging: boolean;
  };
  /** Where the host edits calendar sync settings on the channel. */
  calendarHelp: string;
  /** Where the host answers guests on the channel. */
  inboxUrl: string;
  /** Turns a feed event into reservation fields. */
  classifyEvent(event: CalendarEvent): {
    kind: "reservation" | "block";
    channelInfo: string;
  };
  pushContent?(listingUrl: string, content: ListingContent): Promise<void>;
  sendMessage?(externalThreadId: string, body: string): Promise<void>;
};

export type ListingContent = {
  title: string;
  description: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  basePrice: number;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  houseRules: string;
};

const airbnb: ChannelAdapter = {
  id: "airbnb",
  label: "Airbnb",
  capabilities: { content: false, messaging: false },
  calendarHelp: "Airbnb → Calendar → Availability → Connect calendars",
  inboxUrl: "https://www.airbnb.com/hosting/messages",
  classifyEvent(event) {
    // Airbnb exports "Reserved" for bookings and "Airbnb (Not available)"
    // for dates the host blocked by hand.
    const kind = /reserved/i.test(event.summary) ? "reservation" : "block";
    const link = /https?:\/\/\S*reservations\/details\/\S+/i.exec(event.description)?.[0];
    const phone = /Phone Number \(Last 4 Digits\):\s*(\d{4})/i.exec(event.description)?.[1];
    const info = [link, phone && `Phone ends in ${phone}`].filter(Boolean).join("\n");
    return { kind, channelInfo: info };
  },
};

const booking: ChannelAdapter = {
  id: "booking",
  label: "Booking.com",
  capabilities: { content: false, messaging: false },
  calendarHelp: "Booking.com extranet → Rates & Availability → Sync calendars",
  inboxUrl: "https://admin.booking.com/",
  classifyEvent() {
    // Booking.com exports every unavailable night as "CLOSED - Not available",
    // whether a guest booked it or the host closed it. Treat it as closed dates;
    // the browser extension turns it into a reservation once it finds the
    // matching reservation number.
    return { kind: "block", channelInfo: "Closed on Booking.com: a booking or dates you closed" };
  },
};

export const CHANNELS: Record<OtaChannel, ChannelAdapter> = { airbnb, booking };

export function sourceLabel(source: Source): string {
  return source === "direct" ? "Direct" : CHANNELS[source].label;
}
