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

Innkeep is the app in `web/`: pages in `web/src/routes`, their parts in
`web/src/features/<name>`, the design system in `web/src/ui` and
`web/src/tokens.stylex.ts`, and the server in `web/server` (`app.ts` for the
dashboard's API, `machine.ts` for the calendar feeds, the extension, MCP and
the scheduler, `serve.ts` for a machine of your own, `vercel.ts` for Vercel).
`bun run dev` starts it at http://localhost:3000.

The logic it runs is shared code under `src/`, with no framework in it:

```
src/
  features/<name>/     One folder per product area
    queries.ts         Reads (server only)
    mutations.ts       Writes, validated with zod
    compute.ts, rules.ts   Pure logic, unit tested, also run in the browser
  channels/            Airbnb and Booking.com adapters, sync engine
  db/                  Schema, migrations, sample data
  i18n/                Languages: messages/<area>.ts (English and French side by side), formats
  lib/                 Dates, money, iCal, small helpers
extension/             Innkeep browser extension (plain JS, no build step)
```

Conventions:

- **Pages read and write through the API.** A page asks for data with a query
  from `web/src/api/queries.ts` and changes it with a mutation from
  `mutations.ts`; each mutation names the queries it makes stale. The handler
  in `web/server` stays thin and calls `src/features/<name>`.
- **Server code stays out of the browser.** A file that reads the database or
  a secret starts with `import "server-only"`. Pages may import the pure files
  of `src/` (`compute.ts`, `rules.ts`, messages, `lib/`), nothing else.
- **Pure logic stays pure.** Revenue maths and suggestion rules take plain rows
  and return plain values, so they are tested without a database.
- **Schema changes** append a migration to `MIGRATIONS` in `src/db/index.ts`.
  Never edit one that has shipped.
- **Who sees which data** is decided in `web/server/scope.ts` and enforced in
  `src/db`: every request to the pages' API runs inside the data its session
  may see, so a visitor of the demo never reaches the host's database. The
  addresses in `web/server/machine.ts` have no session and see the host's
  data: each one must keep its own token check.
- **Money** is stored in minor units (cents). Use `formatMoney` and `parseMoney`.
- **Colour means something.** The interface is monochrome; the only colours
  are the three booking sources and good / warning / critical. Use the tokens
  in `web/src/tokens.stylex.ts`, never raw hex values.
- **Keyboard and screen readers.** Every action must be reachable by keyboard
  and every control labelled. Add page shortcuts with `data-shortcut="key"`.
- **Phones first-class.** Hosts check bookings and cleanings from a phone, so
  every page must work at 390 px wide. The page itself never scrolls
  sideways: a wide table or calendar goes inside a wrapper that scrolls
  (`position: relative; overflow-x: auto`; `relative` keeps
  screen-reader-only text from widening the page), and a grid that gains
  columns at a breakpoint starts at one column. Form fields are 16 px on
  phones, or iOS zooms in on focus; the shared `Input`, `Select` and
  `Textarea` do this, so do not make their text smaller on a narrow screen.
  Buttons and fields grow to 40 px on touch screens. What only makes sense on
  a computer, such as starting the browser extension, is hidden on a narrow
  screen. Look at your change in a phone-sized window before
  opening a pull request.
- **Copy** is plain and specific: say what happened and what to do next.
- **Every string is in two languages.** No text in components: add it to
  `src/i18n/messages/<area>.ts` in English and French (the French object is
  typed from the English one, so a missing translation fails the type check).
  Components read it with `useI18n("<area>")`, and a route's loader calls
  `loadMessages("<area>")` so the text downloads beside the data. Dates and amounts go through `fmt` from the same call, not
  through `lib/` directly.
- **Light and dark** are separate token sets in `web/src/tokens.stylex.ts`. The host's
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
