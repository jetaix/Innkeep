import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Sent with every page. The referrer policy keeps sending the origin, which
  // the browser extension uses to recognise a tab opened from Innkeep.
  // Pages that became sections of another page: old links and bookmarks still land in the right place.
  async redirects() {
    return [
      { source: "/assistant", destination: "/suggestions#claude", permanent: false },
      { source: "/data", destination: "/settings?tab=data", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
