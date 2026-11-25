/**
 * What a host answers for an address that is not a file and not the API.
 * Shared by the two ways Innkeep is served: the process in `serve.ts` and the
 * routing table written for Vercel, so both send a visitor to the same place.
 */

/** Sent with every answer. The referrer policy keeps sending the origin, which the browser extension uses to recognise a tab opened from Innkeep. */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
} as const;

/** Pages that became sections of another page: old links and bookmarks still land in the right place. */
export const MOVED = [
  { from: "/assistant", to: "/suggestions#claude" },
  { from: "/data", to: "/settings?tab=data" },
] as const;

/** The addresses the server itself answers; every other one is a page or a file. */
export const SERVER_PATHS = /^\/(?:api\/.*|extension\/start)$/;

/** With `LANDING_ONLY=1`, the only pages there are. Anything else leads back to the home page. */
export const PUBLIC_PAGES = /^\/(?:(?:alternatives|guides)(?:\/[a-z0-9-]+)?|ai|design)?\/?$/;

export const landingOnly = () => process.env.LANDING_ONLY === "1";
