import type { MetadataRoute } from "next";
import { landingOnly, siteUrl } from "@/config/site";
import { ALTERNATIVES, CHECKED_ON } from "@/features/marketing/alternatives";

/** The public pages, for the public website only; a running Innkeep lists nothing. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!landingOnly) return [];
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/alternatives`, lastModified: CHECKED_ON, changeFrequency: "monthly", priority: 0.8 },
    ...ALTERNATIVES.map((alternative) => ({
      url: `${siteUrl}/alternatives/${alternative.slug}`,
      lastModified: CHECKED_ON,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
