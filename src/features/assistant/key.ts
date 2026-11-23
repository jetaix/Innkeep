import "server-only";
import { eq } from "drizzle-orm";
import { appState, getDb } from "@/db";

/**
 * Where the Anthropic API key comes from. An `ANTHROPIC_API_KEY` set on the
 * server wins; otherwise the key the host pasted on the Assistant page, kept
 * in the local database next to the rest of their data. It is never sent to
 * the browser: pages only ever see its last four characters.
 */
const KEY = "anthropic-key";

async function savedKey(): Promise<string | null> {
  return (await getDb().select().from(appState).where(eq(appState.key, KEY)).get())?.value ?? null;
}

export async function getApiKey(): Promise<string | null> {
  return process.env.ANTHROPIC_API_KEY || (await savedKey());
}

export type KeyStatus =
  /** Set in the server's environment; the page cannot change it. */
  { source: "environment"; ending: string } | { source: "saved"; ending: string } | { source: null };

export async function getKeyStatus(): Promise<KeyStatus> {
  const ending = (key: string) => key.slice(-4);
  if (process.env.ANTHROPIC_API_KEY)
    return { source: "environment", ending: ending(process.env.ANTHROPIC_API_KEY) };
  const saved = await savedKey();
  return saved ? { source: "saved", ending: ending(saved) } : { source: null };
}

export async function saveApiKey(key: string) {
  await (
    await getDb()
  )
    .insert(appState)
    .values({ key: KEY, value: key })
    .onConflictDoUpdate({ target: appState.key, set: { value: key } })
    .run();
}

export async function removeApiKey() {
  await getDb().delete(appState).where(eq(appState.key, KEY)).run();
}
