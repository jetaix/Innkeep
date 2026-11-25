#!/usr/bin/env node
/**
 * Makes the images the Chrome Web Store asks for, from `docs/store/images.html`
 * (the look of Innkeep's home page): the screenshot (1280 × 800), the small
 * promotional image (440 × 280) and the large banner (1400 × 560). Chrome
 * draws them, so it needs Google Chrome on a Mac and a connection for the
 * two typefaces. Run it again only if the wording or the look changes:
 * `node scripts/store-images.mjs`.
 */
import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const page = pathToFileURL(path.resolve("docs/store/images.html")).href;

for (const [variant, width, height, name] of [
  ["shot", 1280, 800, "screenshot-1"],
  ["small", 440, 280, "promo-small"],
  ["marquee", 1400, 560, "promo-marquee"],
]) {
  const raw = path.resolve(`docs/store/.${name}.raw.png`);
  const run = spawnSync(
    CHROME,
    [
      "--headless=new",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${width},${height}`,
      "--virtual-time-budget=8000",
      `--screenshot=${raw}`,
      `${page}?v=${variant}`,
    ],
    { stdio: "ignore" },
  );
  if (run.error || run.status !== 0) {
    console.error("Could not draw the images. Is Google Chrome installed?");
    process.exit(1);
  }
  const file = `docs/store/${name}.png`;
  // The store refuses a PNG with transparency.
  await sharp(raw).resize(width, height).flatten({ background: "#0b0c10" }).removeAlpha().png().toFile(file);
  rmSync(raw);
  console.log(file);
}
