/**
 * The guides published under `/guides`. The text of each one lives in
 * `src/i18n/messages/guides.ts`, keyed by `slug`, in both languages.
 */
export const GUIDE_SLUGS = [
  "sync-airbnb-booking-calendars",
  "avoid-double-bookings",
  "free-channel-manager-small-hosts",
  "rental-income-after-costs",
] as const;

export type GuideSlug = (typeof GUIDE_SLUGS)[number];

/** The day the guides were last reviewed against the platforms' own screens. */
export const GUIDES_UPDATED_ON = "2026-11-24";

export const isGuide = (slug: string): slug is GuideSlug => (GUIDE_SLUGS as readonly string[]).includes(slug);
