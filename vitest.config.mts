import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "web/server/server-only.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "extension/**/*.test.ts", "web/server/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
  },
});
