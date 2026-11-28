# Changelog

What changed in Innkeep, newest first, written for the people who use it. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
versions follow [Semantic Versioning](https://semver.org/). Before 1.0, a
minor version may change how things work.

## Unreleased

### Added

- A loan can be edited, and takes the monthly payment you type, insurance
  included: that amount is what each month costs, instead of one worked out
  from the rate. Loans entered before keep their computed payment until edited.
- Suggestions read each listing as a guest does: a title that could be any
  place, a description in one block, too few photos, amenities ticked but
  never written about, what several reviews complain of, and low reviews left
  without a reply.
- Claude's advice now includes an audit of each listing (clarity, trust,
  conversion, search, the stay itself) with three titles and an opening
  paragraph to copy, written only from what the listing and the reviews say.
- Accounts. Anyone can create an account with a name, an email and a
  password, and signs in with them. Each account has an Innkeep of its own,
  empty and kept in a separate database; whoever creates it is its admin.
- Members with a role. An admin creates an invitation link in Settings and
  chooses the role; the person opens it, picks a password and is in. An admin
  sees and changes everything; a visitor sees the cleaning and the properties
  only, and can mark a cleaning as done.
- Sign-up is in beta by default: only the addresses the host approves can
  create an account. Requests for access are now kept and listed under
  Settings, Beta access, where the host approves them or adds an address.
  `SIGN_UP=open` takes anyone, `SIGN_UP=closed` nobody.
- Your account in Settings: change your password, sign out. An admin can make
  a link for a member who forgot theirs. Innkeep sends no email.
- Loans on the Revenue page: enter the amount borrowed, the rate, the duration
  and the insurance, and the monthly payment counts as a cost until the last
  one. Each loan shows what is still owed and what the borrowing costs.
- The Revenue page opens on one question per property: is it profitable? A
  verdict, what an average month leaves or costs, and the income, charges and
  loan behind it.
- A loan takes its bank's amortisation table, read from the bank's PDF or a CSV
  file, or pasted: each month then costs exactly what the bank takes.
- Clicking a reservation on the Reservations page opens its details in a panel
  beside the list, where the guest name, payout and notes can be changed.
- A line chart of reservations per month on the Reservations page.

- A public demo (`PUBLIC_DEMO=1`): visitors see a read-only dashboard on
  sample bookings, and the host signs in at `/login` to see their own.

- A new look for the public pages and a redrawn logo: two overlapping doorways.
- The landing page takes early-access requests for a hosted version, and
  presents the self-hosted one as the second way to use Innkeep.
- Four guides for small hosts, in English and French: syncing calendars,
  avoiding double bookings, choosing a free channel manager, and working out
  what a month pays.
- A password for the whole app (`APP_PASSWORD`), a Docker image, and support
  for a hosted database, so Innkeep can run on a server.
- Telegram messages for each cleaning to arrange, with a ready-to-send message
  for the cleaner.
- Month and year views in the calendar; a view by month and an overview on the
  Reservations page; a view by year on Revenue; filtering reviews by stars.
- The design file is public: `/design` shows it with its colours and type,
  and `/design.md` serves the file itself.
- An AI page on the website: what an assistant can do through the MCP server,
  how to connect one, and where it stops.
- A button to download the browser extension as a ZIP from the Extension page.
- Home-screen icons and an app manifest, so Innkeep installs like an app.

### Changed

- **Breaking:** `APP_PASSWORD` is gone, and an Innkeep with no password is no
  longer open to anyone who reaches it: everyone signs in with an account.
  The first account created takes the data already there, so create yours
  right after updating; set `OWNER_EMAIL` to your address beforehand and only
  that address can take it. On Turso, accounts beyond the first need
  `TURSO_ORG`, `TURSO_API_TOKEN` and `TURSO_GROUP_TOKEN`.
- The server's own settings (`ANTHROPIC_API_KEY`, the Telegram bot and chat,
  `EXTENSION_TOKEN`, `MCP_TOKEN`) serve the first account's space only. Other
  spaces have tokens of their own, shown in their Settings.
- The Revenue chart shows each month as two bars side by side: what came in
  and what went out.
- The Booking.com reservations page opens on arrivals from today to
  31 December of next year.
- Every page works on a phone.
- Settings are in four tabs. Assistant moved into Suggestions and Data into Settings.
- The Pricing page is simpler and shows a year by default.
- Properties are shown as photo cards.
- The project uses bun for installs and scripts, and Biome for formatting and linting.

### Removed

- The Next.js app. Innkeep has run on the app in `web/` since the previous
  change; `bun run dev:next` and `bun run build:next` are gone.
- Guest messaging. Messages are read and answered on each platform.

### Fixed

- The address in `OWNER_EMAIL` gets the data already there in every case: it
  joins the members invited under the shared password, and an account that
  signed up before the variable was set moves there the next time it signs in.
- In the public demo, a visitor could trigger the host's Telegram test
  message, list the chats of the host's bot, or start a paid request for
  advice. Those actions are now for the host only.

- With a password set, a request from someone not signed in could be aimed at
  the sign-in page to run a save against the host's data. Such requests now
  only ever see the sample data.

- The extension refused pages opened from Innkeep, and could loop on
  Booking.com's sign-in page.
- Telegram requests hung on hosts without IPv6.
- Tests could reach a hosted database when its address was set in the shell.

## 0.2.0 - 2026-11-19

The first version in this repository.

### Added

- One calendar for Airbnb and Booking.com, with two-way sync over calendar
  links and double bookings flagged.
- Reservations, a cleaning schedule, revenue after costs, a price comparison
  across platforms, reviews, and suggestions drawn from your own data.
- Optional advice written by Claude, and an MCP server for AI assistants.
- The Innkeep Companion browser extension, which reads guest names, payouts,
  prices and reviews from your own Airbnb and Booking.com pages.
- Pages comparing Innkeep with other channel managers.
- English and French, light and dark mode, keyboard navigation.
