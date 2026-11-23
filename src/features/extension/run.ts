import "server-only";
import { randomBytes } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { appState, getDb } from "@/db";

/**
 * Lets a button in Innkeep start a run of the browser extension.
 *
 * The button opens `/extension/run?key=…`. The extension, which is allowed to
 * see addresses on this Innkeep only, notices that page and asks for the list
 * of pages with the same key. A key works once, for two minutes, so the
 * address cannot be replayed or guessed by another site.
 */
export type RunScope = "reservations" | "all";

const PREFIX = "run:";
const VALID_FOR_MS = 2 * 60_000;

export async function createRunKey(scope: RunScope): Promise<string> {
  const db = getDb();
  // Old keys that were never used are swept on the way.
  await db
    .delete(appState)
    .where(like(appState.key, `${PREFIX}%`))
    .run();
  const key = randomBytes(18).toString("base64url");
  await db
    .insert(appState)
    .values({ key: `${PREFIX}${key}`, value: JSON.stringify({ scope, at: Date.now() }) })
    .run();
  return key;
}

/** The scope the key was made for, once; null when it is unknown, used or too old. */
export async function consumeRunKey(key: string): Promise<RunScope | null> {
  const db = getDb();
  const row = await db
    .select()
    .from(appState)
    .where(eq(appState.key, `${PREFIX}${key}`))
    .get();
  if (!row) return null;
  await db.delete(appState).where(eq(appState.key, row.key)).run();
  const { scope, at } = JSON.parse(row.value) as { scope: RunScope; at: number };
  return Date.now() - at < VALID_FOR_MS ? scope : null;
}
