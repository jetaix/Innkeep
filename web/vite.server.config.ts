import { defineConfig } from "vite";

/**
 * Builds the server: the API and, for a machine of your own, the process
 * that also serves the pages and keeps the calendars in sync.
 *
 * Everything is bundled into one file per entry, so running Innkeep needs no
 * second install. The database driver stays outside: it ships a compiled
 * binary for the machine it is installed on.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("../src", import.meta.url).pathname,
      // The package throws unless Next.js imports it; the code it guards only ever runs on the server here.
      "server-only": new URL("./server/server-only.ts", import.meta.url).pathname,
    },
  },
  ssr: { noExternal: true, external: ["@libsql/client"] },
  // The pages' own files are served from `dist`; the server needs no copy.
  publicDir: false,
  build: {
    ssr: true,
    target: "node22",
    outDir: "dist-server",
    emptyOutDir: true,
    rollupOptions: {
      // One shared file still asks Next.js which data a request may see; here every request is told, so it is never loaded.
      external: [/^next\//],
      input: { serve: "server/serve.ts", vercel: "server/vercel.ts" },
      output: { entryFileNames: "[name].js", chunkFileNames: "chunks/[name]-[hash].js" },
    },
  },
});
