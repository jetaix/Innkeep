import fs from "node:fs";
import path from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { landingOnly, MOVED, PUBLIC_PAGES, SECURITY_HEADERS, SERVER_PATHS } from "./pages";

/**
 * Innkeep as one process, for a machine of your own: the pages, the API and
 * the background sync. Started by `npm run app`, `start.command`, `start.bat`
 * and the Docker image, from the repository's folder.
 *
 * The settings file is read first, before any code that looks at it loads.
 */
for (const file of [".env.local", ".env"]) {
  // A variable already set (by Docker, or on the command line) wins over the file.
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

const dist = path.join(import.meta.dirname, "..", "dist");
if (!fs.existsSync(path.join(dist, "_shell.html"))) {
  console.error("\n  Innkeep has not been built yet. Run `npm run build`, then start again.\n");
  process.exit(1);
}
const shell = fs.readFileSync(path.join(dist, "_shell.html"), "utf8");

const { server } = await import("./app");
const { startBackground } = await import("./background");

const site = new Hono();

site.use("*", async (c, next) => {
  await next();
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) c.header(name, value);
});

for (const page of MOVED) site.get(page.from, (c) => c.redirect(page.to, 307));

site.all("*", async (c, next) => (SERVER_PATHS.test(c.req.path) ? server.fetch(c.req.raw) : next()));

// Files carry a hash of their content in their name: a browser may keep them for good.
site.use("/assets/*", async (c, next) => {
  await next();
  if (c.res.ok) c.header("Cache-Control", "public, max-age=31536000, immutable");
});
// The design file is Markdown, meant to be read in the browser, not downloaded.
site.use("/design.md", async (c, next) => {
  await next();
  if (c.res.ok) c.header("Content-Type", "text/markdown; charset=utf-8");
});
site.use("*", serveStatic({ root: path.relative(process.cwd(), dist) || "." }));

// Any other address is a page of the app: it starts from the empty shell and draws itself.
site.get("*", (c) => {
  if (landingOnly() && !PUBLIC_PAGES.test(c.req.path)) return c.redirect("/", 307);
  // A file that does not exist is not a page.
  if (/\.[a-z0-9]+$/i.test(c.req.path)) return c.notFound();
  return c.html(shell, 200, { "Cache-Control": "no-cache" });
});

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME_BIND ?? "0.0.0.0";
serve({ fetch: site.fetch, port, hostname }, () => {
  console.log(`  Innkeep is running at http://localhost:${port}`);
  void startBackground();
});
