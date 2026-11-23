# Running Innkeep online for your household

The [install guide](INSTALL.md) runs Innkeep on one computer, while its window
is open. This page is for the next step: an Innkeep that is always on, that
you and your partner open from any phone or computer, and that can message
you on Telegram.

## What it needs

- **A small machine that stays on**, with Docker and a disk that survives
  restarts: a €4 to €6 a month virtual server, Fly.io, Railway, or a
  Raspberry Pi at home. 512 MB of memory is enough.
- **Not a serverless host** such as Vercel or Netlify. Innkeep keeps its data
  in one SQLite file and syncs calendars from a timer inside the server; those
  hosts have no lasting disk and no process that stays awake. Vercel is fine
  for the public landing page only (`LANDING_ONLY=1`).
- **No separate database.** The SQLite file is the database. For two people
  and a few properties it is faster and simpler than a database server, and a
  backup is a copy of one file.

## Start it

```bash
docker build -t innkeep .
```

```bash
docker run -d --name innkeep --restart unless-stopped \
  -p 3000:3000 \
  -v innkeep-data:/data \
  -e APP_PASSWORD='a long sentence only the two of you know' \
  -e APP_URL='https://innkeep.example.com' \
  -e TELEGRAM_BOT_TOKEN='123456:ABC...' \
  -e TELEGRAM_CHAT_ID='-1001234567890' \
  -e TELEGRAM_LANGUAGE='fr' \
  innkeep
```

- The volume mounted at `/data` holds the database. Without it, every update
  starts from empty.
- Put it behind HTTPS. Fly.io and Railway do that for you; on your own server
  use a reverse proxy such as Caddy, which gets a certificate by itself.
- Add `EXTENSION_TOKEN` if you use the browser extension, and enter the
  public address in the extension's settings.

## The password

`APP_PASSWORD` is one password for the household: every page asks for it
once per browser, then remembers it for 90 days. There are no separate
accounts. Changing the password signs everyone out. After twenty wrong
passwords in ten minutes, sign-in is refused until the ten minutes have
passed.

The addresses that machines call keep their own secrets and do not use the
password: the calendar links you give Airbnb and Booking.com, the browser
extension, the messages webhook and the MCP server.

## Telegram notifications

Innkeep sends a message each time a cleaning has to be arranged: when a new
booking brings a new check-out, or when you add a cleaning by hand. It says
the day, the place, from when it is free and when the next guest arrives,
without guest names, so you can forward it to your cleaner as it is. If a stay
you were told about is cancelled or moved, a second message says that
cleaning is no longer needed.

1. In Telegram, talk to **@BotFather**, send `/newbot` and follow the two
   questions. It gives you a token: that is `TELEGRAM_BOT_TOKEN`.
2. For both of you to get the messages, create a group, add your partner and
   the bot. For yourself only, just open the bot and press **Start**.
3. Send any message in that chat, then open
   `https://api.telegram.org/bot<token>/getUpdates` in a browser. The number
   after `"chat":{"id":` is `TELEGRAM_CHAT_ID` (negative for a group).
4. Restart Innkeep with the two variables, open **Settings** and press
   **Send a test message**.

Messages go out after each calendar sync, every 15 minutes by default. The
first run tells you about every cleaning already planned, in one message.

## Backups and updates

Back up by copying the volume's `innkeep.db` (with its `-wal` file if there is
one) while Innkeep is stopped, or with `sqlite3 innkeep.db ".backup copy.db"`
while it runs.

To update: pull the code, build the image again, remove the container and run
it again with the same volume. The database upgrades itself on start.
