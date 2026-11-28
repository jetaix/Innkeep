import { AsyncLocalStorage } from "node:async_hooks";
import fs from "node:fs";
import path from "node:path";
import { createClient, type Client, type Transaction } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import type { DataScope } from "@/lib/session";
import * as schema from "./schema";

/**
 * Migrations run in order before the first query and are tracked in the
 * `innkeep_schema` table, so a fresh clone, an upgraded install and a hosted
 * database all end up on the latest schema with no manual step. Append to this list; never edit an entry
 * that has shipped.
 */
const MIGRATIONS: string[] = [
  // 1: properties, listings, reservations, inbox
  `
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  max_guests INTEGER NOT NULL DEFAULT 2,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  base_price INTEGER NOT NULL DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'EUR',
  check_in_time TEXT NOT NULL DEFAULT '15:00',
  check_out_time TEXT NOT NULL DEFAULT '11:00',
  house_rules TEXT NOT NULL DEFAULT '',
  ical_token TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  listing_url TEXT NOT NULL DEFAULT '',
  ical_url TEXT NOT NULL DEFAULT '',
  title_override TEXT NOT NULL DEFAULT '',
  description_override TEXT NOT NULL DEFAULT '',
  published_hash TEXT,
  published_at INTEGER,
  last_synced_at INTEGER,
  last_sync_error TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS listings_property_channel ON listings(property_id, channel);
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'reservation',
  external_uid TEXT,
  guest_name TEXT NOT NULL DEFAULT '',
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  channel_info TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS reservations_external ON reservations(property_id, source, external_uid);
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  external_thread_id TEXT,
  unread INTEGER NOT NULL DEFAULT 0,
  last_message_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS conversations_thread ON conversations(source, external_thread_id);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL,
  body TEXT NOT NULL,
  delivery TEXT NOT NULL DEFAULT 'delivered',
  sent_at INTEGER NOT NULL
);
`,
  // 2: money (reservation payouts, charges) and suggestions
  `
ALTER TABLE reservations ADD COLUMN amount INTEGER;
CREATE TABLE IF NOT EXISTS charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  frequency TEXT NOT NULL,
  amount INTEGER NOT NULL,
  applies_to TEXT NOT NULL DEFAULT 'all',
  starts_on TEXT NOT NULL,
  ends_on TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS dismissed_suggestions (
  key TEXT PRIMARY KEY,
  dismissed_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS ai_advice (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  generated_at INTEGER NOT NULL,
  model TEXT NOT NULL,
  payload TEXT NOT NULL
);
`,
  // 3: details the browser extension reads from the host's own reservations page
  `
ALTER TABLE reservations ADD COLUMN external_code TEXT;
ALTER TABLE reservations ADD COLUMN guests INTEGER;
`,
  // 4: the channel's own id for a listing, so extension data lands on the right property
  `
ALTER TABLE listings ADD COLUMN external_id TEXT;
`,
  // 5: everything else the extension can read: booking date, platform status, price before fees, listing facts
  `
ALTER TABLE reservations ADD COLUMN booked_on TEXT;
ALTER TABLE reservations ADD COLUMN channel_status TEXT;
ALTER TABLE reservations ADD COLUMN gross_amount INTEGER;
ALTER TABLE reservations ADD COLUMN channel_fees INTEGER;
ALTER TABLE listings ADD COLUMN channel_details TEXT;
ALTER TABLE listings ADD COLUMN channel_details_at INTEGER;
`,
  // 6: the listing or room a stay was booked for, and small facts about the app itself
  `
ALTER TABLE reservations ADD COLUMN unit_name TEXT;
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`,
  // 7: the price of each night as each platform's calendar shows it
  `
CREATE TABLE IF NOT EXISTS nightly_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  amount INTEGER NOT NULL,
  note TEXT,
  seen_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS nightly_prices_night ON nightly_prices (property_id, source, plan, date);
`,
  // 8: what a guest is shown for a whole stay on the public listing page, fees and discounts included
  `
CREATE TABLE IF NOT EXISTS guest_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  check_in TEXT NOT NULL,
  check_out TEXT NOT NULL,
  guests INTEGER,
  total INTEGER NOT NULL,
  original INTEGER,
  seen_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS guest_quotes_stay ON guest_quotes (property_id, source, check_in, check_out);
`,
  // 9: the listing as each platform's public page shows it
  `
ALTER TABLE listings ADD COLUMN public_preview TEXT;
ALTER TABLE listings ADD COLUMN public_preview_at INTEGER;
`,
  // 10: the reviews guests left on each platform, and the host's replies
  `
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_key TEXT NOT NULL,
  author TEXT NOT NULL,
  rating REAL,
  scale INTEGER NOT NULL DEFAULT 5,
  reviewed_on TEXT,
  stay TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  negative TEXT NOT NULL DEFAULT '',
  reply TEXT NOT NULL DEFAULT '',
  seen_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS reviews_key ON reviews (property_id, source, external_key);
`,
  // 11: admin pages of a platform kept as shown (every amenity, every photo, policies…)
  `
CREATE TABLE IF NOT EXISTS channel_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  page TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  lines TEXT NOT NULL DEFAULT '[]',
  images TEXT NOT NULL DEFAULT '[]',
  seen_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS channel_pages_page ON channel_pages (listing_id, page);
`,
  // 12: cleaning schedule: who cleans which place, and the state of each cleaning
  `
ALTER TABLE properties ADD COLUMN cleaning_enabled INTEGER NOT NULL DEFAULT 1;
CREATE TABLE IF NOT EXISTS cleaners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cleaner_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  cleaner_id INTEGER NOT NULL REFERENCES cleaners(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS cleaner_assignments_rank ON cleaner_assignments (property_id, priority);
CREATE TABLE IF NOT EXISTS cleanings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cleaner_id INTEGER REFERENCES cleaners(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  manual INTEGER NOT NULL DEFAULT 0,
  done_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS cleanings_day ON cleanings (property_id, date);
`,
  // 13: when the host was told on Telegram that a cleaning is needed
  `
ALTER TABLE cleanings ADD COLUMN notified_at INTEGER;
`,
  // 14: an Airbnb listing's number is in its address ("/rooms/123"): fill it in where it is missing
  `
UPDATE listings
SET external_id = CAST(CAST(substr(listing_url, instr(listing_url, '/rooms/') + 7) AS INTEGER) AS TEXT)
WHERE channel = 'airbnb'
  AND external_id IS NULL
  AND instr(listing_url, '/rooms/') > 0
  AND CAST(substr(listing_url, instr(listing_url, '/rooms/') + 7) AS INTEGER) > 0;
`,
  // 15: the calendar link Airbnb exports carries the number too ("/calendar/ical/123.ics")
  `
UPDATE listings
SET external_id = CAST(CAST(substr(ical_url, instr(ical_url, '/calendar/ical/') + 15) AS INTEGER) AS TEXT)
WHERE channel = 'airbnb'
  AND external_id IS NULL
  AND instr(ical_url, 'airbnb.') > 0
  AND instr(ical_url, '/calendar/ical/') > 0
  AND CAST(substr(ical_url, instr(ical_url, '/calendar/ical/') + 15) AS INTEGER) > 0;
`,
  // 16: messages read from a platform's inbox are recognised when read again
  `
ALTER TABLE messages ADD COLUMN external_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS messages_external ON messages (conversation_id, external_key);
`,
  // 17: whether the cleaner was asked for a cleaning, and whether they agreed
  `
ALTER TABLE cleanings ADD COLUMN request TEXT NOT NULL DEFAULT 'none';
`,
  // 18: what happened to a stay (new, cancelled, dates changed), for the browser's notifications
  `
CREATE TABLE IF NOT EXISTS reservation_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  at INTEGER NOT NULL
);
`,
  // 19: loans to repay, counted as a monthly cost until the last payment
  `
CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  principal INTEGER NOT NULL,
  rate INTEGER NOT NULL,
  months INTEGER NOT NULL,
  insurance INTEGER NOT NULL DEFAULT 0,
  starts_on TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`,
  // 20: a loan's amortisation table, imported from the bank's own
  `
CREATE TABLE IF NOT EXISTS loan_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  interest INTEGER NOT NULL,
  capital INTEGER NOT NULL,
  insurance INTEGER NOT NULL DEFAULT 0,
  remaining INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS loan_payments_date ON loan_payments (loan_id, date);
`,
  // 21: members with a role, and the invitations that bring them in
  `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email);
CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS invitations_token ON invitations (token_hash);
`,
  // 22: a loan's monthly payment as the borrower typed it, insurance included
  `
ALTER TABLE loans ADD COLUMN payment INTEGER;
`,
];

