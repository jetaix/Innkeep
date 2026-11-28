import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { type Context, Hono } from "hono";
import { getCookie } from "hono/cookie";
import { z } from "zod";
import { CHANNELS } from "../../src/channels";
import { exportEvents, findPropertyByToken, syncAll } from "../../src/channels/sync";
import { OTA_CHANNELS, type OtaChannel, type SpaceRef, withData, withSpace } from "../../src/db";
import { notifyCleanings } from "../../src/features/cleaning/notify";
import { consumeRunKey, createRunKey } from "../../src/features/extension/run";
import { recordExtension, recordFullRun, recordUpdate } from "../../src/features/extension/status";
import { tourSteps } from "../../src/features/extension/tour";
import { createMcpServer } from "../../src/features/mcp/server";
import { latestEventId, notificationsAfter } from "../../src/features/notifications/queries";
import { ingestPrices, ingestQuote, pricesSchema, quoteSchema } from "../../src/features/pricing/ingest";
import { ingestListing, listingSchema } from "../../src/features/properties/ingest";
import { ingestPage, pageSchema } from "../../src/features/properties/pages";
import { ingestPreview, previewIngestSchema } from "../../src/features/properties/preview";
import { ingestReservations, ingestSchema } from "../../src/features/reservations/ingest";
import { reservationLinks } from "../../src/features/reservations/platform-links";
import { ingestReviews, reviewsSchema } from "../../src/features/reviews/ingest";
import { DEFAULT_LOCALE, isLocale } from "../../src/i18n/config";
import { MESSAGES } from "../../src/i18n/messages";
import { everySpace, findSpace } from "../../src/features/members/queries";
import { serverSecret } from "../../src/features/members/secret";
import { hasBearerToken } from "../../src/lib/auth";
import { type MachineKind, machineSpace } from "../../src/lib/session";
import { generateICal } from "../../src/lib/ical";
import { decide, SESSION_COOKIE } from "./scope";

/**
 * The routes that machines call: the scheduler, the browser extension, an
 * MCP client, and the channels that import a calendar. Each is guarded by its
 * own token, not by the session, and the token says which space it works on:
 * a machine has no demo to look at.
 *
 * The handlers take a web `Request` and answer with a web `Response`, as the
 * Next.js route handlers they replace did, so what a machine receives has not
 * changed.
 */
type Handler = (request: Request, c: Context) => Response | Promise<Response>;

/** Runs a handler on the main database, whatever the request says about itself. */
const real = (handler: Handler) => (c: Context) => withData("real", async () => handler(c.req.raw, c));

const inSpace = <T>(space: SpaceRef, work: () => Promise<T>) =>
  withData("real", () => withSpace(space, work));

