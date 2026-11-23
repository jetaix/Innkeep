import "server-only";
import { eq, isNotNull } from "drizzle-orm";
import { appState, getDb, reservations, type OtaChannel } from "@/db";

/** The oldest Innkeep Companion that sends everything this version of Innkeep stores. */
export const REQUIRED_EXTENSION = "0.12.0";

const KEY = "extension";

type Seen = { version: string | null; at: number };

/**
 * Remembers that the extension called, and which version it is. A call that
 * does not say (an extension older than 0.5, or a script) leaves the record
 * alone, so it can never make a current extension look outdated.
 */
export async function recordExtension(request: Request) {
  const version = request.headers.get("x-innkeep-extension");
  if (!version || !/^\d+(\.\d+){0,3}$/.test(version)) return;
  const value = JSON.stringify({ version, at: Date.now() } satisfies Seen);
  await (await getDb())
    .insert(appState)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: appState.key, set: { value } })
    .run();
}

const older = (version: string, than: string) =>
  version.localeCompare(than, undefined, { numeric: true }) < 0;

export type ExtensionStatus =
  /** EXTENSION_TOKEN is not set, so the extension cannot connect. */
  | { state: "off" }
  /** Switched on, but the extension has never called. */
  | { state: "missing" }
  /** It calls, but it is an older version that leaves fields out. */
  | { state: "outdated"; version: string | null; at: number | null }
  | { state: "ready"; version: string; at: number };

export async function getExtensionStatus(): Promise<ExtensionStatus> {
  if (!process.env.EXTENSION_TOKEN) return { state: "off" };
  const db = getDb();
  const row = await db.select().from(appState).where(eq(appState.key, KEY)).get();
  if (!row) {
    // Versions before 0.5 did not say who they were; their rows are the only trace.
    const sent = await db
      .select({ id: reservations.id })
      .from(reservations)
      .where(isNotNull(reservations.externalCode))
      .limit(1)
      .get();
    return sent ? { state: "outdated", version: null, at: null } : { state: "missing" };
  }
  const seen = JSON.parse(row.value) as Seen;
  return seen.version && !older(seen.version, REQUIRED_EXTENSION)
    ? { state: "ready", version: seen.version, at: seen.at }
    : { state: "outdated", version: seen.version, at: seen.at };
}

export type LastUpdate = { at: number; stays: number };

/** Remembers when a platform's reservations page was last read, and how many live stays it held. */
export async function recordUpdate(source: OtaChannel, stays: number) {
  const value = JSON.stringify({ at: Date.now(), stays } satisfies LastUpdate);
  await (await getDb())
    .insert(appState)
    .values({ key: `updated:${source}`, value })
    .onConflictDoUpdate({ target: appState.key, set: { value } })
    .run();
}

export async function getLastUpdate(source: OtaChannel): Promise<LastUpdate | null> {
  const row = await (await getDb())
    .select()
    .from(appState)
    .where(eq(appState.key, `updated:${source}`))
    .get();
  return row ? (JSON.parse(row.value) as LastUpdate) : null;
}

/** A platform's reservations count as current for this long after they were read. */
const FRESH_FOR_MS = 12 * 60 * 60_000;

export function isFresh(last: LastUpdate | null, now = Date.now()): boolean {
  return last != null && now - last.at < FRESH_FOR_MS;
}
