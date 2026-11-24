import type { MetadataRoute } from "next";
import { siteUrl, takesAccessRequests } from "@/config/site";
import { ALTERNATIVES, CHECKED_ON } from "@/features/marketing/alternatives";
import { GUIDE_SLUGS, GUIDES_UPDATED_ON } from "@/features/marketing/guides";

/** The public pages, for the public website only; a running Innkeep lists nothing. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!takesAccessRequests) return [];
  return [
    { url: `${siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/alternatives`, lastModified: CHECKED_ON, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/design`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/ai`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/guides`, lastModified: GUIDES_UPDATED_ON, changeFrequency: "monthly", priority: 0.8 },
    ...GUIDE_SLUGS.map((slug) => ({
      url: `${siteUrl}/guides/${slug}`,
      lastModified: GUIDES_UPDATED_ON,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...ALTERNATIVES.map((alternative) => ({
      url: `${siteUrl}/alternatives/${alternative.slug}`,
      lastModified: CHECKED_ON,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
