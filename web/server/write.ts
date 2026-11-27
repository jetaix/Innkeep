import { Hono } from "hono";
import { validator } from "hono/validator";
import { z } from "zod";
import * as assistant from "../../src/features/assistant/mutations";
import * as cleaning from "../../src/features/cleaning/mutations";
import * as insights from "../../src/features/insights/mutations";
import * as place from "../../src/features/properties/mutations";
import * as stay from "../../src/features/reservations/mutations";
import * as revenue from "../../src/features/revenue/mutations";
import * as setup from "../../src/features/setup/mutations";
import { LOCALES } from "../../src/i18n/config";
import { badRequest, type Env, hostOnly } from "./env";

const done = { ok: true as const };
const locale = z.object({ locale: z.enum(LOCALES).default("en") });

/** A number from the address, or 400. */
function num(raw: string): number {
  const parsed = z.coerce.number().int().positive().safeParse(raw);
  if (!parsed.success) throw badRequest("That address names nothing.");
  return parsed.data;
}

/**
 * What was sent, as an object. Declared on each route that takes a body, so
 * the client knows it may send one; the change itself checks every field.
 */
const json = validator(
  "json",
  (value): Record<string, unknown> =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : {},
);

/**
 * Every change the pages can make, one address each. The changes themselves
 * live in `src/features/<name>/mutations.ts`, with no framework in them.
 *
 * A visitor of the demo may call any of these: the database refuses their
 * writes. The few that reach outside the database (Telegram, Anthropic)
 * would spend the host's own accounts, so only the host may call them.
 */
export const write = new Hono<Env>()
  // Costs
  .post("/charges", json, async (c) => c.json({ id: await revenue.addCharge(c.req.valid("json")) }))
  .delete("/charges/:id", async (c) => {
    await revenue.deleteCharge(num(c.req.param("id")));
    return c.json(done);
  })

  .post("/loans", json, async (c) => c.json({ id: await revenue.addLoan(c.req.valid("json")) }))
  .put("/loans/:id/schedule", json, async (c) =>
    c.json({ lines: await revenue.importSchedule(num(c.req.param("id")), c.req.valid("json")) }),
  )
  .delete("/loans/:id/schedule", async (c) => {
    await revenue.clearSchedule(num(c.req.param("id")));
    return c.json(done);
  })
  .delete("/loans/:id", async (c) => {
    await revenue.deleteLoan(num(c.req.param("id")));
    return c.json(done);
  })

  // Suggestions and advice
  .post("/suggestions/dismiss", json, async (c) => {
    const { key } = z.object({ key: z.string().min(1).max(200) }).parse(c.req.valid("json"));
    await insights.dismissSuggestion(key);
    return c.json(done);
  })
  .post("/suggestions/restore", async (c) => {
    await insights.restoreSuggestions();
    return c.json(done);
  })
  .post("/advice", json, async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json(await insights.requestAdvice(locale.parse(c.req.valid("json")).locale));
  })

  // Claude's key
  .post("/claude", json, async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    const sent = c.req.valid("json");
    return c.json(await assistant.connectClaude(sent.apiKey, locale.parse(sent).locale));
  })
  .delete("/claude", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    await assistant.disconnectClaude();
    return c.json(done);
  })

  // Properties and their listings
  .post("/properties", json, async (c) => c.json({ id: await place.createProperty(c.req.valid("json")) }))
  .put("/properties/:id", json, async (c) => {
    await place.updateProperty(num(c.req.param("id")), c.req.valid("json"));
    return c.json(done);
  })
  .delete("/properties/:id", async (c) => {
    await place.deleteProperty(num(c.req.param("id")));
    return c.json(done);
  })
  .put("/properties/:id/listings/:channel", json, async (c) =>
    c.json({
      id: await place.saveListing(num(c.req.param("id")), c.req.param("channel"), c.req.valid("json")),
    }),
  )
  .post("/listings/:id/sync", async (c) => {
    await place.syncOne(num(c.req.param("id")));
    return c.json(done);
  })
  .post("/listings/:id/published", async (c) =>
    c.json({ published: await place.markPublished(num(c.req.param("id"))) }),
  )
  // The "Add a property" guide: saves the calendar links and reads each at once, which
  // reaches the address given, so only the host may ask.
  .put("/setup/:id/calendars", json, async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json(await setup.connectCalendars(num(c.req.param("id")), c.req.valid("json")));
  })
  // Imports every calendar; with `onlyIfStale`, only when the last import is old.
  .post("/sync", json, async (c) => {
    const { onlyIfStale } = z.object({ onlyIfStale: z.boolean().default(false) }).parse(c.req.valid("json"));
    if (onlyIfStale) return c.json({ synced: await place.syncIfStale() });
    await place.syncEverything();
    return c.json({ synced: true });
  })
  .post("/sample-data", async (c) => {
    await place.loadSampleData();
    return c.json(done);
  })
  .delete("/sample-data", async (c) => {
    await place.clearSampleData();
    return c.json(done);
  })

  // Stays and blocked dates
  .post("/stays", json, async (c) => c.json({ id: await stay.createReservation(c.req.valid("json")) }))
  .put("/stays/:id", json, async (c) => {
    await stay.updateReservation(num(c.req.param("id")), c.req.valid("json"));
    return c.json(done);
  })
  .delete("/stays/:id", async (c) => {
    await stay.deleteReservation(num(c.req.param("id")));
    return c.json(done);
  })

  // Cleaners and cleanings
  .post("/cleaners", json, async (c) => c.json({ id: await cleaning.addCleaner(c.req.valid("json")) }))
  .delete("/cleaners/:id", async (c) => {
    await cleaning.deleteCleaner(num(c.req.param("id")));
    return c.json(done);
  })
  .put("/properties/:id/cleaners/:priority", json, async (c) => {
    await cleaning.assignCleaner(
      num(c.req.param("id")),
      Number(c.req.param("priority")),
      c.req.valid("json"),
    );
    return c.json(done);
  })
  .put("/properties/:id/cleaning", json, async (c) => {
    const { enabled } = z.object({ enabled: z.boolean() }).parse(c.req.valid("json"));
    await cleaning.setCleaningEnabled(num(c.req.param("id")), enabled);
    return c.json(done);
  })
  .post("/cleanings", json, async (c) => {
    await cleaning.addManualCleaning(c.req.valid("json"));
    return c.json(done);
  })
  // One cleaning day: its status, where the request to the cleaner stands, or its note and cleaner.
  .put("/cleanings/:propertyId/:date", json, async (c) => {
    const { propertyId, date } = c.req.param();
    const sent = c.req.valid("json");
    if ("status" in sent) await cleaning.setCleaningStatus(propertyId, date, sent.status);
    if ("request" in sent) await cleaning.setCleaningRequest(propertyId, date, sent.request);
    if ("notes" in sent || "cleanerId" in sent) await cleaning.updateCleaning(propertyId, date, sent);
    return c.json(done);
  })
  .delete("/cleanings/:propertyId/:date", async (c) => {
    await cleaning.removeManualCleaning(num(c.req.param("propertyId")), c.req.param("date"));
    return c.json(done);
  })

  // Telegram: each of these talks to the host's own bot.
  .post("/telegram/test", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json(await cleaning.sendTelegramTest());
  })
  .post("/telegram/chats", async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json(await cleaning.listTelegramChats());
  })
  .put("/telegram/chat", json, async (c) => {
    if (!c.get("signedIn")) throw hostOnly();
    return c.json({ kept: await cleaning.chooseTelegramChat(c.req.valid("json")) });
  });
