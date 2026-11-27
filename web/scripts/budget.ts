import fs from "node:fs";
import path from "node:path";
import { brotliCompressSync } from "node:zlib";

/**
 * Fails the build when the first view grows past its budget. Sizes are
 * Brotli, read from the files Vite wrote, and each file is counted once.
 *
 * - cold entry: the shell, the dashboard's frame where the route sits inside
 *   it, and the route's own code: the JavaScript a first visit to that route
 *   downloads before anything shows (its text is listed apart);
 * - route: what that route adds on top of the shell;
 * - CSS: every stylesheet of the first view.
 */
const BUDGET = { coldEntry: 150_000, route: 50_000, css: 20_000 };

type Chunk = {
  file: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  css?: string[];
};

const dist = path.join(import.meta.dirname, "..", "dist");
const manifest: Record<string, Chunk> = JSON.parse(
  fs.readFileSync(path.join(dist, ".vite", "manifest.json"), "utf8"),
);
const brotli = (file: string) => brotliCompressSync(fs.readFileSync(path.join(dist, file))).length;

/** A chunk and everything it imports statically: what loads together. */
function closure(key: string, seen = new Set<string>()): Set<string> {
  if (seen.has(key)) return seen;
  seen.add(key);
  for (const next of manifest[key]?.imports ?? []) closure(next, seen);
  return seen;
}

const sizeOf = (keys: Iterable<string>) =>
  [...keys].reduce(
    (sum, key) => sum + (manifest[key]?.file.endsWith(".js") ? brotli(manifest[key].file) : 0),
    0,
  );

const entry = Object.keys(manifest).find((key) => manifest[key]?.isEntry);
if (!entry) throw new Error("The manifest names no entry");
const shell = closure(entry);
const shellSize = sizeOf(shell);

const cssFiles = new Set<string>();
for (const key of shell) for (const file of manifest[key]?.css ?? []) cssFiles.add(file);
for (const file of fs.readdirSync(path.join(dist, "assets")))
  if (file.endsWith(".css")) cssFiles.add(`assets/${file}`);
const cssSize = [...cssFiles].reduce((sum, file) => sum + brotli(file), 0);

const kb = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`.padStart(9);
const rows: { name: string; size: number; limit: number }[] = [
  { name: "shell (every route)", size: shellSize, limit: BUDGET.coldEntry },
  { name: "first-view CSS", size: cssSize, limit: BUDGET.css },
];
const lazy = Object.keys(manifest).filter((name) => manifest[name]?.isDynamicEntry);
// A page never loads alone: the frame around it (the dashboard's, or the public pages') comes first.
const frames = ["_app", "_site"].map((name) => {
  const key = lazy.find((candidate) => candidate.startsWith(`src/routes/${name}.tsx`));
  return {
    inside: `src/routes/${name}/`,
    chunks: key ? [...closure(key)].filter((chunk) => !shell.has(chunk)) : [],
  };
});

/**
 * Code fetched only after an action, never as part of a page's first view:
 * the PDF reader, which arrives when a host chooses a PDF to import.
 */
const ON_DEMAND = ["src/features/revenue/pdf-text.ts"];

for (const key of lazy) {
  if (ON_DEMAND.includes(key)) continue;
  const own = [...closure(key)].filter((name) => !shell.has(name));
  const size = sizeOf(own);
  // The text of one area of the interface, downloaded beside the page that uses it.
  if (key.includes("/i18n/messages/")) {
    rows.push({ name: `text ${key.slice(key.lastIndexOf("/") + 1)}`, size, limit: BUDGET.route });
    continue;
  }
  rows.push({ name: `route ${key}`, size, limit: BUDGET.route });
  const frame = frames.find((candidate) => key.startsWith(candidate.inside));
  const first = frame ? sizeOf(new Set([...frame.chunks, ...own])) : size;
  rows.push({ name: `cold entry ${key}`, size: shellSize + first, limit: BUDGET.coldEntry });
}

let failed = false;
for (const row of rows) {
  const over = row.size > row.limit;
  failed ||= over;
  console.log(`${over ? "OVER" : "ok  "} ${kb(row.size)} / ${kb(row.limit)}  ${row.name}`);
}
if (failed) {
  console.error("\nThe first view is over budget. Split or lazy-load what does not need to be there.");
  process.exit(1);
}