/** One statement per entry: a hosted database takes them as a batch, not as a script. */
const statements = (script: string) =>
  script
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

/**
 * Brings the schema up to date. The version used to live in SQLite's
 * `user_version`, which a hosted database does not keep, so it is read once
 * from there and kept in a table from then on.
 */
async function migrate(client: Client) {
  await client.execute("CREATE TABLE IF NOT EXISTS innkeep_schema (version INTEGER NOT NULL)");
  let current = (await client.execute("SELECT version FROM innkeep_schema")).rows[0]?.version as
    | number
    | undefined;
  if (current == null) {
    const legacy = await client.execute("PRAGMA user_version").catch(() => null);
    current = Number(legacy?.rows[0]?.user_version ?? 0);
    await client.execute({ sql: "INSERT INTO innkeep_schema (version) VALUES (?)", args: [current] });
  }
  for (let version = current; version < MIGRATIONS.length; version++) {
    await client.batch(
      [
        ...statements(MIGRATIONS[version]),
        { sql: "UPDATE innkeep_schema SET version = ?", args: [version + 1] },
      ],
      "write",
    );
  }
}

export type Db = LibSQLDatabase<typeof schema>;

/**
 * Where the data lives. `TURSO_DATABASE_URL` (with `TURSO_AUTH_TOKEN`) is a
 * hosted database, for an Innkeep on a host with no disk of its own.
 * Otherwise it is a SQLite file on this machine.
 */
