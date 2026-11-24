# Running Innkeep online for your household

The [install guide](INSTALL.md) runs Innkeep on one computer, while its window
is open. This page is for the next step: an Innkeep that is always on, that
you and your partner open from any phone or computer, and that can message
you on Telegram.

There are two ways to do it. Both give the same Innkeep.

|                       | Vercel and Turso                      | Your own server (Docker)       |
| --------------------- | ------------------------------------- | ------------------------------ |
| Cost                  | Free plans are enough for a household | A few euros a month, or a Pi   |
| Upkeep                | None: updates deploy on every push    | You update and back up         |
| Database              | Turso, a hosted SQLite                | A SQLite file on a volume      |
| Sync and messages     | A scheduler calls Innkeep             | A timer inside Innkeep         |
| HTTPS, public address | Included                              | Your reverse proxy or a tunnel |

## Option 1: Vercel and Turso

1. **Database.** On [turso.tech](https://turso.tech) create a database in a
   region near you, then a token for it. Innkeep creates its tables on the
   first request. To bring an existing `data/innkeep.db` along, upload that
   file when you create the database instead of starting empty.
2. **Project.** Import the repository on [vercel.com](https://vercel.com) and
   set its function region to the one closest to the database.
3. **Environment variables**, in the Vercel project's settings:

   | Variable             | Value                                                 |
   | -------------------- | ----------------------------------------------------- |
   | `TURSO_DATABASE_URL` | The database address, `libsql://…`                    |
   | `TURSO_AUTH_TOKEN`   | The database token                                    |
   | `APP_PASSWORD`       | A long sentence only the two of you know              |
   | `CRON_SECRET`        | A long random value                                   |
   | `TELEGRAM_…`         | See [Telegram notifications](#telegram-notifications) |

4. **Deploy**, open the address and sign in. Without `APP_PASSWORD` the pages
   refuse to open, so an unfinished setup never shows your data.

### The scheduler

Vercel keeps no process awake, so something has to ask Innkeep to sync the
calendars and send the Telegram messages: a `GET /api/cron` with the header
`Authorization: Bearer <CRON_SECRET>`.

- `vercel.json` already asks Vercel to do it **once a day**, which is all the
  free plan allows. On a paid plan, change the schedule there to
  `*/15 * * * *` and nothing else is needed.
- For every 15 minutes on the free plan, this repository has a GitHub Actions
  workflow, [sync.yml](../.github/workflows/sync.yml). In the repository's
  settings, under _Secrets and variables_ then _Actions_, add the variable
  `INNKEEP_URL` (your address) and the secret `CRON_SECRET` (the same value as
  on Vercel). GitHub may run it a few minutes late, and pauses schedules in a
  repository with no activity for 60 days. Any other scheduler that can send
  the header works as well.

Opening Innkeep also syncs calendars that are out of date, whatever the
scheduler does.

## Option 2: Your own server

It needs a small machine that stays on, with Docker and a disk that survives
restarts: a €4 to €6 a month virtual server, Fly.io, Railway, or a Raspberry
Pi at home. 512 MB of memory is enough. There is no database to set up: the
SQLite file is the database, and a backup is a copy of one file.

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
  use a reverse proxy such as Caddy, which gets a certificate by itself. Airbnb
  and Booking.com must be able to reach the calendar links, so a private
  network alone is not enough.
- Add `EXTENSION_TOKEN` if you use the browser extension, and enter the
  public address in the extension's settings.

## The password

`APP_PASSWORD` is one password for the household: every page asks for it
once per browser, then remembers it for 90 days. There are no separate
accounts. Changing the password signs everyone out. After twenty wrong
passwords in ten minutes, sign-in is refused until the ten minutes have
passed.

Someone who is not signed in never reaches your data: their requests are
answered from a separate set of sample bookings kept in memory, whatever page
or action they aim at.

### A public demo

Add `PUBLIC_DEMO=1` next to `APP_PASSWORD` to show Innkeep to visitors. They
then get the public pages and a dashboard on the sample bookings, which they
can read but not change, instead of the sign-in page. Settings and the
extension pages stay yours alone. You sign in at `/login`, which nothing
links to. Do not combine it with `LANDING_ONLY`, which switches the dashboard
off altogether.

The addresses that machines call keep their own secrets and do not use the
password: the calendar links you give Airbnb and Booking.com, the browser
extension and the MCP server.

## Telegram notifications

Innkeep sends a message each time a cleaning has to be arranged: when a new
booking brings a new check-out, or when you add a cleaning by hand. It says
the day, the place, from when it is free and when the next guest arrives,
without guest names. Right after it comes the request for each cleaning as a
message of its own, worded for your cleaner ("can you clean on … between … and
…?"), so you can forward or copy it as it is. If a stay
you were told about is cancelled or moved, a second message says that
cleaning is no longer needed.

1. In Telegram, talk to **@BotFather**, send `/newbot` and follow the two
   questions. It gives you a token: that is `TELEGRAM_BOT_TOKEN`.
2. For both of you to get the messages, create a group, add your partner and
   the bot. For yourself only, just open the bot and press **Start**.
3. Set `TELEGRAM_BOT_TOKEN` and restart Innkeep. Send any message in that
   chat, then open **Settings** and press **Find my group**: Innkeep asks
   Telegram which chats the bot was written to in, and you pick yours. A first
   message arrives there straight away.

To fix the chat in the server's settings instead, set `TELEGRAM_CHAT_ID` to its
number (negative for a group); it then takes precedence over the one picked in
Settings.

Messages go out after each calendar sync: every 15 minutes on your own
server, or each time the scheduler calls on Vercel. The first run tells you about every cleaning already planned, in one message.

## Backups and updates

On Vercel, updates deploy when you push, and the database upgrades itself on
the next request. Turso's free plan can restore the last day only, so export
a copy now and then with `turso db shell <name> .dump > backup.sql`.

On your own server, back up by copying the volume's `innkeep.db` (with its
`-wal` file if there is one) while Innkeep is stopped. To update: pull the
code, build the image again, remove the container and run it again with the
same volume.
