# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hosts who rent out one or two places on Airbnb and Booking.com, most of them
not technical: they have never opened a terminal and install Innkeep by
downloading a folder and double-clicking a file, or by handing a prepared
prompt to an AI assistant. They come first on the landing page.

Developers and self-hosters are the second audience. They meet Innkeep on
GitHub, read the docs, install it from the command line and may contribute.

## Product Purpose

Innkeep is an open-source, self-hosted channel manager. It keeps Airbnb and
Booking.com calendars in sync, shows what each month pays after costs, and
points out what needs fixing. It exists because channel managers are built and
priced for agencies, while a host with one or two places needs only a few
things done well.

On the public pages, success is a visitor who watches the product at work,
understands what it does and does not do, and then leaves an email address for
hosted early access, or goes to GitHub to self-host.

## Positioning

Two ways to use it. The hosted version is the one the landing page leads with;
it does not exist yet and the page says so: visitors leave an email address to
request early access. The self-hosted version exists today and is offered as
the second option, with a link to GitHub.

The self-hosted version:

Free, MIT-licensed and run on the host's own machine, with all data in one
SQLite file the host owns. It is not an approved partner of Airbnb or
Booking.com: it works from the calendar links every host is given, plus a
Chrome extension (in the repository) that reads the host's own platform pages.
It states its limits openly and points to alternatives when they fit better.

## Operating Context

- Two parts, both required: the app, and the Innkeep Chrome extension.
- Runs locally at `http://localhost:3000`; started with `start.command` (Mac),
  `start.bat` (Windows) or `npm run app`. Requires Node.js 22 or later.
- A landing-only mode (`LANDING_ONLY=1`) publishes just the landing and
  Alternatives pages; the dashboard is then unreachable.
- Public surfaces: the landing page, the Alternatives pages, the Markdown docs
  in `docs/`, and the GitHub repository page (`README.md`).

## Capabilities and Constraints

- Works: two-way calendar sync over iCal (every 15 minutes), double-booking
  detection, reservations, cleaning schedule, revenue after costs, price
  comparison across platforms, rule-based suggestions, optional advice from
  Claude, reviews, inbox via webhook, listing preview, MCP server, keyboard
  navigation, light and dark mode, English and French.
- Does not: change prices on the platforms, send replies to guests, prevent a
  double booking in the gap between iCal refreshes, offer login or multiple
  users.
- Using the extension carries a risk the docs state: the platforms' terms
  restrict automated data collection.
- Every user-visible string exists in English and French.
- In the dashboard, colour is reserved for the three booking sources and the
  good / warning / critical states.
- Undecided: whether the dashboard adopts the new public brand or keeps its
  current monochrome look.
- Undecided: the price of the hosted version, when it opens, and how it will
  handle login and the data it stores. Nothing on the pages may promise these.
- Early-access requests are taken only on the public website (`LANDING_ONLY=1`)
  and sent to the Telegram chat in `TELEGRAM_CHAT_ID`; that site keeps no database.

## Brand Commitments

- The name "Innkeep" stays. The logo may be redrawn.
- Not affiliated with Airbnb, Booking.com or Hospitable; the pages say so.
- Voice: plain and specific; says what happened and what to do next.
- Reference the owner named for the level of finish: ramp.com/glass.

## Evidence on Hand

- Dashboard screenshots in `docs/screenshots/` (overview, calendar, revenue,
  reservations, suggestions, property, inbox, settings).
- A working app with sample data ("Load sample data") that can be recorded.
- No testimonials, customer names, usage numbers, press or benchmarks exist.
  None may be invented.
- No product video exists yet.

## Product Principles

1. Small on purpose: a change must matter to a host with one or two places.
2. Honest about limits: say what it cannot do before the visitor finds out.
3. The host owns everything: the code, the machine it runs on, the data file.
4. Show the product working rather than describing it.
5. A non-technical host must be able to get from the page to a running app.

## Accessibility & Inclusion

Every control is keyboard reachable and labelled. Reduced-motion preferences
are respected. English and French are equal.
