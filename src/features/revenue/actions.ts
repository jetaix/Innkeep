"use server";

import { refresh } from "next/cache";
import { applied, fields } from "@/lib/form";
import * as change from "./mutations";

export async function addCharge(form: FormData) {
  if (await applied(() => change.addCharge(fields(form)))) refresh();
}

export async function deleteCharge(id: number) {
  await change.deleteCharge(id);
  refresh();
}
