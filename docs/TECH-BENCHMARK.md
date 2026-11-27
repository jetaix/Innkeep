# Technology benchmark

What Innkeep is built with, what else was considered, and why. The yardstick
is the project's goal: a channel manager a single host can self-host in five
minutes and a contributor can understand in an afternoon.

## Decision summary

| Layer            | Chosen                               | Runner-up            | Why                                                                               |
| ---------------- | ------------------------------------ | -------------------- | --------------------------------------------------------------------------------- |
| App framework    | **Vite + React SPA with a Hono API** | Next.js (App Router) | Pages are static files; one API serves the pages, the phone app and the extension |
| Language         | **TypeScript**                       | —                    | Shared types from database to UI                                                  |
| Database         | **SQLite** (libSQL, file or Turso)   | PostgreSQL           | Zero setup; a host's data is a few thousand rows                                  |
| ORM              | **Drizzle**                          | Prisma               | SQL-shaped, no codegen step, no engine binary, portable to Postgres later         |
| Styling          | **StyleX**                           | Tailwind CSS         | Styles are typed, sit beside their component and compile to one small stylesheet  |
| Calendar UI      | **Custom CSS timeline**              | FullCalendar         | The multi-property timeline is FullCalendar's paid tier; ours is ~100 lines       |
| iCal             | **Hand-written parser** (~150 lines) | node-ical / ical.js  | Feeds only use all-day VEVENTs; no recurrence or timezone engine needed           |
| Validation       | **zod**                              | Hand-written checks  | One schema validates forms, the AI's structured output and MCP tool inputs        |
| Command menu     | **The browser's own `<dialog>`**     | cmdk                 | A filtered list in a native dialog covers it without a dependency                 |
| UI primitives    | **Own components** (~250 lines)      | shadcn/ui            | A handful of buttons, fields and badges does not need a component kit             |
| AI advice        | **Anthropic SDK**, structured output | Vercel AI SDK        | Optional feature with one provider: one dependency and one key                    |
| Assistant access | **MCP SDK**, stateless HTTP          | Custom REST API      | Works with any MCP client with no client code to write                            |
| Tests            | **Vitest**                           | node:test            | Path aliases and TypeScript without config                                        |

## Frontend / app framework

|                                   | Next.js                                  | Vite React SPA + API                    | React Router 7 (Remix) | SvelteKit      | Laravel / Rails           |
| --------------------------------- | ---------------------------------------- | --------------------------------------- | ---------------------- | -------------- | ------------------------- |
| Processes to deploy               | 1                                        | 2 (or a static build served by the API) | 1                      | 1              | 1 + queue worker          |
| Server-side data loading          | Server components                        | Hand-written REST + client fetching     | Loaders                | Load functions | Controllers + views       |
| Mutations                         | Server actions                           | REST endpoints + client state           | Actions                | Form actions   | Controllers               |
| Public endpoints (iCal, webhooks) | Route handlers                           | Yes                                     | Resource routes        | Endpoints      | Yes                       |
| Contributor pool                  | Largest                                  | Largest                                 | Medium                 | Smaller        | Large, different language |
| Background jobs                   | In-process timer (fine for one instance) | Same                                    | Same                   | Same           | First-class queues        |

**What was chosen.** Innkeep was first built on Next.js, with server
components and server actions, and now runs as a client-rendered app
(`web/src`) over an HTTP API (`web/server`, Hono on Bun). The public pages are
written to static HTML at build; the dashboard is drawn in the browser from
the API's answers, with the same pure functions the server uses. The one API
is also what the phone app and the browser extension talk to.

**What it costs.** There is a REST layer and a client-side cache to keep in
step: every change names the queries it makes stale (`web/src/api`). The
server and the build need Bun.

**When to revisit.** Real-time messaging (websockets from a partner API) or
heavy scheduled work (pricing rules, automated messages) would justify a
separate worker process. The code in `src/` has no framework imports, so it
can move into one unchanged.

## Database

|                                        | SQLite                               | PostgreSQL                     |
| -------------------------------------- | ------------------------------------ | ------------------------------ |
| Setup                                  | None, one file                       | Server or managed service      |
| Backup                                 | Copy the file                        | pg_dump / provider snapshots   |
| Concurrency                            | One writer, plenty for one host      | Many writers                   |
| Hosting                                | Any VPS, Docker volume, Fly, Railway | Anywhere, including serverless |
| Serverless platforms (Vercel, Netlify) | Not suitable: no persistent disk     | Works                          |

SQLite keeps the "clone, `bun run dev`, done" promise. The trade-off is that
Innkeep needs a host with a persistent disk. Drizzle's query code is nearly
identical for Postgres, so a hosted multi-tenant version would swap the driver
and schema imports rather than rewrite queries.

## Channel integration, the constraint that shapes everything

| Capability                         | Airbnb                            | Booking.com                             | Open route used here                                                           |
| ---------------------------------- | --------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| Availability calendar              | iCal export/import for every host | iCal export/import for every host       | **iCal, both directions**                                                      |
| Reservation details (guest, price) | Partner API only                  | Connectivity Partner API only           | Host types the guest name; feed gives dates and, on Airbnb, a reservation link |
| Listing content                    | Partner API only                  | Content API for connectivity partners   | Master copy + per-channel overrides, copy/paste, drift tracking                |
| Guest messaging                    | Partner API only                  | Messaging API for connectivity partners | Inbound webhook; replies drafted here and pasted                               |
| Rates                              | Partner API only                  | Connectivity Partner API only           | Not attempted                                                                  |

Hospitable, Hostaway, Guesty and the rest are approved software partners of
both platforms; that approval is a business agreement, not something an
open-source project can ship in a repository. Scraping or automating the host
dashboards instead would break both platforms' terms and put host accounts at
risk, so Innkeep does not do it.

iCal has real limits worth knowing: channels poll feeds on their own schedule
(from minutes to a few hours), so two guests can still book the same night on
two platforms inside that window. Innkeep detects and flags those overlaps but
cannot prevent them. Only partner APIs give instant availability updates.

The `ChannelAdapter` type in `src/channels/index.ts` is the extension point:
an adapter that implements `pushContent` and `sendMessage` (for example, backed
by your own partner credentials, or a channel-manager API you already pay for)
turns the "copy and paste" steps into real pushes without touching the UI.
