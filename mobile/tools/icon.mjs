#!/usr/bin/env node
/**
 * Draws the app icon from the Innkeep mark: the same two doorways as the
 * website and the extension, on the pale plate, filling the square with no
 * transparency, as the App Store and Play ask. Run it again only if the mark
 * changes, from the repository root: `node mobile/tools/icon.mjs`.
 * The file it writes (`mobile/assets/icon-1024.png`) is committed.
 */
import sharp from "sharp";

const LEFT = "M4 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11A1.5 1.5 0 0 1 12 21Z";
const RIGHT = "M12 21a1.5 1.5 0 0 1-1.5-1.5V8.5a5.5 5.5 0 0 1 11 0v11A1.5 1.5 0 0 1 20 21Z";
// Padding keeps the mark inside the circle Android may crop the icon to.
const PADDING = 7;
const side = 24 + PADDING * 2;
const icon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-PADDING} ${-PADDING} ${side} ${side}">
  <defs><clipPath id="a"><path d="${LEFT}"/></clipPath></defs>
  <rect x="${-PADDING}" y="${-PADDING}" width="${side}" height="${side}" fill="#f3f4ef"/>
  <path fill="#ff5d73" d="${LEFT}"/>
  <path fill="#3d6df2" d="${RIGHT}"/>
  <path fill="#4b2bbd" clip-path="url(#a)" d="${RIGHT}"/>
</svg>`;

const out = new URL("../assets/icon-1024.png", import.meta.url).pathname;
await sharp(Buffer.from(icon), { density: 1200 })
  .resize(1024, 1024)
  .flatten({ background: "#f3f4ef" })
  .png()
  .toFile(out);
console.log(out);
