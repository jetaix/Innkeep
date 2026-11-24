import type { MetadataRoute } from "next";
import { brand, landingOnly, site } from "@/config/site";

/** Lets a phone or computer install Innkeep and open it like an app, on the dashboard. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: landingOnly ? "/" : "/overview",
    scope: "/",
    display: "standalone",
    background_color: brand.ground,
    theme_color: brand.ground,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
