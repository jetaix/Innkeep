#!/usr/bin/env node
/**
 * Builds the Safari version of the browser extension on a Mac with Xcode:
 * `safari/build/Build/Products/Release/Innkeep Companion.app`, a small app
 * that carries the files of `extension/` as a Safari extension. Run with
 * `bun run build:safari`.
 *
 * The app is signed to run on this Mac only. Safari loads it once "Allow
 * unsigned extensions" is on; see extension/README.md.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

if (process.platform !== "darwin") {
  console.error("The Safari extension can only be built on a Mac with Xcode.");
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(path.join("extension", "manifest.json"), "utf8"));
const project = path.join("safari", "Innkeep Companion", "Innkeep Companion.xcodeproj");
const derived = path.join("safari", "build");

const build = spawnSync(
  "xcodebuild",
  [
    "-project",
    project,
    "-scheme",
    "Innkeep Companion",
    "-configuration",
    "Release",
    "-derivedDataPath",
    derived,
    "-quiet",
    // The app shows the same version as the extension inside it.
    `MARKETING_VERSION=${version}`,
    "CODE_SIGN_IDENTITY=-",
    "DEVELOPMENT_TEAM=",
    "build",
  ],
  { stdio: "inherit" },
);
if (build.error || build.status !== 0) {
  console.error("xcodebuild failed. Is Xcode installed and opened once?");
  process.exit(1);
}
console.log(
  `${path.join(derived, "Build", "Products", "Release", "Innkeep Companion.app")}  (version ${version})`,
);