function connect(): Client {
  const testing = Boolean(process.env.VITEST);
  const url = process.env.TURSO_DATABASE_URL;
  // Tests delete whole tables. `vitest.setup.ts` already clears the address; this is the second lock.
  if (url && testing) throw new Error("Tests must not use the hosted database: unset TURSO_DATABASE_URL");
  if (url) return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const file =
    process.env.DATABASE_PATH ?? (testing ? ":memory:" : path.join(process.cwd(), "data", "innkeep.db"));
  if (file === ":memory:") return createClient({ url: ":memory:" });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  return createClient({ url: `file:${file}` });
}

/**
 * Which data a request sees. An Innkeep protected by a password keeps two
 * databases apart: the host's own, and a demo with sample bookings that lives
 * in memory. The server decides for each request (`web/server/scope.ts`) and runs it
 * inside `withData`; nothing else may set it. Someone who is not signed in therefore never
 * reaches the host's data, whatever page or action they aim at: with
 * `PUBLIC_DEMO` they see the demo, without it they only ever see the sign-in page.
 *
 * - `real`: the host, signed in, and the machines that call the API with a token.
 * - `demo`: a visitor looking around.
 * - `demo-readonly`: a visitor trying to change something. Every write is refused.
 */

const forced = new AsyncLocalStorage<DataScope>();
const seeding = new AsyncLocalStorage<true>();

/** Runs `work` against the given data, whatever the request says. For filling the demo, and for tests. */
export const withData = <T>(scope: DataScope, work: () => Promise<T>): Promise<T> => forced.run(scope, work);

/**
 * The data the current request sees. Every request to the API is wrapped in
 * `withData` by the server (see `web/server`), which decides from the session.
 * Outside a request (the background sync, a script) it is the host's own.
 */
export async function dataScope(): Promise<DataScope> {
  return forced.getStore() ?? "real";
}

export const isDemo = async () => (await dataScope()) !== "real";

/**
 * For the few actions that reach outside the database with the host's own
 * accounts (a Telegram message, a paid request to Anthropic). The database
 * refuses a visitor's writes by itself; it cannot refuse these.
 */
