/**
 * Tests create and delete rows freely, so they must never reach a real
 * database. A shell that exports the hosted database's address (as a deploy
 * setup does) would otherwise send every test there. Runs before each test file.
 */
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
process.env.DATABASE_PATH = ":memory:";

// A shell that exports the Telegram bot (as a deploy setup does) must not let a test send a real message.
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_CHAT_ID;

// Nor may the host's own sign-in settings decide what a test's account gets.
delete process.env.OWNER_EMAIL;
delete process.env.SIGN_UP;
delete process.env.SESSION_SECRET;
