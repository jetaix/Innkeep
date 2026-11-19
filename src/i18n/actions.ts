"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE } from "./config";

/** Remembers the host's language for a year and redraws the page in it. */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  refresh();
}
