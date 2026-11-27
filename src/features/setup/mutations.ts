import { z } from "zod";
import { OTA_CHANNELS } from "@/db";
import * as change from "@/features/properties/mutations";
import { parse, text } from "@/lib/form";
import { getSetupProperty } from "./queries";

/**
 * What the "Add a property" guide changes. Called by the API; no framework in here.
 */
const propertyId = z.number().int().positive();
const links = z.object(Object.fromEntries(OTA_CHANNELS.map((channel) => [channel, text.default("")])));

/**
 * Step 3: saves the calendar links that were filled in, each read straight
 * away. Says whether one of the saved links could not be read.
 */
export async function connectCalendars(rawId: unknown, input: unknown): Promise<{ unreadable: boolean }> {
  const id = parse(propertyId, rawId);
  const sent = parse(links, input);
  for (const channel of OTA_CHANNELS) {
    if (sent[channel]) await change.saveCalendarLink(id, channel, sent[channel]);
  }
  const saved = await getSetupProperty(id);
  return {
    unreadable: Boolean(saved?.listings.some((listing) => listing.icalUrl && listing.lastSyncError)),
  };
}
