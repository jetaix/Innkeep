import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { getDb, guestQuotes, listings, OTA_CHANNELS, properties, reviews } from "../../src/db";
import { getKeyStatus } from "../../src/features/assistant/key";
import { getCleaning } from "../../src/features/cleaning/queries";
import { getTelegramChat } from "../../src/features/cleaning/telegram-chat";
import { getExtensionStatus, REQUIRED_EXTENSION } from "../../src/features/extension/status";
import { countToRefresh, getDataSources } from "../../src/features/freshness/sources";
import { aiConfigured } from "../../src/features/insights/ai";
import { getAdvice, getSuggestions } from "../../src/features/insights/queries";
import { getPricing, PRICING_WINDOWS } from "../../src/features/pricing/queries";
import { parseChannelDetails } from "../../src/features/properties/ingest";
import { adminPhotos, getPages } from "../../src/features/properties/pages";
import { readPreview } from "../../src/features/properties/preview";
import {
  calendarLinks,
  publicPageLinks,
  reservationLinks,
  reviewPageLinks,
} from "../../src/features/reservations/platform-links";
import { findConflicts, getProperties, getStays } from "../../src/features/reservations/queries";
import { occupancyAhead } from "../../src/features/revenue/compute";
import { getCharges, getRevenue, getRevenueYears } from "../../src/features/revenue/queries";
import { LOCALES } from "../../src/i18n/config";
import { addDays, today } from "../../src/lib/dates";
import { appPassword, publicDemo } from "../../src/lib/session";
import { telegramBot } from "../../src/lib/telegram";
import { badRequest, type Env, hostOnly, notFound } from "./env";

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
      passwordSet: appPassword() != null,
    }),
  )

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
    return c.json({ urgent, toRefresh: countToRefresh(await getDataSources()) });
  })

  .get("/properties", async (c) => {
    const all = await getDb().select().from(listings).all();
    return c.json({
      properties: await getProperties(),
      listings: all.map((listing) => ({ ...listing, preview: readPreview(listing) })),
    });
  })

  .get("/properties/:id", async (c) => {
    const property = await propertyOr404(idOf(c.req.param("id")));
    const own = await getDb().select().from(listings).where(eq(listings.propertyId, property.id)).all();
    return c.json({
      property,
      listings: await Promise.all(
        own.map(async (listing) => ({
          ...listing,
          details: parseChannelDetails(listing.channelDetails),
          pages: await getPages(listing.id),
        })),
      ),
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
    });
  })

  // Stays in a period, with the ones that clash and where to open each on its platform.
  .get("/stays", async (c) => {
    const range = query(z.object({ from: isoDate.optional(), to: isoDate.optional() }), c.req.query());
    const stays = await getStays(range.from ?? addDays(today(), -1), range.to);
    return c.json({ stays, conflicts: [...findConflicts(stays)], links: await reservationLinks() });
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
  .get("/charges", async (c) => c.json({ charges: await getCharges() }))

  .get("/pricing", async (c) => {
    const asked = query(
      z.object({
        property: id,
        plan: z.string().max(200).optional(),
        days: z.coerce
          .number()
          .refine((days) => (PRICING_WINDOWS as readonly number[]).includes(days))
          .default(PRICING_WINDOWS[0]),
      }),
      c.req.query(),
    );
    await propertyOr404(asked.property);
    return c.json({
      pricing: await getPricing(asked.property, asked.plan, asked.days),
      calendarLinks: await calendarLinks(asked.property),
      extensionOn: Boolean(process.env.EXTENSION_TOKEN),
    });
  })

  .get("/reviews", async (c) => {
    const all = await getDb().select().from(reviews).all();
    const places = await getProperties();
    const links = Object.fromEntries(
      await Promise.all(places.map(async (place) => [place.id, await reviewPageLinks(place.id)] as const)),
    );
    return c.json({ reviews: all, links });
  })

  .get("/suggestions", async (c) => {
    const locale = query(z.object({ locale: z.enum(LOCALES).default("en") }), c.req.query()).locale;
    return c.json(await getSuggestions(locale));
  })
  .get("/advice", async (c) => c.json({ advice: await getAdvice(), configured: await aiConfigured() }))

  // How fresh each piece of data read from the platforms is.
  .get("/freshness", async (c) => c.json({ sources: await getDataSources() }))

  // Below: how this Innkeep is set up. The demo has nothing to show there.
  .get("/extension", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json({ status: await getExtensionStatus(), required: REQUIRED_EXTENSION });
  })
  .get("/settings", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json({
      passwordSet: appPassword() != null,
      mcpTokenSet: Boolean(process.env.MCP_TOKEN),
      extensionTokenSet: Boolean(process.env.EXTENSION_TOKEN),
      telegram: { bot: telegramBot(), chat: await getTelegramChat() },
      claude: { configured: await aiConfigured(), key: await getKeyStatus() },
    });
  });
