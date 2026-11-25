import fs from "node:fs";
import path from "node:path";
import { siteEnv } from "../site-env";

/**
 * Runs after the two builds. Writes each public page to `dist/<path>/index.html`
 * and the files search engines and phones ask for: `robots.txt`, `sitemap.xml`,
 * the web app manifest and the design file.
 *
 * The empty shell every other address starts from is kept as `dist/_shell.html`:
 * the host serves it for any path that is not a file (see the deployment config).
 */
const web = path.join(import.meta.dirname, "..");
const dist = path.join(web, "dist");
const { PAGES, render, site, brand } = (await import(
  path.join(web, "dist-ssr", "prerender.js")
)) as typeof import("../src/prerender");

const shell = fs.readFileSync(path.join(dist, "index.html"), "utf8");
if (!shell.includes('<div id="app"></div>') || !shell.includes("</head>")) {
  throw new Error("index.html no longer has the empty #app and the head this script fills");
}
fs.writeFileSync(path.join(dist, "_shell.html"), shell);

for (const page of PAGES) {
  const { head, body } = await render(page.path);
  // A page that suspended would be written as its placeholder: refuse it.
  if (!body.includes("<main")) throw new Error(`${page.path} rendered without its content`);
  const html = shell
    .replace("</head>", `    ${head}\n  </head>`)
    .replace('<div id="app"></div>', `<div id="app">${body}</div>`);
  const file = path.join(dist, page.path, "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`${(html.length / 1000).toFixed(1).padStart(7)} kB  ${page.path}`);
}

/*
 * The public website is for everyone to find. A running Innkeep holds a
 * host's bookings: it asks search engines to stay away altogether.
 */
const robots = siteEnv.takesAccess
  ? [
      "User-agent: *",
      // With a public demo the dashboard is reachable too; only the public pages are worth finding.
      ...["/$", "/alternatives", "/guides", "/ai", "/design"].map((allowed) => `Allow: ${allowed}`),
      "Disallow: /",
      "",
      `Sitemap: ${siteEnv.url}/sitemap.xml`,
    ]
  : ["User-agent: *", "Disallow: /"];
fs.writeFileSync(path.join(dist, "robots.txt"), `${robots.join("\n")}\n`);

/** The public pages, for the public website only; a running Innkeep lists nothing. */
const urls = (siteEnv.takesAccess ? PAGES : []).map((page) =>
  [
    "  <url>",
    `    <loc>${siteEnv.url}${page.path}</loc>`,
    ...(page.lastModified ? [`    <lastmod>${page.lastModified}</lastmod>`] : []),
    "    <changefreq>monthly</changefreq>",
    `    <priority>${page.priority}</priority>`,
    "  </url>",
  ].join("\n"),
);
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);

/** Lets a phone or computer install Innkeep and open it like an app, on the dashboard. */
fs.writeFileSync(
  path.join(dist, "manifest.webmanifest"),
  JSON.stringify(
    {
      name: site.name,
      short_name: site.name,
      description: site.description,
      start_url: siteEnv.landingOnly ? "/" : "/overview",
      scope: "/",
      display: "standalone",
      background_color: brand.ground,
      theme_color: brand.ground,
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    null,
    2,
  ),
);

// The design file itself, as Markdown, for people and tools that want the source.
fs.copyFileSync(path.join(web, "..", "DESIGN.md"), path.join(dist, "design.md"));
