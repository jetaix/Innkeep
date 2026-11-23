import type { MetadataRoute } from "next";
import { landingOnly, siteUrl } from "@/config/site";

/**
 * The public website is for everyone to find. A running Innkeep holds a
 * host's bookings: it asks search engines to stay away altogether.
 */
export default function robots(): MetadataRoute.Robots {
  return landingOnly
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
