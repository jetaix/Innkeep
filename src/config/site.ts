export const site = {
  name: "Innkeep",
  tagline: "The open-source channel manager for hosts with one or two places",
  description:
    "Innkeep keeps your Airbnb and Booking.com calendars in sync, shows what you will earn after costs and tells you what to fix. Free, open source and self-hosted.",
  repo: "https://github.com/jetaix/Innkeep",
  license: "MIT",
} as const;

/**
 * True when only the public pages are published (see `src/proxy.ts`): links
 * into the dashboard are then left out, since there is no dashboard to open.
 */
export const landingOnly = process.env.LANDING_ONLY === "1";
