"use server";

import { refresh } from "next/cache";
import { hostOnly } from "@/db";
import { getLocale } from "@/i18n/server";
import * as change from "./mutations";

export type { ConnectState } from "./mutations";

export async function connectClaude(
  _previous: change.ConnectState,
  form: FormData,
): Promise<change.ConnectState> {
  await hostOnly();
  const state = await change.connectClaude(form.get("apiKey"), await getLocale());
  if (state.connected) refresh();
  return state;
}

export async function disconnectClaude() {
  await hostOnly();
  await change.disconnectClaude();
  refresh();
}
