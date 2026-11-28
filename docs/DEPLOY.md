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
   | `CRON_SECRET`        | A long random value                                   |
   | `TELEGRAM_…`         | See [Telegram notifications](#telegram-notifications) |

4. **Deploy**, open the address and create your account straight away: the
   first account owns this database. See [Accounts](#accounts) for who else
   may sign up; to keep it to yourself, add `SIGN_UP=closed`.

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

## Accounts

Nobody opens the dashboard without an account. On a new Innkeep, open it and
choose **Create an account**: a name, an email and a password. That first
account owns the data.

- **Your household.** Under Settings, Members, an admin creates an invitation
  link and chooses a role: admin (everything) or visitor (the cleaning and the
  properties, and marking a cleaning as done). The person picks a password of
  their own. Innkeep sends no email, so you pass the link on yourself.
- **A forgotten password.** An admin creates a reset link for that member in
  the same place. A space with a single admin who forgets their password has
  nobody to ask: keep it somewhere safe.
- **Other people.** Anyone else who signs up gets an empty Innkeep of their
  own, in a separate database, never yours. `SIGN_UP` says who may:
  - `beta`, the default: only the addresses you approve. People ask through
    the access form on the public page; the requests wait under Settings,
    Beta access, where you approve them or add an address yourself. Innkeep
    sends no email, so tell the person yourself once they are approved.
  - `open`: anyone.
  - `closed`: nobody. Invitations into your own Innkeep keep working.
- **Where their data goes.** A file in `spaces/` beside yours on your own
  server. On Turso each one is a new database, so accounts beyond the first
  work only once you set `TURSO_ORG` (your organisation's slug),
  `TURSO_API_TOKEN`, and `TURSO_GROUP_TOKEN` (a token for the group, `default`
  unless you set `TURSO_GROUP`).
- **Your server's settings stay yours.** `ANTHROPIC_API_KEY`, the Telegram bot
  and chat, `EXTENSION_TOKEN` and `MCP_TOKEN` serve the first account's space
  only. Other spaces get tokens of their own in their Settings and paste their
  own Anthropic key.

After twenty wrong passwords in ten minutes, sign-in is refused until the ten
minutes have passed.

### Upgrading from the shared password

Innkeep used to open with one shared password, `APP_PASSWORD`. That variable
is no longer read: remove it. After the update nobody is signed in, and **the
first account created takes the data already there**. Create yours right
after updating.

To close that window, set `OWNER_EMAIL` to your address before updating: then
only an account created with that address gets the existing data, and anyone
who signs up before you gets an empty space. Innkeep does not verify email
addresses, so someone who knows yours could still sign up with it first:
create your account soon either way.

Someone who is not signed in never reaches anyone's data: they are sent to
the sign-in page.

### A public demo

Add `PUBLIC_DEMO=1` to show Innkeep to visitors. They then get the public
pages and a dashboard on the sample bookings, which they can read but not
change, instead of the sign-in page. Settings and the extension pages stay
for people who are signed in. Do not combine it with `LANDING_ONLY`, which switches the dashboard
off altogether.

The addresses that machines call keep their own secrets and do not use the
session: the calendar links you give Airbnb and Booking.com, the browser
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
