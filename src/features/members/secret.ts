import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { appState, central, getDb } from "@/db";

/**
 * What this Innkeep signs sessions and machine tokens with. `SESSION_SECRET`
 * when the host sets one; otherwise a value made on first use and kept in the
 * main database, so every server of a deployment signs alike.
 */
const KEY = "session-secret";
let loaded: Promise<string> | undefined;

async function load(): Promise<string> {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  return central(async () => {
    const db = getDb();
    // Two servers starting together both offer a value; the first one written is kept.
    await db
      .insert(appState)
      .values({ key: KEY, value: randomBytes(32).toString("hex") })
      .onConflictDoNothing()
      .run();
    const row = await db.select().from(appState).where(eq(appState.key, KEY)).get();
    if (!row) throw new Error("The session secret could not be kept");
    return row.value;
  });
}

export function serverSecret(): Promise<string> {
  loaded ??= load().catch((error) => {
    loaded = undefined;
    throw error;
  });
  return loaded;
}
