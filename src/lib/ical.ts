import { addDays, isISODate, type ISODate } from "./dates";

/**
 * Minimal iCalendar (RFC 5545) reader/writer covering what Airbnb and
 * Booking.com availability feeds use: VEVENTs with a start, an end, a UID,
 * a summary and sometimes a description.
 */
export type CalendarEvent = {
  uid: string;
  start: ISODate;
  /** Exclusive end date (the check-out day). */
  end: ISODate;
  summary: string;
  description: string;
};

function unfold(text: string): string[] {
  const lines: string[] = [];
  for (const raw of text.split(/\r\n|\n|\r/)) {
    if ((raw.startsWith(" ") || raw.startsWith("\t")) && lines.length > 0) {
      lines[lines.length - 1] += raw.slice(1);
    } else {
      lines.push(raw);
    }
  }
  return lines;
}

function unescapeText(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, c: string) => (c === "n" || c === "N" ? "\n" : c));
}

function escapeText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Accepts `20260704`, `20260704T150000` and `20260704T150000Z`; keeps the date part. */
function parseDateValue(value: string): ISODate | null {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value.trim());
  if (!match) return null;
  const iso = `${match[1]}-${match[2]}-${match[3]}`;
  return isISODate(iso) ? iso : null;
}

export function parseICal(text: string): CalendarEvent[] {
  if (!/BEGIN:VCALENDAR/i.test(text)) {
    throw new Error("Not an iCalendar feed (missing BEGIN:VCALENDAR)");
  }

  const events: CalendarEvent[] = [];
  let current: Record<string, string> | null = null;

  for (const line of unfold(text)) {
    const upper = line.trim().toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (upper === "END:VEVENT") {
      if (current) {
        const start = parseDateValue(current.DTSTART ?? "");
        const end = parseDateValue(current.DTEND ?? "");
        if (start) {
          // A missing or zero-length end means a single night.
          const safeEnd = end && end > start ? end : addDays(start, 1);
          events.push({
            uid: current.UID?.trim() || `${start}/${safeEnd}`,
            start,
            end: safeEnd,
            summary: unescapeText(current.SUMMARY ?? "").trim(),
            description: unescapeText(current.DESCRIPTION ?? "").trim(),
          });
        }
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    // "DTSTART;VALUE=DATE" -> "DTSTART"
    const name = line.slice(0, colon).split(";")[0].trim().toUpperCase();
    current[name] = line.slice(colon + 1);
  }

  return events;
}

/** Folds a content line to 75 octets as required by RFC 5545. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let chunk = "";
  let size = 0;
  for (const char of line) {
    const charSize = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // continuation lines start with a space
    if (size + charSize > limit) {
      parts.push(chunk);
      chunk = "";
      size = 0;
    }
    chunk += char;
    size += charSize;
  }
  parts.push(chunk);
  return parts.join("\r\n ");
}

const compact = (date: ISODate) => date.replaceAll("-", "");

export function generateICal(calendarName: string, events: CalendarEvent[]): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Innkeep//Calendar Sync//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(event.start)}`,
      `DTEND;VALUE=DATE:${compact(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
    );
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
