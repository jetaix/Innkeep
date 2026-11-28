import path from "node:path";
import { and, count, eq, gte, lte } from "drizzle-orm";
import { type Context, Hono } from "hono";
import { z } from "zod";
import { CHANNELS } from "../../src/channels";
import { effectiveContent, publishState } from "../../src/channels/content";
import {
  getDb,
  guestQuotes,
  listings,
  nightlyPrices,
  OTA_CHANNELS,
  properties,
  reservations,
  reviews,
} from "../../src/db";
import { hasSampleData } from "../../src/db/seed";
import { getKeyStatus } from "../../src/features/assistant/key";
import { getCleaning } from "../../src/features/cleaning/queries";
import { getTelegramChat } from "../../src/features/cleaning/telegram-chat";
import { installFacts } from "../../src/features/extension/install";
import { getExtensionStatus, REQUIRED_EXTENSION } from "../../src/features/extension/status";
import { countToRefresh, getDataSources, olderThanADay } from "../../src/features/freshness/sources";
import { AI_MODEL, aiConfigured } from "../../src/features/insights/ai";
import { getAdvice, getSuggestions } from "../../src/features/insights/queries";
import { getPricing, PRICING_WINDOWS } from "../../src/features/pricing/queries";
import { parseChannelDetails } from "../../src/features/properties/ingest";
import { adminPhotos, getPages } from "../../src/features/properties/pages";
import { readPreview } from "../../src/features/properties/preview";
import {
  calendarLinks,
  guestViewLinks,
  publicPageLinks,
  reservationLinks,
  reviewPageLinks,
} from "../../src/features/reservations/platform-links";
import { findConflicts, getProperties, getStays } from "../../src/features/reservations/queries";
import { getSetupProgress, getSetupProperty, getSetupSummary } from "../../src/features/setup/queries";
import { occupancyAhead } from "../../src/features/revenue/compute";
import { getInvitations, getMembers } from "../../src/features/members/queries";
import { getCharges, getCosts, getRevenue, getRevenueYears } from "../../src/features/revenue/queries";
import { LOCALES } from "../../src/i18n/config";
import { addDays, today } from "../../src/lib/dates";
import { isPrivateAddress } from "../../src/lib/net";
import { hostSetting } from "../../src/lib/host";
import { machineToken, publicDemo } from "../../src/lib/session";
import { serverSecret } from "../../src/features/members/secret";
import { inHostSpace } from "../../src/db";
import { telegramBot } from "../../src/lib/telegram";
import { badRequest, type Env, hostOnly, notFound } from "./env";

/** The folder Innkeep itself is in: the extension is loaded from a folder beside this one. */
const ROOT = path.resolve(import.meta.dirname, "../..");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const id = z.coerce.number().int().positive();

/** Reads a request's query against a schema, or answers 400 with what was wrong. */
function query<T>(schema: z.ZodType<T>, given: Record<string, string>): T {
  const parsed = schema.safeParse(given);
  if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Check the address.");
  return parsed.data;
}

/** A number from the address; anything else names nothing that exists. */
function idOf(raw: string): number {
  const parsed = id.safeParse(raw);
  if (!parsed.success) throw notFound("That property");
  return parsed.data;
}

/**
 * The token a machine sends for the space of this request. The host's space
 * uses the one set on the server (none set: switched off); every other space
 * has its own, made from its number.
 */
async function machineTokenOf(c: Context<Env>, kind: "extension" | "mcp"): Promise<string | null> {
  const space = c.get("space");
  if (!space || inHostSpace()) return hostSetting(kind === "mcp" ? "MCP_TOKEN" : "EXTENSION_TOKEN") ?? null;
  return machineToken(await serverSecret(), kind, space.id);
}
const extensionToken = (c: Context<Env>) => machineTokenOf(c, "extension");

async function propertyOr404(propertyId: number) {
  const property = await getDb().select().from(properties).where(eq(properties.id, propertyId)).get();
  if (!property) throw notFound("That property");
  return property;
}

/**
 * Everything the pages read, one address per resource. Each handler runs
 * inside the data its request may see (see `app.ts`), so a visitor's request
 * is answered from the sample data without any handler having to check.
 */
