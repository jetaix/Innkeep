"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { OTA_CHANNELS } from "@/db";
import { getExtensionStatus, getLastUpdate } from "@/features/extension/status";
import * as change from "@/features/properties/mutations";
import { fields, InvalidInput, parse, text } from "@/lib/form";
import { getSetupProperty } from "./queries";

const propertyId = z.number().int().positive();
const step = (name: string, id: number, extra = "") => `/properties/new?step=${name}&id=${id}${extra}`;

/** Step 2: the name creates the property, and the guide goes on with it. */
export async function nameProperty(form: FormData) {
  let id: number;
  try {
    id = await change.createProperty(fields(form));
  } catch (error) {
    if (error instanceof InvalidInput) return;
    throw error;
  }
  redirect(step("calendars", id));
}

/** Step 3: saves the links that were filled in, and stays on the step when one cannot be read. */
export async function connectCalendars(rawId: number, form: FormData) {
  const id = parse(propertyId, rawId);
  const links = parse(
    z.object(Object.fromEntries(OTA_CHANNELS.map((channel) => [channel, text]))),
    fields(form),
  );
  for (const channel of OTA_CHANNELS) {
    if (links[channel]) await change.saveCalendarLink(id, channel, links[channel]);
  }
  const saved = await getSetupProperty(id);
  const unreadable = saved?.listings.some((listing) => listing.icalUrl && listing.lastSyncError);
  redirect(unreadable ? step("calendars", id, "&problem=1") : step("extension", id));
}

/** Step 4: "I've added the extension" only goes on once the extension has really called. */
export async function confirmExtension(rawId: number) {
  const id = parse(propertyId, rawId);
  const { state } = await getExtensionStatus();
  redirect(
    state === "ready"
      ? step("read", id)
      : step("extension", id, `&check=${state === "outdated" ? "outdated" : "waiting"}`),
  );
}

/** Asked every few seconds by a waiting step: has the extension connected, and when did it last read reservations? */
export async function setupProgress() {
  const [{ state }, ...read] = await Promise.all([
    getExtensionStatus(),
    ...OTA_CHANNELS.map((channel) => getLastUpdate(channel)),
  ]);
  return { extension: state === "ready", readAt: Math.max(0, ...read.map((last) => last?.at ?? 0)) };
}
