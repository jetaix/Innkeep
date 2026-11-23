#!/usr/bin/env node
/**
 * Points git at the hooks kept in `.githooks`, so the checks in
 * `.githooks/pre-push` run before every push. Called by `bun install`.
 * Does nothing, quietly, when the folder is not a git checkout (a ZIP
 * download) or git is not installed.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (existsSync(".git")) {
  spawnSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
}