export const read = new Hono<Env>()
  // Who is asking: signed in, or looking at the demo.
  .get("/session", (c) =>
    c.json({
      signedIn: c.get("signedIn"),
      demo: !c.get("signedIn") && publicDemo(),
      // What the person may do, and who they are.
      role: c.get("role"),
      member: c.get("member"),
    }),
  )

  // Who has access, and the invitations still waiting. A visitor's role never reaches this.
  .get("/members", async (c) => {
    const space = c.get("space");
    if (!space) throw hostOnly();
    return c.json({ members: await getMembers(space.id), invitations: await getInvitations(space.id) });
  })

  // The figures at the top of the overview, in one request.
  .get("/overview", async (c) => {
    const places = await getProperties();
    const now = today();
    const stays = (await getStays(addDays(now, -1))).filter((stay) => stay.checkOut > now);
    const guests = stays.filter((stay) => stay.kind === "reservation");
    const revenue = await getRevenue({ monthsBack: 0, monthsAhead: 1 });
    const { active } = await getSuggestions("en");
    const name = (propertyId: number) => places.find((place) => place.id === propertyId)?.name ?? "";
    return c.json({
      properties: places.length,
      currency: revenue.currency,
      arrivingToday: guests.filter((stay) => stay.checkIn === now).length,
      occupancy:
        places.length === 0
          ? 0
          : places.reduce((sum, place) => sum + occupancyAhead(place.id, guests, now, 30), 0) / places.length,
      urgent: active.filter((item) => item.severity === "urgent").length,
      months: revenue.summaries.map((summary) => ({ month: summary.month, net: summary.net })),
      upcoming: guests
        .filter((stay) => stay.checkIn >= now)
        .slice(0, 6)
        .map((stay) => ({
          id: stay.id,
          property: name(stay.propertyId),
          guest: stay.guestName || null,
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
        })),
    });
  })

  // What the sidebar counts.
  .get("/nav", async (c) => {
    const locale = query(z.object({ locale: z.enum(LOCALES).default("en") }), c.req.query()).locale;
    const urgent = (await getSuggestions(locale)).active.filter((item) => item.severity === "urgent").length;
    return c.json({
      urgent,
      toRefresh: countToRefresh(await getDataSources()),
      // Sample data is on screen: the page says so on every screen.
      sample: await hasSampleData(),
    });
  })

  .get("/properties", async (c) => {
    const all = await getDb().select().from(listings).all();
    const places = await getProperties();
    return c.json({
      properties: places,
      listings: all.map((listing) => {
        const place = places.find((candidate) => candidate.id === listing.propertyId);
        return {
          ...listing,
          preview: readPreview(listing),
          // Whether the details last published on the platform are still the ones kept here.
          state: place ? publishState(place, listing) : ("never" as const),
        };
      }),
    });
  })

  .get("/properties/:id", async (c) => {
    const property = await propertyOr404(idOf(c.req.param("id")));
    const own = await getDb().select().from(listings).where(eq(listings.propertyId, property.id)).all();
    // Where the platforms fetch this property's calendars from.
    const origin =
      process.env.APP_URL?.replace(/\/$/, "") ??
      `${c.req.header("x-forwarded-proto") ?? "http"}://${c.req.header("host")}`;
    return c.json({
      property,
      listings: await Promise.all(
        own.map(async (listing) => ({
          ...listing,
          details: parseChannelDetails(listing.channelDetails),
          pages: await getPages(listing.id),
          state: publishState(property, listing),
          // The title and description this platform should show: the master copy plus its overrides.
          content: effectiveContent(property, listing),
        })),
      ),
      // Which platforms take listing details through an API.
      pushesContent: Object.fromEntries(
        OTA_CHANNELS.map((channel) => [channel, CHANNELS[channel].capabilities.content] as const),
      ),
      origin,
      // Innkeep runs on an address the platforms cannot open (this computer, a home network).
      unreachable: isPrivateAddress(origin),
      extensionOn: Boolean(await extensionToken(c)),
    });
  })

  // The public listing as guests see it, side by side for each platform.
  .get("/properties/:id/preview", async (c) => {
    const property = await propertyOr404(idOf(c.req.param("id")));
    const own = await getDb().select().from(listings).where(eq(listings.propertyId, property.id)).all();
    const photos = Object.fromEntries(
      await Promise.all(
        OTA_CHANNELS.map(async (channel) => [channel, await adminPhotos(property.id, channel)] as const),
      ),
    );
    return c.json({
      property,
      listings: own.map((listing) => ({ ...listing, preview: readPreview(listing) })),
      quotes: await getDb().select().from(guestQuotes).where(eq(guestQuotes.propertyId, property.id)).all(),
      adminPhotos: photos,
      publicLinks: await publicPageLinks(property.id),
      extensionOn: Boolean(await extensionToken(c)),
    });
  })

  // Stays in a period, with the ones that clash and where to open each on its platform.
  .get("/stays", async (c) => {
    const range = query(z.object({ from: isoDate.optional(), to: isoDate.optional() }), c.req.query());
    const stays = await getStays(range.from ?? addDays(today(), -1), range.to);
    return c.json({
      stays,
      conflicts: [...findConflicts(stays)],
      // Where the extension can read each platform's reservations; empty when it is not set up.
      links: (await extensionToken(c)) ? await reservationLinks() : [],
    });
  })

  // How the calendar links are doing: when they were last read and how many fail.
  .get("/feeds", async (c) => {
    const feeds = (await getDb().select().from(listings).all()).filter((listing) => listing.icalUrl);
    return c.json({
      count: feeds.length,
      lastSync: Math.max(0, ...feeds.map((listing) => listing.lastSyncedAt ?? 0)),
      failing: feeds.filter((listing) => listing.lastSyncError).length,
    });
  })

  .get("/cleaning", async (c) => c.json(await getCleaning()))

  .get("/revenue", async (c) => {
    const range = query(
      z.object({
        back: z.coerce.number().int().min(0).max(36).default(1),
        ahead: z.coerce.number().int().min(0).max(36).default(4),
      }),
      c.req.query(),
    );
    return c.json(await getRevenue({ monthsBack: range.back, monthsAhead: range.ahead }));
  })
  .get("/revenue/years", async (c) => c.json(await getRevenueYears()))
  // `costs` is what the figures count: the charges, and each loan as its monthly payment.
  .get("/charges", async (c) => c.json({ charges: await getCharges(), costs: await getCosts() }))

  .get("/pricing", async (c) => {
    const asked = query(
      z.object({
        property: id,
        plan: z.string().max(200).optional(),
        days: z.coerce
          .number()
          .refine((days) => (PRICING_WINDOWS as readonly number[]).includes(days))
          .default(PRICING_WINDOWS[0])
          // A period that is not offered shows the default one, as a missing one does.
          .catch(PRICING_WINDOWS[0]),
      }),
      c.req.query(),
    );
    const property = await propertyOr404(asked.property);
    const pricing = await getPricing(asked.property, asked.plan, asked.days);
    const extensionOn = Boolean(await extensionToken(c));
    const noLinks: Awaited<ReturnType<typeof guestViewLinks>> = {};
    return c.json({
      pricing,
      /** The periods the page offers; the first is the default. */
      windows: PRICING_WINDOWS,
      calendarLinks: await calendarLinks(asked.property),
      /** The public listing for each sample stay, in the order of `pricing.guestChecks`. */
      guestLinks: await Promise.all(
        pricing.guestChecks.map((check) =>
          extensionOn
            ? guestViewLinks(property.id, check.checkIn, check.checkOut, property.maxGuests)
            : noLinks,
        ),
      ),
      /** Whether a run of the extension can be started from here: see `ExtensionStatus`. */
      extension: (await getExtensionStatus()).state,
      extensionOn,
    });
  })

  .get("/reviews", async (c) => {
    const all = await getDb().select().from(reviews).all();
    const places = await getProperties();
    const links = Object.fromEntries(
      await Promise.all(places.map(async (place) => [place.id, await reviewPageLinks(place.id)] as const)),
    );
    // The state alone: a visitor of the demo may know whether reviews can be read, not the details.
    return c.json({ reviews: all, links, extension: (await getExtensionStatus()).state });
  })

  .get("/suggestions", async (c) => {
    const locale = query(z.object({ locale: z.enum(LOCALES).default("en") }), c.req.query()).locale;
    return c.json(await getSuggestions(locale));
  })
  .get("/advice", async (c) => {
    // How much real data the model would get today, so thin advice is no surprise.
    const db = getDb();
    const now = today();
    const realStays = await db
      .select({ total: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.kind, "reservation"),
          eq(reservations.status, "confirmed"),
          lte(reservations.checkOut, now),
          gte(reservations.amount, 1),
        ),
      )
      .get();
    const freePrices = await db
      .select({ total: count() })
      .from(nightlyPrices)
      .where(gte(nightlyPrices.date, now))
      .get();
    return c.json({
      advice: await getAdvice(),
      configured: await aiConfigured(),
      // Where Claude's key comes from (never the key itself) and which model answers.
      claude: {
        // The end of the host's key is the host's own business: a visitor of the demo sees none.
        key: c.get("signedIn") ? await getKeyStatus() : ({ source: null } as const),
        model: AI_MODEL,
        realStays: realStays?.total ?? 0,
        freePrices: freePrices?.total ?? 0,
      },
    });
  })

  // How fresh each piece of data read from the platforms is.
  .get("/freshness", async (c) => {
    const sources = await getDataSources();
    return c.json({
      sources,
      toRefresh: countToRefresh(sources),
      // What the host is asked to refresh on opening Innkeep: the lines not read for over a day.
      old: olderThanADay(sources).map((source) => source.id),
      // Whether the extension can be asked to read: decides what the "refresh" buttons offer.
      extension: (await getExtensionStatus()).state,
    });
  })

  // Below: how this Innkeep is set up. The demo has nothing to show there.
  .get("/extension", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    const token = await extensionToken(c);
    return c.json({
      status: await getExtensionStatus(),
      required: REQUIRED_EXTENSION,
      // What the setup guide gives the host to paste in the extension's settings. The address is
      // the public one when it is configured; otherwise the page uses the one it was opened at.
      origin: process.env.APP_URL?.replace(/\/$/, "") ?? null,
      token: token || null,
      ...installFacts(ROOT),
      // The host's own reservations page on each platform, to read one at a time.
      links: token ? await reservationLinks() : [],
    });
  })

  // The "Add a property" guide: what a waiting step asks every few seconds, then the property being set up.
  .get("/setup/progress", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json(await getSetupProgress());
  })
  .get("/setup/:id", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    const propertyId = idOf(c.req.param("id"));
    const found = await getSetupProperty(propertyId);
    if (!found) throw notFound("That property");
    return c.json({
      property: { id: found.property.id, name: found.property.name },
      listings: found.listings.map((listing) => ({
        channel: listing.channel,
        icalUrl: listing.icalUrl,
        lastSyncError: listing.lastSyncError,
      })),
      summary: await getSetupSummary(propertyId),
    });
  })
  .get("/settings", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json({
      // The host's own space takes its tokens from the server's settings; any other has its own, shown here.
      hostSpace: inHostSpace(),
      mcpTokenSet: Boolean(await machineTokenOf(c, "mcp")),
      mcpToken: inHostSpace() ? null : await machineTokenOf(c, "mcp"),
      extensionTokenSet: Boolean(await extensionToken(c)),
      telegram: { bot: telegramBot(), chat: await getTelegramChat() },
      claude: { configured: await aiConfigured(), key: await getKeyStatus(), model: AI_MODEL },
      // On a serverless host a scheduler calls /api/cron; there is no timer to show.
      sync: {
        hosted: Boolean(process.env.VERCEL),
        scheduled: Boolean(process.env.CRON_SECRET),
        interval: Number(process.env.SYNC_INTERVAL_MINUTES ?? 15),
      },
      // The public address when one is configured; otherwise the page uses the one it was opened at.
      appUrl: process.env.APP_URL?.replace(/\/$/, "") ?? null,
    });
  });
