import { describe, expect, it } from "vitest";
import { CHANNELS } from "@/channels";
import { generateICal, parseICal } from "./ical";

const AIRBNB = [
  "BEGIN:VCALENDAR",
  "PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 0.8.8//EN",
  "CALSCALE:GREGORIAN",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20270108",
  "DTSTART;VALUE=DATE:20270104",
  "UID:1418fb94e984-abc@airbnb.com",
  "DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/",
  " details/HMABCD1234\\nPhone Number (Last 4 Digits): 4821",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20270212",
  "DTSTART;VALUE=DATE:20270210",
  "UID:7f662ec65913-def@airbnb.com",
  "SUMMARY:Airbnb (Not available)",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("parseICal", () => {
  it("reads an Airbnb feed, unfolding and unescaping long lines", () => {
    const events = parseICal(AIRBNB);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      uid: "1418fb94e984-abc@airbnb.com",
      start: "2027-01-04",
      end: "2027-01-08",
      summary: "Reserved",
    });
    expect(events[0].description).toBe(
      "Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMABCD1234\nPhone Number (Last 4 Digits): 4821",
    );
  });

  it("keeps the date part of date-time values and defaults a missing end to one night", () => {
    const events = parseICal(
      "BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:a\nDTSTART:20270301T150000Z\nDTEND:20270303T100000Z\nEND:VEVENT\n" +
        "BEGIN:VEVENT\nUID:b\nDTSTART;VALUE=DATE:20270310\nEND:VEVENT\nEND:VCALENDAR",
    );
    expect(events.map((e) => [e.start, e.end])).toEqual([
      ["2027-03-01", "2027-03-03"],
      ["2027-03-10", "2027-03-11"],
    ]);
  });

  it("rejects something that is not a calendar", () => {
    expect(() => parseICal("<html>Sign in</html>")).toThrow(/iCalendar/);
  });
});

describe("generateICal", () => {
  it("round-trips events, including text that needs escaping and folding", () => {
    const events = [
      {
        uid: "innkeep-1@innkeep",
        start: "2027-05-01",
        end: "2027-05-04",
        summary: "Reserved (Booking.com); late, arrival",
        description: "x".repeat(200),
      },
    ];
    const text = generateICal("Canal Loft", events);
    expect(text.split("\r\n").every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true);
    expect(parseICal(text)).toEqual(events);
  });
});

describe("channel adapters", () => {
  it("tells Airbnb reservations from manual blocks and extracts booking details", () => {
    const [reserved, blocked] = parseICal(AIRBNB).map(CHANNELS.airbnb.classifyEvent);
    expect(reserved.kind).toBe("reservation");
    expect(reserved.channelInfo).toContain("HMABCD1234");
    expect(reserved.channelInfo).toContain("Phone ends in 4821");
    expect(blocked.kind).toBe("block");
  });
});
