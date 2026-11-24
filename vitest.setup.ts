/**
 * Tests create and delete rows freely, so they must never reach a real
 * database. A shell that exports the hosted database's address (as a deploy
 * setup does) would otherwise send every test there. Runs before each test file.
 */
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
process.env.DATABASE_PATH = ":memory:";
