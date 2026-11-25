"use server";

import { getLocale } from "@/i18n/server";
import { type AccessState, requestAccess as request } from "./mutations";

export type { AccessState };

export async function requestAccess(_previous: AccessState, form: FormData): Promise<AccessState> {
  return request({ email: form.get("email"), company: form.get("company") ?? undefined }, await getLocale());
}
