/** Languages the interface is written in. English is the source; the others mirror its shape. */
export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "innkeep-locale";

/** Each language in its own words, for the switch. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", fr: "Français" };

/** The regional format used for dates and amounts in each language. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-GB", fr: "fr-FR" };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Theme choice kept in the browser; absent means "follow the system". */
export const THEME_KEY = "innkeep-theme";
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