export async function hostOnly(): Promise<void> {
  if (await isDemo()) throw new DemoReadOnlyError();
}

/** Refused in the demo: a visitor may look, not change. */
export class DemoReadOnlyError extends Error {
  constructor() {
    super("This is a demo: changes are not saved.");
    this.name = "DemoReadOnlyError";
  }
}

const READS = /^\s*(?:select|pragma|explain|with)\b/i;
const sqlOf = (statement: unknown) =>
  typeof statement === "string" ? statement : String((statement as { sql?: unknown })?.sql ?? "");

/** Whether a call to the client would only read. Exported for its test. */
export function onlyReads(method: string, args: unknown[]): boolean {
  if (method === "execute") return READS.test(sqlOf(args[0]));
  if (method === "batch")
    return Array.isArray(args[0]) && args[0].every((statement) => READS.test(sqlOf(statement)));
  return method === "close" || method === "sync";
}

/**
 * One database, ready to be queried. Every call first waits for the
 * migrations, so no query can run against an old schema, whoever asks first.
 * Transactions run one at a time: two calendar syncs finishing together would
 * otherwise fight over SQLite's single writer.
 */
function lane(client: Client, single: boolean) {
  const ready: Promise<void> = migrate(client);
  // Reported by the first query that awaits it; this only keeps Node from calling it unhandled.
  ready.catch(() => {});
  let queue: Promise<void> = Promise.resolve();

  return async (method: string, args: unknown[]): Promise<unknown> => {
    const value: unknown = Reflect.get(client, method, client);
    const call = (): unknown => (value as (...given: unknown[]) => unknown).apply(client, args);
    await ready;
    if (method !== "transaction") {
      // An in-memory database has one connection, so nothing else may run during a transaction.
      if (single) await queue;
      return call();
    }
    const before = queue;
    let release = () => {};
    queue = new Promise((resolve) => (release = resolve));
    await before;
    try {
      return releasing((await call()) as Transaction, release);
    } catch (error) {
      release();
      throw error;
    }
  };
}

type Lane = ReturnType<typeof lane>;
let demoLane: Lane | undefined;
let demoFilled: Promise<void> | undefined;

/** The demo: an in-memory database, filled with the sample data the first time it is asked for. */
async function demo(): Promise<Lane> {
  demoLane ??= lane(createClient({ url: ":memory:" }), true);
  if (!seeding.getStore()) {
    demoFilled ??= seeding.run(true, () =>
      forced.run("demo", async () => {
        const { seedDemo } = await import("./seed");
        await seedDemo();
      }),
    );
    await demoFilled;
  }
  return demoLane;
}

/** The client drizzle talks to: it sends each call to the host's database or to the demo. */
function open(): Db {
  const client = connect();
  const real = lane(client, client.protocol === "file" && process.env.DATABASE_PATH === ":memory:");

  const routing = new Proxy(client, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property, target);
      if (typeof value !== "function" || typeof property !== "string") return value;
      return async (...args: unknown[]) => {
        const scope = await dataScope();
        if (scope === "real") return real(property, args);
        if (scope === "demo-readonly" && !onlyReads(property, args)) throw new DemoReadOnlyError();
        return (await demo())(property, args);
      };
    },
  });
  return drizzle(routing, { schema });
}

/** Lets the next transaction start once this one is committed, rolled back or closed. */
function releasing(transaction: Transaction, release: () => void): Transaction {
  return new Proxy(transaction, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property, target);
      if (typeof value !== "function") return value;
      if (property !== "commit" && property !== "rollback" && property !== "close") return value.bind(target);
      return (...args: unknown[]): unknown => {
        try {
          const result: unknown = value.apply(target, args);
          if (result instanceof Promise) return result.finally(release);
          release();
          return result;
        } catch (error) {
          release();
          throw error;
        }
      };
    },
  });
}

// Reuse one connection across dev hot reloads.
const globalForDb = globalThis as unknown as { __innkeepDb?: Db };

export function getDb(): Db {
  globalForDb.__innkeepDb ??= open();
  return globalForDb.__innkeepDb;
}

export * from "./schema";
