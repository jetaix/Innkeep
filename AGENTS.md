## Project conventions

Read [CONTRIBUTING.md](CONTRIBUTING.md) first: it describes the folder layout and the rules below in full.

- The app is in `web/`: a client-rendered Vite app (TanStack Router and Query, StyleX) and the Hono server it talks to (`web/server`). What both share is in `src/`: reads in `src/features/<name>/queries.ts`, writes in `mutations.ts` (validated with zod, no framework), pure logic in `compute.ts` / `rules.ts` with tests beside it.
- A page reads through `web/src/api/queries.ts` and changes things through `web/src/api/mutations.ts`; each has its address in `web/server/read.ts` or `write.ts`. Addresses that machines call (extension, iCal, MCP, cron) are in `web/server/machine.ts`, each behind its own token.
- Schema changes append a migration to `MIGRATIONS` in `src/db/index.ts`.
- Money is stored in minor units; use `formatMoney` / `parseMoney`.
- Style with StyleX and the tokens in `web/src/tokens.stylex.ts`. Colour is reserved for booking sources and states.
- Every control is keyboard reachable and labelled. Page shortcuts use `data-shortcut`.
- Every page works on a phone (390 px wide): no sideways scrolling of the page, wide tables inside a wrapper that scrolls sideways (`position: relative; overflow-x: auto`), grids start at one column, form fields at 16 px. Check it before finishing.
- No user-visible text in components: add it to `src/i18n/messages/<area>.ts` in English and French, read it with `useI18n("<area>")`, and format dates and amounts with `fmt` from the same call.
- Use bun for installs and scripts (`bun install`, `bun run <script>`), and Biome for formatting and linting.
- Tests run with Vitest: `bun run test`, not `bun test`.
- Run `bun run check` before finishing.
