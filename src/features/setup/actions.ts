"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getExtensionStatus } from "@/features/extension/status";
import * as change from "@/features/properties/mutations";
import { fields, InvalidInput, parse } from "@/lib/form";
import { connectCalendars as saveCalendars } from "./mutations";
import { getSetupProgress } from "./queries";

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
  const { unreadable } = await saveCalendars(id, fields(form));
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
  return getSetupProgress();
}
