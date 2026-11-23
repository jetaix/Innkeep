#!/usr/bin/env node
/**
 * Builds the file to upload to the Chrome Web Store:
 * `dist/innkeep-companion-<version>.zip`, holding the extension's files and
 * nothing else (no README, no tests). Run with `bun run package:extension`.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const source = "extension";
/** Files that document or test the extension but are not part of it. */
const LEFT_OUT = [/\.md$/, /\.test\.ts$/, /^\.DS_Store$/];

const manifest = JSON.parse(readFileSync(path.join(source, "manifest.json"), "utf8"));
const target = path.resolve("dist", `innkeep-companion-${manifest.version}.zip`);

const files = readdirSync(source, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && !LEFT_OUT.some((pattern) => pattern.test(entry.name)))
  .map((entry) => path.relative(source, path.join(entry.parentPath, entry.name)))
  .sort();

// Every file the manifest names must be in the package, or Chrome refuses it.
const named = [
  manifest.background.service_worker,
  manifest.options_page,
  manifest.action.default_popup,
  ...Object.values(manifest.icons),
  ...manifest.content_scripts.flatMap((script) => script.js),
];
const missing = [...new Set(named)].filter((file) => !files.includes(file));
if (missing.length) {
  console.error(`The manifest names files that do not exist: ${missing.join(", ")}`);
  process.exit(1);
}

mkdirSync(path.dirname(target), { recursive: true });
rmSync(target, { force: true });
const zip = spawnSync("zip", ["-q", "-X", target, ...files], { cwd: source, stdio: "inherit" });
if (zip.error || zip.status !== 0) {
  console.error("Could not run `zip`. Install it, or compress the listed files by hand.");
  process.exit(1);
}
console.log(`${path.relative(".", target)}  (version ${manifest.version}, ${files.length} files)`);
for (const file of files) console.log(`  ${file}`);
