/** Which renderer this build uses: set in `vite.config.ts`. */
declare const __RENDERER__: "redact" | "react-dom";

declare module "virtual:stylex:runtime";

/** What the public pages know about this deployment: set in `vite.config.ts`. */
declare const __SITE__: { url: string; landingOnly: boolean; demo: boolean; takesAccess: boolean };
