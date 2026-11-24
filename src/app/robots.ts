import type { MetadataRoute } from "next";
import { siteUrl, takesAccessRequests } from "@/config/site";

/**
 * The public website is for everyone to find. A running Innkeep holds a
 * host's bookings: it asks search engines to stay away altogether.
 */
export default function robots(): MetadataRoute.Robots {
  if (!takesAccessRequests) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    // With a public demo the dashboard is reachable too; only the public pages are worth finding.
    rules: { userAgent: "*", allow: ["/$", "/alternatives", "/guides", "/ai", "/design"], disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
