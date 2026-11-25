import babel from "@rolldown/plugin-babel";
import stylex from "@stylexjs/unplugin";
import { redact } from "@tanstack/redact/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { siteEnv } from "./site-env.ts";

/**
 * Redact is the default browser renderer. `RENDERER=react-dom` builds the
 * same commit on React DOM, so the two can be compared before a release.
 */
const renderer = process.env.RENDERER === "react-dom" ? "react-dom" : "redact";

export default defineConfig({
  // The order matters: routes are split first, styles extracted before React compiles.
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    stylex.vite({ runtimeInjection: false }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    ...(renderer === "redact" ? [redact({ environments: ["client"] })] : []),
  ],
  resolve: {
    alias: {
      "~": new URL("./src", import.meta.url).pathname,
      // What the two apps share until cutover: texts, formats, the menu, pure logic.
      "@": new URL("../src", import.meta.url).pathname,
    },
  },
  define: { __RENDERER__: JSON.stringify(renderer), __SITE__: JSON.stringify(siteEnv) },
  build: { manifest: true, target: "es2023" },
  server: { port: 5173, proxy: { "/api": "http://localhost:3001" } },
});
