import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "./config";
import { createFormat } from "./format";
import { MESSAGES } from "./messages";

/**
 * The language for this request: the host's own choice if they made one,
 * otherwise the first language their browser asks for that Innkeep speaks.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  const accepted = (await headers()).get("accept-language") ?? "";
  for (const part of accepted.split(",")) {
    const language = part.trim().slice(0, 2).toLowerCase();
    const match = LOCALES.find((locale) => locale === language);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
});

/**
 * Everything a server component needs to speak the host's language:
 * `m` holds the words, `fmt` writes dates and amounts.
 */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, m: MESSAGES[locale], fmt: createFormat(locale) };
});
