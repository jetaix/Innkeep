import type { ChargeCategory, ChargeFrequency, OtaChannel } from "@/db/schema";

/**
 * The fixed lists the pages offer as choices. They repeat the ones in
 * `src/db/schema.ts`, because importing that file would bring the database
 * library into the browser; `Whole` makes a list that falls behind its type
 * fail the type check.
 */
type Whole<All extends string, List extends readonly All[]> = [All] extends [List[number]] ? List : never;
const whole =
  <All extends string>() =>
  <const List extends readonly All[]>(list: Whole<All, List>) =>
    list;

export const OTA_CHANNELS = whole<OtaChannel>()(["airbnb", "booking"]);

export const CHARGE_FREQUENCIES = whole<ChargeFrequency>()([
  "once",
  "monthly",
  "yearly",
  "per_stay",
  "per_night",
  "percent",
]);

export const CHARGE_CATEGORIES = whole<ChargeCategory>()([
  "cleaning",
  "commission",
  "utilities",
  "subscription",
  "maintenance",
  "tax",
  "other",
]);
