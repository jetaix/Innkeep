import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

/**
 * Migrations run in order on startup and are tracked with SQLite's
 * `user_version`, so a fresh clone and an upgraded install both end up on the
 * latest schema with no manual step. Append to this list; never edit an entry
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
];

function migrate(sqlite: Database.Database) {
  const current = sqlite.pragma("user_version", { simple: true }) as number;
  for (let version = current; version < MIGRATIONS.length; version++) {
    sqlite.transaction(() => {
      sqlite.exec(MIGRATIONS[version]);
      sqlite.pragma(`user_version = ${version + 1}`);
    })();
  }
}

export type Db = BetterSQLite3Database<typeof schema>;

function open(): Db {
  const file = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "innkeep.db");
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  migrate(sqlite);
  return drizzle(sqlite, { schema });
}

// Reuse one connection across dev hot reloads.
const globalForDb = globalThis as unknown as { __innkeepDb?: Db };

export function getDb(): Db {
  globalForDb.__innkeepDb ??= open();
  return globalForDb.__innkeepDb;
}

export * from "./schema";
