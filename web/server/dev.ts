import path from "node:path";

/**
 * The API for local work. It never talks to the hosted database: a local
 * file is used unless you point DATABASE_PATH elsewhere yourself.
 */
process.env.TURSO_DATABASE_URL = "";
process.env.TURSO_AUTH_TOKEN = "";
process.env.DATABASE_PATH ??= path.join(import.meta.dirname, "..", ".data", "innkeep.db");

const { server } = await import("./app");
const port = Number(process.env.API_PORT ?? 3001);
Bun.serve({ port, fetch: server.fetch });
console.log(`Innkeep API on http://localhost:${port}`);
