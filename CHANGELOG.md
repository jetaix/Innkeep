# Changelog

What changed in Innkeep, newest first, written for the people who use it. The
format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
versions follow [Semantic Versioning](https://semver.org/). Before 1.0, a
minor version may change how things work.

## Unreleased

### Added

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
- An AI page on the website: what an assistant can do through the MCP server,
  how to connect one, and where it stops.
- A button to download the browser extension as a ZIP from the Extension page.
- Home-screen icons and an app manifest, so Innkeep installs like an app.

### Changed

- Every page works on a phone.
- Settings are in four tabs. Assistant moved into Suggestions and Data into Settings.
- The Pricing page is simpler and shows a year by default.
- Properties are shown as photo cards.
- The project uses bun for installs and scripts, and Biome for formatting and linting.

### Removed

- Guest messaging. Messages are read and answered on each platform.

### Fixed

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
