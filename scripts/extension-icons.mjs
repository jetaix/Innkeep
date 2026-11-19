#!/usr/bin/env node
/**
 * Draws the extension's icons from the Innkeep mark, at the sizes Chrome
 * asks for. Run it again only if the mark changes: `node scripts/extension-icons.mjs`.
 * The files it writes (`extension/icons/*.png`) are committed.
 */
import sharp from "sharp";

// The mark: a rounded square with a doorway cut out. A white plate behind it
// keeps the doorway white on any toolbar, light or dark.
const mark = (padding) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding} ${-padding} ${24 + padding * 2} ${24 + padding * 2}">
  <rect x="2" y="2" width="20" height="20" rx="3" fill="#ffffff"/>
  <path fill="#18181b" fill-rule="evenodd" d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Zm3 20v-9a4 4 0 0 1 8 0v9H8Zm5.6-6.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
</svg>`;

// Chrome Web Store asks for 96 px of artwork inside the 128 px icon; the
// small sizes fill their square so they stay legible in the toolbar.
for (const [size, padding] of [
  [16, -1.5],
  [32, -1.5],
  [48, -1],
  [128, 2],
]) {
  await sharp(Buffer.from(mark(padding)), { density: 1200 })
    .resize(size, size)
    .png()
    .toFile(`extension/icons/icon-${size}.png`);
  console.log(`extension/icons/icon-${size}.png`);
}