/** A token that is not set switches its routes off; a wrong one is refused. */
function refusal(request: Request, token: string | undefined, unset: string): Response | null {
  if (!token) return Response.json({ error: unset }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/**
 * Guards a route with a machine's token and runs it in that token's space.
 * A space's own token carries its number. Any other token is compared with
 * the one set on the server, which opens the host's space.
 */
const guarded =
  (kind: MachineKind, variable: "EXTENSION_TOKEN" | "MCP_TOKEN", unset: string, handler: Handler) =>
  async (c: Context) => {
    const request = c.req.raw;
    const sent = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const id = /^[xc]\d/.test(sent) ? machineSpace(await serverSecret(), kind, sent) : null;
    const space = id == null ? null : await findSpace(id);
    if (space) return inSpace(space, async () => handler(request, c));
    return (
      refusal(request, process.env[variable], unset) ?? withData("real", async () => handler(request, c))
    );
  };

/** The extension's routes: its token, and a note of which version called. */
const extension = (handler: Handler) =>
  guarded(
    "extension",
    "EXTENSION_TOKEN",
    "Set EXTENSION_TOKEN to enable the extension",
    async (request, c) => {
      await recordExtension(request);
      return handler(request, c);
    },
  );

const invalidPayload = (error: z.ZodError) =>
  Response.json({ error: "Invalid payload", issues: error.issues.slice(0, 5) }, { status: 400 });

/** The body as JSON, or null when it is not JSON: the schema then says what is wrong. */
const sent = (request: Request): Promise<unknown> => request.json().catch(() => null);

/**
 * One round of background work, for hosts with no process that stays awake:
 * imports every calendar of every space, then sends the Telegram messages that are due.
 *
 *   GET /api/cron
 *   Authorization: Bearer $CRON_SECRET
 */
async function cron(request: Request) {
  const denied = refusal(request, process.env.CRON_SECRET, "Set CRON_SECRET to enable scheduled runs");
  if (denied) return denied;

  const round = async () => {
    const sync = await syncAll();
    // A failed message must not hide the sync that worked; it is retried on the next run.
    const notified = await notifyCleanings().catch((cause: unknown) => ({
      error: cause instanceof Error ? cause.message : String(cause),
    }));
    return { sync, notified };
  };
  // Every space in turn, the host's first: its result is the one reported, as before.
  const [host, ...others] = await everySpace();
  const first = await inSpace(host, round);
  for (const space of others) {
    await inSpace(space, round).catch((error) => console.error(`[innkeep] space ${space.id} failed`, error));
  }
  return Response.json({ ok: true, ...first, spaces: others.length + 1 });
}

/**
 * Model Context Protocol endpoint (Streamable HTTP, stateless).
 *
 *   POST /api/mcp
 *   Authorization: Bearer $MCP_TOKEN
 *
 * Disabled until MCP_TOKEN is set, because it exposes the calendar and revenue.
 */
async function mcp(request: Request) {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await createMcpServer().connect(transport);
  return transport.handleRequest(request);
}

/**
 * The pages a run of the browser extension should go through.
 *
 *   GET /api/extension/tour?scope=reservations|all   (from the extension's popup)
 *   GET /api/extension/tour?key=…                    (from a button in Innkeep)
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
async function tour(request: Request) {
  const url = new URL(request.url);
  // A run started from a button in Innkeep carries a one-time key, which also fixes its scope.
  const key = url.searchParams.get("key");
  const keyed = key ? await consumeRunKey(key) : null;
  if (key && !keyed)
    return Response.json({ error: "This link has expired. Press the button again." }, { status: 410 });
  const scope = keyed ?? (url.searchParams.get("scope") === "all" ? "all" : "reservations");
  if (scope === "all") await recordFullRun();
  const origin = process.env.APP_URL?.replace(/\/$/, "") ?? url.origin;
  return Response.json({
    ok: true,
    steps: await tourSteps(scope),
    // Where the run ends: the page that shows what is now up to date.
    doneUrl: `${origin}/${scope === "all" ? "settings?tab=data" : "reservations"}`,
  });
}

const eventsQuery = z.object({
  after: z.coerce.number().int().min(0).optional(),
  lang: z.string().optional(),
});

/**
 * What the browser extension should notify the host about.
 *
 *   GET /api/extension/events?lang=fr            where to start from, and the "notifications are on" text
 *   GET /api/extension/events?after=12&lang=fr   what happened since event 12
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
async function events(request: Request) {
  const parsed = eventsQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const lang = parsed.data.lang?.slice(0, 2).toLowerCase();
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  if (parsed.data.after == null) {
    return Response.json({
      ok: true,
      last: await latestEventId(),
      notifications: [],
      test: MESSAGES[locale].notifications.test,
    });
  }
  return Response.json({ ok: true, ...(await notificationsAfter(parsed.data.after, locale)) });
}

/**
 * What the extension sends that either lands or names the listing it could
 * not place: one admin page, the public page, nightly prices, a quote, reviews.
 *
 *   POST /api/ingest/<kind>   { source, listingId, … }
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
function ingest<Input>(
  schema: z.ZodType<Input>,
  store: (input: Input) => Promise<{ ok: true } | { ok: false; error: string }>,
): Handler {
  return async (request) => {
    const parsed = schema.safeParse(await sent(request));
    if (!parsed.success) return invalidPayload(parsed.error);
    const result = await store(parsed.data);
    return result.ok ? Response.json(result) : Response.json({ error: result.error }, { status: 409 });
  };
}

/**
 * Receives one listing from the Innkeep browser extension.
 *
 *   POST /api/ingest/listing   { source, listingId, listingUrl, title?, description?, details?, … }
 */
async function listing(request: Request) {
  const parsed = listingSchema.safeParse(await sent(request));
  if (!parsed.success) return invalidPayload(parsed.error);
  const result = await ingestListing(parsed.data);
  if (result.status === "unknown") return Response.json({ error: result.error }, { status: 409 });
  return Response.json({ ok: true, ...result });
}

/** The extension's connection test; answers with the host's reservations pages. */
async function reservationsTest() {
  return Response.json({
    ok: true,
    app: "innkeep",
    // Where the extension's settings page sends the host next.
    links: (await reservationLinks()).map((link) => ({
      label: CHANNELS[link.channel].label,
      href: link.href,
    })),
  });
}

/**
 * Receives reservation details from the Innkeep browser extension.
 *
 *   POST /api/ingest/reservations   { source, reservations: [...] }
 */
async function reservations(request: Request) {
  const parsed = ingestSchema.safeParse(await sent(request));
  if (!parsed.success) return invalidPayload(parsed.error);
  const result = await ingestReservations(parsed.data);
  await recordUpdate(parsed.data.source, result.updated + result.unchanged + result.added);
  return Response.json({ ok: true, ...result });
}

/**
 * Public availability feed for one property, imported by the channels:
 *   /api/ical/<token>/airbnb.ics   → everything Airbnb does not know about
 *   /api/ical/<token>/booking.ics  → everything Booking.com does not know about
 *   /api/ical/<token>/all.ics      → every stay (for Google Calendar, cleaners…)
 *
 * The token in the address is the only guard: a channel cannot send a header.
 */
async function ical(token: string, file: string) {
  const target = file.replace(/\.ics$/i, "");
  if (target !== "all" && !(OTA_CHANNELS as readonly string[]).includes(target)) {
    return new Response("Not found", { status: 404 });
  }

  const feed = async () => {
    const property = await findPropertyByToken(token);
    if (!property) return null;
    const body = generateICal(property.name, await exportEvents(property.id, target as OtaChannel | "all"));
    return new Response(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  };
  // The host's space first: its links have no prefix. Another space's start with its number.
  const found = await withData("real", feed);
  if (found) return found;
  const id = token.match(/^s(\d{1,10})-/)?.[1];
  const space = id ? await findSpace(Number(id)) : null;
  return (space ? await inSpace(space, feed) : null) ?? new Response("Not found", { status: 404 });
}

/**
 * Where the "Refresh" buttons of Innkeep point. Makes a one-time key and
 * sends the browser to the page the extension watches for.
 *
 * Only a click inside Innkeep counts: a link from another site is refused,
 * so no other page can set a run going. It is a page's address, not an API
 * route, so it takes an admin's session: anyone else
 * is sent to sign in, back to the demo where one is offered, or to the pages
 * their role allows.
 */
async function start(request: Request, c: Context) {
  const url = new URL(request.url);
  const verdict = await decide("GET", getCookie(c, SESSION_COOKIE));
  if ("refuse" in verdict) return Response.redirect(new URL("/login", url), 307);
  if (!verdict.signedIn) return Response.redirect(new URL("/overview", url), 307);
  // Reading the platforms' pages changes the host's data: an admin's to start.
  if (verdict.role !== "admin") return Response.redirect(new URL("/cleaning", url), 303);
  if (request.headers.get("sec-fetch-site") !== "same-origin") {
    return Response.redirect(new URL("/settings?tab=data", url), 303);
  }
  const scope = url.searchParams.get("scope") === "all" ? "all" : "reservations";
  const target = new URL("/extension/run", url);
  target.searchParams.set("scope", scope);
  const { space } = verdict;
  if (!space) return Response.redirect(new URL("/overview", url), 307);
  target.searchParams.set("key", await inSpace(space, () => createRunKey(scope)));
  return Response.redirect(target, 303);
}

/** Next.js answered a method a route does not take with an empty 405; a machine that probes gets the same. */
const notAllowed = () => new Response(null, { status: 405 });

const mcpRoute = guarded("mcp", "MCP_TOKEN", "Set MCP_TOKEN to enable the MCP server", mcp);

export const machine = new Hono()
  .get("/api/cron", real(cron))
  .on(["GET", "POST", "DELETE"], "/api/mcp", mcpRoute)
  .get("/api/extension/tour", extension(tour))
  .get("/api/extension/events", extension(events))
  .post("/api/ingest/listing", extension(listing))
  .post("/api/ingest/page", extension(ingest(pageSchema, ingestPage)))
  .post("/api/ingest/preview", extension(ingest(previewIngestSchema, ingestPreview)))
  .post("/api/ingest/prices", extension(ingest(pricesSchema, ingestPrices)))
  .post("/api/ingest/quote", extension(ingest(quoteSchema, ingestQuote)))
  .get("/api/ingest/reservations", extension(reservationsTest))
  .post("/api/ingest/reservations", extension(reservations))
  .post("/api/ingest/reviews", extension(ingest(reviewsSchema, ingestReviews)))
  .get("/api/ical/:token/:file", (c) => ical(c.req.param("token"), c.req.param("file")))
  .get("/extension/start", real(start))
  .all("/api/cron", notAllowed)
  .all("/api/mcp", notAllowed)
  .all("/api/extension/:route{tour|events}", notAllowed)
  .all("/api/ingest/:kind{listing|page|preview|prices|quote|reservations|reviews}", notAllowed)
  .all("/api/ical/:token/:file", notAllowed)
  .all("/extension/start", notAllowed);
