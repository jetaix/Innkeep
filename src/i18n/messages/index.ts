import type { Locale } from "../config";
import { common } from "./common";
import { overview } from "./overview";
import { calendar } from "./calendar";
import { reservations } from "./reservations";
import { revenue } from "./revenue";
import { pricing } from "./pricing";
import { insights } from "./insights";
import { assistant } from "./assistant";
import { inbox } from "./inbox";
import { reviews } from "./reviews";
import { properties } from "./properties";
import { preview } from "./preview";
import { settings } from "./settings";
import { data } from "./data";
import { extension } from "./extension";
import { marketing } from "./marketing";

/**
 * One file per area of the app, each holding English and French side by side
 * so a missing translation is a type error, not a blank on screen.
 */
const AREAS = {
  common,
  overview,
  calendar,
  reservations,
  revenue,
  pricing,
  insights,
  assistant,
  inbox,
  reviews,
  properties,
  preview,
  settings,
  data,
  extension,
  marketing,
};

type Area = keyof typeof AREAS;
export type Messages = { [K in Area]: (typeof AREAS)[K]["en"] };

const pick = (locale: Locale) =>
  Object.fromEntries(Object.entries(AREAS).map(([name, area]) => [name, area[locale]])) as Messages;

export const MESSAGES: Record<Locale, Messages> = { en: pick("en"), fr: pick("fr") };
