#!/usr/bin/env node
/**
 * Draws the extension's icons from the Innkeep mark, at the sizes Chrome
 * asks for. Run it again only if the mark changes: `node scripts/extension-icons.mjs`.
 * The files it writes (`extension/icons/*.png`) are committed.
 */
import sharp from "sharp";

// The mark: two doorways that overlap, one per calendar, darker where they
// meet. A pale plate behind it keeps the colours true on any toolbar.
const LEFT = "M4 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11A1.5 1.5 0 0 1 12 21Z";
const RIGHT = "M12 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11A1.5 1.5 0 0 1 20 21Z";
const mark = (padding) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-padding} ${-padding} ${24 + padding * 2} ${24 + padding * 2}">
  <defs><clipPath id="a"><path d="${LEFT}"/></clipPath></defs>
  <rect x="0" y="0" width="24" height="24" rx="5" fill="#f3f4ef"/>
  <path fill="#ff5d73" d="${LEFT}"/>
  <path fill="#3d6df2" d="${RIGHT}"/>
  <path fill="#4b2bbd" clip-path="url(#a)" d="${RIGHT}"/>
</svg>`;

// Chrome Web Store asks for 96 px of artwork inside the 128 px icon; the
// small sizes fill their square so they stay legible in the toolbar.
for (const [size, padding] of [
  [16, -1],
  [32, -1],
  [48, -0.5],
  [128, 2],
]) {
  await sharp(Buffer.from(mark(padding)), { density: 1200 })
    .resize(size, size)
    .png()
    .toFile(`extension/icons/icon-${size}.png`);
  console.log(`extension/icons/icon-${size}.png`);
}
