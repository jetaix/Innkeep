import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { MOVED, SECURITY_HEADERS } from "../server/pages";

/**
 * Lays the build out the way Vercel deploys it (its Build Output API, version 3):
 * the pages as static files, the API as one function, and the table that says
 * which address goes where. Run on Vercel after the build, by `vercel.json`.
 */
const web = path.join(import.meta.dirname, "..");
const root = path.join(web, "..");
const out = path.join(root, ".vercel", "output");
const dist = path.join(web, "dist");
const landingOnly = process.env.LANDING_ONLY === "1";

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(dist, path.join(out, "static"), { recursive: true });

/** Every page written to its own `index.html` at build: the public pages. */
const prerendered = (fs.readdirSync(dist, { recursive: true }) as string[])
  .filter((file) => path.basename(file) === "index.html" && file !== "index.html")
  .map((file) => `/${path.dirname(file).split(path.sep).join("/")}`);

const routes: object[] = [
  { src: "/(.*)", headers: SECURITY_HEADERS, continue: true },
  // Files carry a hash of their content in their name: a browser may keep them for good.
  {
    src: "/assets/(.*)",
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
    continue: true,
  },
  // The design file is Markdown, meant to be read in the browser, not downloaded.
  { src: "^/design\\.md$", headers: { "Content-Type": "text/markdown; charset=utf-8" }, continue: true },
  ...MOVED.map((page) => ({ src: `^${page.from}/?$`, status: 307, headers: { Location: page.to } })),
];

if (landingOnly) {
  // A public host keeps no data: its API answers as if it did not exist.
  routes.push({ src: "^/(?:api/.*|extension/start)$", status: 404 });
} else {
  // The function is told the address through `__path` (see `server/vercel.ts`).
  routes.push({ src: "^/(api/.*|extension/start)$", dest: "/api?__path=$1" });
  const func = path.join(out, "functions", "api.func");
  fs.mkdirSync(func, { recursive: true });
  fs.cpSync(path.join(web, "dist-server"), func, {
    recursive: true,
    filter: (file) => path.basename(file) !== "serve.js",
  });
  const driver = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).dependencies[
    "@libsql/client"
  ];
  fs.writeFileSync(
    path.join(func, "package.json"),
    JSON.stringify({ private: true, type: "module", dependencies: { "@libsql/client": driver } }),
  );
  // The database driver, with the binary for the machine the function runs on.
  execFileSync("npm", ["install", "--omit=dev", "--no-audit", "--no-fund", "--no-package-lock"], {
    cwd: func,
    stdio: "inherit",
  });
  fs.writeFileSync(
    path.join(func, ".vc-config.json"),
    JSON.stringify({
      runtime: "nodejs22.x",
      handler: "vercel.js",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      // A round of calendar sync talks to every platform in turn.
      maxDuration: 60,
    }),
  );
}

routes.push(
  ...prerendered.map((page) => ({ src: `^${page}/?$`, dest: `${page}/index.html` })),
  { handle: "filesystem" },
  // Any other address is a page of the app, or, with only the public pages published, a way back to them.
  landingOnly
    ? { src: "/(.*)", status: 307, headers: { Location: "/" } }
    : { src: "^/(?!.*\\.[a-z0-9]+$).*", dest: "/_shell.html" },
);

// The scheduler's entry stays in `vercel.json`, which Vercel reads beside this output: saying it twice is refused.
fs.writeFileSync(path.join(out, "config.json"), JSON.stringify({ version: 3, routes }, null, 2));
console.log(
  `Wrote .vercel/output: ${prerendered.length + 1} static pages${landingOnly ? "" : ", 1 function"}.`,
);
