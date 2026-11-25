import { use, useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";
import { createFormat, type Format } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { common } from "@/i18n/messages/common";
import { demo } from "@/i18n/messages/demo";

/**
 * The words of the interface, in the host's language.
 *
 * The language is the host's own choice if they made one (a cookie, so the
 * server can read it too), otherwise the first language their browser asks
 * for that Innkeep speaks.
 *
 * The shell's words come with the app. Every other area of
 * `src/i18n/messages` is downloaded the first time a page asks for it, so
 * the calendar's text is not paid for on the overview. A route names its
 * areas twice: in its loader with `loadMessages`, so the text downloads
 * beside the data, and in its components with `useI18n`.
 */
const AREAS = {
  overview: () => import("@/i18n/messages/overview").then((file) => file.overview),
  calendar: () => import("@/i18n/messages/calendar").then((file) => file.calendar),
  reservations: () => import("@/i18n/messages/reservations").then((file) => file.reservations),
  cleaning: () => import("@/i18n/messages/cleaning").then((file) => file.cleaning),
  revenue: () => import("@/i18n/messages/revenue").then((file) => file.revenue),
  pricing: () => import("@/i18n/messages/pricing").then((file) => file.pricing),
  insights: () => import("@/i18n/messages/insights").then((file) => file.insights),
  assistant: () => import("@/i18n/messages/assistant").then((file) => file.assistant),
  reviews: () => import("@/i18n/messages/reviews").then((file) => file.reviews),
  properties: () => import("@/i18n/messages/properties").then((file) => file.properties),
  preview: () => import("@/i18n/messages/preview").then((file) => file.preview),
  settings: () => import("@/i18n/messages/settings").then((file) => file.settings),
  data: () => import("@/i18n/messages/data").then((file) => file.data),
  extension: () => import("@/i18n/messages/extension").then((file) => file.extension),
  auth: () => import("@/i18n/messages/auth").then((file) => file.auth),
} satisfies { [A in keyof Messages]?: () => Promise<Record<Locale, Messages[A]>> };

/** An area that is downloaded when first needed. */
export type Area = keyof typeof AREAS;
type Both<A extends Area> = Record<Locale, Messages[A]>;

const ready = new Map<Area, Both<Area>>();
const loading = new Map<Area, Promise<Both<Area>>>();

function load<A extends Area>(area: A): Promise<Both<A>> {
  let promise = loading.get(area);
  if (!promise) {
    promise = (AREAS[area]() as Promise<Both<Area>>).then((both) => {
      ready.set(area, both);
      return both;
    });
    loading.set(area, promise);
  }
  return promise as Promise<Both<A>>;
}

/** Starts downloading the text of these areas. Call it from a route's loader. */
export function loadMessages(...areas: Area[]): Promise<unknown> {
  return Promise.all(areas.map(load));
}

const listeners = new Set<() => void>();

/** The language in use right now, for code outside a component (a route's loader). */
export function currentLocale(): Locale {
  const chosen = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`))?.[1];
  if (isLocale(chosen)) return chosen;
  for (const tag of navigator.languages) {
    const match = LOCALES.find((locale) => locale === tag.slice(0, 2).toLowerCase());
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

/** Remembers the host's language for a year and redraws the page in it. */
export function setLocale(locale: Locale) {
  // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not in every browser Innkeep supports
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  document.documentElement.lang = locale;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, currentLocale, () => DEFAULT_LOCALE);
}

const formats = new Map<Locale, Format>();
function formatFor(locale: Locale): Format {
  let format = formats.get(locale);
  if (!format) {
    format = createFormat(locale);
    formats.set(locale, format);
  }
  return format;
}

type Shell = Pick<Messages, "common" | "demo">;

/**
 * Everything a component needs to speak the host's language: `m` holds the
 * words (the shell's, plus the areas named), `fmt` writes dates and amounts.
 * Waits, inside the nearest `<Suspense>`, for an area that is still on its way.
 */
export function useI18n<A extends Area = never>(
  ...areas: A[]
): { locale: Locale; fmt: Format; m: Shell & Pick<Messages, A> } {
  const locale = useLocale();
  const m: Record<string, unknown> = { common: common[locale], demo: demo[locale] };
  for (const area of areas) {
    const both = (ready.get(area) ?? use(load(area))) as Both<A>;
    m[area] = both[locale];
  }
  return { locale, fmt: formatFor(locale), m: m as Shell & Pick<Messages, A> };
}

// The page's own language, for assistive technology and hyphenation.
document.documentElement.lang = currentLocale();
