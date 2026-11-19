import { exportEvents, findPropertyByToken } from "@/channels/sync";
import { OTA_CHANNELS, type OtaChannel } from "@/db";
import { generateICal } from "@/lib/ical";

/**
 * Public availability feed for one property, imported by the channels:
 *   /api/ical/<token>/airbnb.ics   → everything Airbnb does not know about
 *   /api/ical/<token>/booking.ics  → everything Booking.com does not know about
 *   /api/ical/<token>/all.ics      → every stay (for Google Calendar, cleaners…)
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/ical/[token]/[file]">) {
  const { token, file } = await ctx.params;
  const target = file.replace(/\.ics$/i, "");
  if (target !== "all" && !(OTA_CHANNELS as readonly string[]).includes(target)) {
    return new Response("Not found", { status: 404 });
  }

  const property = findPropertyByToken(token);
  if (!property) return new Response("Not found", { status: 404 });

  const body = generateICal(property.name, exportEvents(property.id, target as OtaChannel | "all"));
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
