#!/usr/bin/env node
/**
 * Starts Innkeep for someone who does not use a terminal: installs what is
 * missing, prepares the settings file, builds the app when the code changed,
 * starts it and opens the browser. Run by `start.command` (macOS),
 * `start.bat` (Windows) or `npm run app`.
 */
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const port = Number(process.env.PORT ?? 3000);
const address = `http://localhost:${port}`;
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const say = (text) => console.log(`\n  ${text}`);

function stop(text) {
  console.error(`\n  ${text}\n`);
  process.exit(1);
}

const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  stop(
    `Innkeep needs Node.js 22 or later; this computer has ${process.versions.node}.\n  Install the current version from https://nodejs.org and start again.`,
  );
}

function run(command, args, what) {
  say(`${what} This can take a few minutes the first time.`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) stop(`That step failed. Copy the lines above and ask for help.`);
}

/** Newest change under a folder, to know whether the app must be built again. */
function newest(folder) {
  let latest = 0;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    latest = Math.max(latest, entry.isDirectory() ? newest(full) : statSync(full).mtimeMs);
  }
  return latest;
}

const installed = path.join("node_modules", ".package-lock.json");
if (!existsSync(installed) || statSync("package-lock.json").mtimeMs > statSync(installed).mtimeMs) {
  run(npm, ["install", "--no-audit", "--no-fund"], "Installing what Innkeep needs.");
}

// The settings file. The browser extension needs a password to talk to Innkeep:
// one is made here, so there is nothing to type.
const settings = ".env.local";
const current = existsSync(settings) ? readFileSync(settings, "utf8") : "";
if (!/^EXTENSION_TOKEN=.+/m.test(current)) {
  const token = randomBytes(24).toString("base64url");
  writeFileSync(
    settings,
    `${current}${current && !current.endsWith("\n") ? "\n" : ""}EXTENSION_TOKEN=${token}\n`,
  );
  say("Created the settings file (.env.local) with a password for the browser extension.");
}

const built = path.join(".next", "BUILD_ID");
const changed = Math.max(newest("src"), statSync("package.json").mtimeMs, statSync(settings).mtimeMs);
if (!existsSync(built) || statSync(built).mtimeMs < changed) {
  run(npm, ["run", "build"], "Preparing the app.");
}

/** Whether something already answers on the port (Innkeep left running, or another program). */
const taken = await new Promise((resolve) => {
  const socket = createConnection({ port, host: "127.0.0.1" });
  socket.once("connect", () => (socket.destroy(), resolve(true)));
  socket.once("error", () => resolve(false));
});
if (taken) {
  stop(
    `Something is already running at ${address}.\n  If it is Innkeep, just open that address in your browser.\n  Otherwise close the other program, or start Innkeep on another port: PORT=3001 npm run app`,
  );
}

say(`Starting Innkeep at ${address}`);
const server = spawn(npm, ["run", "start", "--", "-p", String(port)], {
  stdio: ["inherit", "pipe", "inherit"],
  shell: process.platform === "win32",
});

let opened = false;
server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  if (opened || !/ready|started server|localhost/i.test(String(chunk))) return;
  opened = true;
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(opener, [`${address}/overview`], {
    stdio: "ignore",
    shell: process.platform === "win32",
    detached: true,
  }).on("error", () => {});
  say(`Innkeep is running. If your browser did not open, go to ${address}`);
  say("Keep this window open while you use Innkeep. Close it (or press Ctrl+C) to stop.\n");
});
server.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
