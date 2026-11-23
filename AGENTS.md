<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

Read [CONTRIBUTING.md](CONTRIBUTING.md) first: it describes the folder layout and the rules below in full.

- Routes in `src/app` stay thin. Reads go in `src/features/<name>/queries.ts`, writes in `actions.ts` (server actions validated with zod), pure logic in `compute.ts` / `rules.ts` with tests beside it.
- Request-time data is read in an async component inside `<Suspense>` that calls `await connection()` first.
- Schema changes append a migration to `MIGRATIONS` in `src/db/index.ts`.
- Money is stored in minor units; use `formatMoney` / `parseMoney`.
- Use the colour tokens in `src/app/globals.css`. Colour is reserved for booking sources and states.
- Every control is keyboard reachable and labelled. Page shortcuts use `data-shortcut`.
- Every page works on a phone (390 px wide): no sideways scrolling of the page, wide tables inside a `relative overflow-x-auto` wrapper, grids start at `grid-cols-1`, form fields at 16 px. Check it before finishing.
- No user-visible text in components: add it to `src/i18n/messages/<area>.ts` in English and French, read it with `getI18n()` (server) or `useI18n()` (client), and format dates and amounts with `fmt` from the same call.
- Use bun for installs and scripts (`bun install`, `bun run <script>`), and Biome for formatting and linting.
- Tests run with Vitest: `bun run test`, not `bun test`.
- Run `bun run check` before finishing.
