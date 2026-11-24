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

/**
 * The public website presents the hosted version and takes early-access
 * requests for it. A copy of Innkeep running for a host shows the dashboard instead.
 */
export const takesAccessRequests = landingOnly;

/** The public address of this instance. On Vercel the production address is known without configuration. */
export const siteUrl = (
  process.env.APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/$/, "");

/** The brand's glass colours, for the places CSS variables do not reach (icons, link previews). */
export const brand = {
  ground: "#f3f4ef",
  ink: "#15171c",
  muted: "#555a61",
  coral: "#ff5d73",
  blue: "#3d6df2",
  green: "#10a88f",
  overlap: "#4b2bbd",
} as const;
