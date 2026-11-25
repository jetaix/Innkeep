"use server";

import { redirect } from "next/navigation";
import { applied, fields } from "@/lib/form";
import * as change from "./mutations";

export async function createReservation(returnTo: string, form: FormData) {
  if (await applied(() => change.createReservation(fields(form)))) redirect(returnTo);
}

export async function updateReservation(id: number, returnTo: string, form: FormData) {
  if (await applied(() => change.updateReservation(id, fields(form)))) redirect(returnTo);
}

export async function deleteReservation(id: number, returnTo: string) {
  await change.deleteReservation(id);
  redirect(returnTo);
}
