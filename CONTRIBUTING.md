# Contributing

Thanks for helping. Innkeep is small on purpose, so the bar for a change is
that a host with one or two properties would notice it.

## Setup

```bash
bun install
bun run dev
```

Open http://localhost:3000/overview and click **Load sample data**. Delete the
`data/` folder to start again from empty.

## Before you open a pull request

```bash
bun run check
```

That runs formatting, lint, types, tests and a production build, the same
steps as CI.

`bun install` points git at the hooks in `.githooks`: format, lint, types and
tests run before every `git push`, and a failure stops the push. GitHub Actions
runs the same checks plus the build on every push to `main` and every pull
request ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## How the code is organised

```
src/
  app/                 Routes only: pages compose features, API routes stay thin
    (marketing)/       Landing page
    (app)/             The dashboard, behind the sidebar shell
    api/               iCal export, messages webhook, MCP
  features/<name>/     One folder per product area
    queries.ts         Reads (server only)
    actions.ts         Writes, as server actions validated with zod
    *.tsx              Components used by that feature's pages
    compute.ts, rules.ts   Pure logic, unit tested
  channels/            Airbnb and Booking.com adapters, sync engine (no Next.js imports)
  components/ui/       Presentational primitives with no data access
  components/shell/    Sidebar, command menu and keyboard layer
  db/                  Schema, migrations, sample data
  i18n/                Languages: messages/<area>.ts (English and French side by side), formats
extension/             Innkeep Companion browser extension (plain JS, no build step)
  lib/                 Dates, money, iCal, small helpers
```

Conventions:

- **Server first.** Pages are server components that read through `queries.ts`.
  Add `"use client"` only for real interactivity.
- **Request-time data** sits in an async component inside `<Suspense>` that
  calls `await connection()` first. Next.js 16 Cache Components requires it.
- **Pure logic stays pure.** Revenue maths and suggestion rules take plain rows
  and return plain values, so they are tested without a database.
- **Schema changes** append a migration to `MIGRATIONS` in `src/db/index.ts`.
  Never edit one that has shipped.
- **Money** is stored in minor units (cents). Use `formatMoney` and `parseMoney`.
- **Colour means something.** The interface is monochrome; the only colours
  are the three booking sources and good / warning / critical. Use the tokens
  in `globals.css`, never raw hex values.
- **Keyboard and screen readers.** Every action must be reachable by keyboard
  and every control labelled. Add page shortcuts with `data-shortcut="key"`.
- **Phones first-class.** Hosts check bookings and cleanings from a phone, so
  every page must work at 390 px wide. The page itself never scrolls
  sideways: a wide table or calendar goes inside a `relative overflow-x-auto`
  wrapper (`relative` keeps screen-reader-only text from widening the page),
  and a grid that gains columns at a breakpoint starts at `grid-cols-1`.
  Form fields are 16 px on phones, or iOS zooms in on focus; the shared
  `Input`, `Select` and `Textarea` do this, so do not override their text
  size below `md:`. Buttons and fields grow to 40 px on touch screens. What
  only makes sense on a computer, such as starting the browser extension, is
  hidden below `md:`. Look at your change in a phone-sized window before
  opening a pull request.
- **Copy** is plain and specific: say what happened and what to do next.
- **Every string is in two languages.** No text in components: add it to
  `src/i18n/messages/<area>.ts` in English and French (the French object is
  typed from the English one, so a missing translation fails the type check).
  Server components read it with `await getI18n()`, client components with
  `useI18n()`. Dates and amounts go through `fmt` from the same call, not
  through `lib/` directly.
- **Light and dark** are separate token sets in `globals.css`. The host's
  choice is a `data-theme` attribute on `<html>`; never branch on the system
  setting in a component.

## What will not be merged

- Anything that acts on Airbnb or Booking.com unattended: background or
  scheduled crawling, calls to their private APIs, automated clicking, typing
  or form filling, or handling a host's password or session. The extension
  reads pages in the host's own browser. Its one form of automation is the
  run the host starts from its popup: a single visible tab taken through a
  fixed list of the host's own pages, with a Stop button, that ends by itself.
  Keep it that way.
- Features that only make sense for agencies with dozens of listings.
