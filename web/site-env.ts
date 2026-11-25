/**
 * What the public pages need to know about this deployment, read once at
 * build from the same variables the server reads, so the static pages, the
 * app and the files written for search engines all agree.
 */
const landingOnly = process.env.LANDING_ONLY === "1";
const demo = !landingOnly && process.env.PUBLIC_DEMO === "1" && Boolean(process.env.APP_PASSWORD);

export const siteEnv = {
  url: (
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:5173")
  ).replace(/\/$/, ""),
  /** Only the public pages are published; there is no dashboard to open. */
  landingOnly,
  /** Visitors who are not signed in get a dashboard on sample data. */
  demo,
  /** The public website presents the hosted version and takes early-access requests for it. */
  takesAccess: landingOnly || demo,
};
