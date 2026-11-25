"use server";

import { refresh } from "next/cache";
import { getLocale } from "@/i18n/server";
import * as change from "./mutations";

export type { AdviceState } from "./mutations";

export async function dismissSuggestion(key: string) {
  await change.dismissSuggestion(key);
  refresh();
}

export async function restoreSuggestions() {
  await change.restoreSuggestions();
  refresh();
}

/** Asks the model for advice and stores it, so the page can show it without another call. */
export async function requestAdvice(): Promise<change.AdviceState> {
  const state = await change.requestAdvice(await getLocale());
  if (!state.error) refresh();
  return state;
}
