#!/usr/bin/env node
/**
 * Writes `web/public/innkeep-extension.zip` (and the same file for the older Next.js app) before each build, so the app can
 * offer the browser extension as a download. The archive holds one folder,
 * `innkeep-extension/`, with the extension's files and nothing else (no
 * README, no tests): the folder to choose in "Load unpacked".
 *
 * The ZIP is written here with Node alone: a build machine may have no `zip`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { crc32, deflateRawSync } from "node:zlib";

const source = "extension";
const targets = ["web/public", "public"].map((folder) => path.join(folder, "innkeep-extension.zip"));
const folder = "innkeep-extension";
/** Files that document or test the extension but are not part of it. */
const LEFT_OUT = [/\.md$/, /\.test\.ts$/, /^\.DS_Store$/];

const files = readdirSync(source, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && !LEFT_OUT.some((pattern) => pattern.test(entry.name)))
  .map((entry) => path.relative(source, path.join(entry.parentPath, entry.name)))
  .sort();

// One fixed date (1 January 2026, noon) keeps the archive identical from build to build.
const DOS_TIME = (12 << 11) | (0 << 5) | 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

const parts = [];
const directory = [];
let offset = 0;
for (const file of files) {
  const name = Buffer.from(`${folder}/${file.split(path.sep).join("/")}`);
  const content = readFileSync(path.join(source, file));
  const packed = deflateRawSync(content, { level: 9 });
  const sum = crc32(content);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // names are UTF-8
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(sum, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(name.length, 26);
  parts.push(local, name, packed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4); // made by
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(sum, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(offset, 42);
  directory.push(central, name);

  offset += local.length + name.length + packed.length;
}

const directorySize = directory.reduce((sum, part) => sum + part.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directorySize, 12);
end.writeUInt32LE(offset, 16);

for (const target of targets) {
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, Buffer.concat([...parts, ...directory, end]));
}
const { version } = JSON.parse(readFileSync(path.join(source, "manifest.json"), "utf8"));
console.log(`${targets[0]}  (extension ${version}, ${files.length} files)`);
