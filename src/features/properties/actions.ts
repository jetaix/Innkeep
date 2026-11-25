"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { applied, fields } from "@/lib/form";
import * as change from "./mutations";

export async function updateProperty(id: number, form: FormData) {
  if (await applied(() => change.updateProperty(id, fields(form)))) refresh();
}

export async function deleteProperty(id: number) {
  await change.deleteProperty(id);
  redirect("/properties");
}

export async function saveListing(propertyId: number, channel: string, form: FormData) {
  if (await applied(() => change.saveListing(propertyId, channel, fields(form)))) refresh();
}

export async function syncListingAction(listingId: number) {
  await change.syncOne(listingId);
  refresh();
}

/** Called when the dashboard is opened or comes back into view. Returns whether anything was refreshed. */
export async function syncIfStale(): Promise<boolean> {
  const synced = await change.syncIfStale();
  if (synced) refresh();
  return synced;
}

export async function syncAllAction() {
  await change.syncEverything();
  refresh();
}

export async function markPublished(listingId: number) {
  if (await change.markPublished(listingId)) refresh();
}

export async function loadDemoData() {
  await change.loadSampleData();
  redirect("/overview");
}

export async function removeSampleDataAction() {
  await change.clearSampleData();
  redirect("/overview");
}
