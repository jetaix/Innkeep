import { eq } from "drizzle-orm";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exportEvents } from "../../src/channels/sync";
import { appState, getDb, listings, properties, reservations } from "../../src/db";
import { addDays, today } from "../../src/lib/dates";
import { generateICal } from "../../src/lib/ical";
import { server } from "./app";
import { signedUp } from "./testing";

/** The host's cookie, once they have signed up in `beforeAll`. */
let session = "";
const EXTENSION = "the extension's token";
const CRON = "the scheduler's secret";
const MCP = "the assistant's token";
const ORIGIN = "http://innkeep.test";

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });
const call = (path: string, init?: RequestInit) => server.request(`${ORIGIN}${path}`, init);
const post = (path: string, body: unknown, token = EXTENSION) =>
  call(path, {
    method: "POST",
    headers: { ...bearer(token), "content-type": "application/json", "x-innkeep-extension": "0.13.1" },
    body: JSON.stringify(body),
  });

/** Every route a token guards, with the variable that holds the token. */
const GUARDED = [
  ["GET", "/api/cron", "CRON_SECRET", "Set CRON_SECRET to enable scheduled runs"],
  ["POST", "/api/mcp", "MCP_TOKEN", "Set MCP_TOKEN to enable the MCP server"],
  ["GET", "/api/mcp", "MCP_TOKEN", "Set MCP_TOKEN to enable the MCP server"],
  ["DELETE", "/api/mcp", "MCP_TOKEN", "Set MCP_TOKEN to enable the MCP server"],
  ["GET", "/api/extension/tour", "EXTENSION_TOKEN", "Set EXTENSION_TOKEN to enable the extension"],
  ["GET", "/api/extension/events", "EXTENSION_TOKEN", "Set EXTENSION_TOKEN to enable the extension"],
  ["GET", "/api/ingest/reservations", "EXTENSION_TOKEN", "Set EXTENSION_TOKEN to enable the extension"],
  ...["listing", "page", "preview", "prices", "quote", "reservations", "reviews"].map(
    (kind) =>
      [
        "POST",
        `/api/ingest/${kind}`,
        "EXTENSION_TOKEN",
        "Set EXTENSION_TOKEN to enable the extension",
      ] as const,
  ),
] as const;

let propertyId: number;

beforeAll(async () => {
  process.env.PUBLIC_DEMO = "1";
  process.env.EXTENSION_TOKEN = EXTENSION;
  process.env.CRON_SECRET = CRON;
  process.env.MCP_TOKEN = MCP;
  // A shell set up for deploying exports the host's own Telegram bot: no test may write to it.
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  delete process.env.APP_URL;
  session = (await signedUp()).cookie;
  const db = getDb();
  propertyId = (
    await db
      .insert(properties)
      .values({ name: "The host's flat", icalToken: "feed-token", createdAt: 0 })
      .returning({ id: properties.id })
      .get()
  ).id;
  await db
    .insert(listings)
    .values({ propertyId, channel: "airbnb", externalId: "4242", icalUrl: "https://example.test/cal.ics" })
    .run();
  await db
    .insert(reservations)
    .values([
      {
        propertyId,
        source: "booking",
        guestName: "A guest whose name stays private",
        checkIn: addDays(today(), 10),
        checkOut: addDays(today(), 13),
        createdAt: 0,
      },
      {
        propertyId,
        source: "airbnb",
        checkIn: addDays(today(), 20),
        checkOut: addDays(today(), 22),
        createdAt: 0,
      },
    ])
    .run();
});

/** Nothing here may reach the network; the one test that fetches a calendar brings its own answer. */
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("A test tried to reach the network.");
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  process.env.LANDING_ONLY = "";
  process.env.VERCEL = "";
  process.env.PUBLIC_DEMO = "1";
  process.env.EXTENSION_TOKEN = EXTENSION;
  process.env.CRON_SECRET = CRON;
  process.env.MCP_TOKEN = MCP;
});

describe("tokens", () => {
  it.each(GUARDED)("%s %s is off until its token is set", async (method, path, variable, message) => {
    process.env[variable] = "";
    const response = await call(path, { method, headers: bearer("anything") });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: message });
  });

  it.each(GUARDED)("%s %s refuses a wrong token", async (method, path) => {
    const wrong = await call(path, { method, headers: bearer("a guess") });
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "Unauthorized" });
    expect((await call(path, { method })).status).toBe(401);
  });

  it("does not take the host's session in place of a token", async () => {
    expect((await call("/api/cron", { headers: { cookie: session } })).status).toBe(401);
  });

  it("answers a method a route does not take with an empty 405", async () => {
    const response = await call("/api/cron", { method: "POST", headers: bearer(CRON) });
    expect(response.status).toBe(405);
    expect(await response.text()).toBe("");
    expect((await call("/api/ingest/prices", { headers: bearer(EXTENSION) })).status).toBe(405);
  });
});

describe("GET /api/cron", () => {
  it("imports every calendar and says what it did", async () => {
    const feed = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      "UID:from-airbnb",
      `DTSTART;VALUE=DATE:${addDays(today(), 40).replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${addDays(today(), 43).replaceAll("-", "")}`,
      "SUMMARY:Reserved",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const fetched = vi.fn(async () => new Response(feed));
    vi.stubGlobal("fetch", fetched);

    const response = await call("/api/cron", { headers: bearer(CRON) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      sync: { synced: 1, failed: 0 },
      notified: { needed: 0, cancelled: 0 },
      spaces: 1,
    });
    expect(fetched).toHaveBeenCalledTimes(1);
    // The stay landed in the host's data, not in the demo a visitor sees.
    const imported = await getDb()
      .select()
      .from(reservations)
      .where(eq(reservations.externalUid, "from-airbnb"))
      .get();
    expect(imported?.propertyId).toBe(propertyId);
  });
});

describe("GET /api/ical/:token/:file", () => {
  it("serves the feed a channel imports, byte for byte", async () => {
    for (const target of ["airbnb", "booking", "all"] as const) {
      const response = await call(`/api/ical/feed-token/${target}.ics`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
      expect(response.headers.get("cache-control")).toBe("no-store");
      const expected = generateICal("The host's flat", await exportEvents(propertyId, target));
      expect(Buffer.from(await response.arrayBuffer())).toEqual(Buffer.from(expected));
    }
  });

  it("leaves a channel's own bookings out of its feed", async () => {
    const airbnb = await (await call("/api/ical/feed-token/airbnb.ics")).text();
    expect(airbnb).toContain("Reserved (Booking.com)");
    expect(airbnb).not.toContain("Reserved (Airbnb)");
    expect(airbnb).not.toContain("private");
  });

  it("takes the address without its ending, and in capitals", async () => {
    const plain = await call("/api/ical/feed-token/all");
    expect(plain.status).toBe(200);
    expect(await (await call("/api/ical/feed-token/all.ICS")).text()).toBe(await plain.text());
  });

  it("knows nothing of an unknown token or calendar", async () => {
    for (const path of ["/api/ical/a-guess/all.ics", "/api/ical/feed-token/vrbo.ics"]) {
      const response = await call(path);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe("Not found");
    }
  });
});

describe("what the extension sends", () => {
  it("stores reservations in the host's data and notes the update", async () => {
    const response = await post("/api/ingest/reservations", {
      source: "airbnb",
      listingId: "4242",
      reservations: [
        {
          code: "HMABCDEF12",
          // A finished stay Innkeep has never seen is kept as history.
          checkIn: addDays(today(), -12),
          checkOut: addDays(today(), -9),
          guestName: "Ada",
          payout: 41200,
        },
      ],
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, added: 1 });
    const stored = await getDb()
      .select()
      .from(reservations)
      .where(eq(reservations.externalCode, "HMABCDEF12"))
      .get();
    expect(stored).toMatchObject({ propertyId, guestName: "Ada" });
    const seen = await getDb().select().from(appState).where(eq(appState.key, "extension")).get();
    expect(JSON.parse(seen?.value ?? "{}").version).toBe("0.13.1");
    expect(
      await getDb().select().from(appState).where(eq(appState.key, "updated:airbnb")).get(),
    ).toBeTruthy();
  });

  it("says what is wrong with a payload it cannot read", async () => {
    const invalid = await post("/api/ingest/reservations", { source: "vrbo", reservations: [] });
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toMatchObject({ error: "Invalid payload", issues: [{ path: ["source"] }] });

    const notJson = await call("/api/ingest/prices", {
      method: "POST",
      headers: bearer(EXTENSION),
      body: "not json",
    });
    expect(notJson.status).toBe(400);
    expect((await notJson.json()).error).toBe("Invalid payload");
  });

  it("names a listing it could not place", async () => {
    const response = await post("/api/ingest/quote", {
      source: "booking",
      listingId: "no-such-listing",
      checkIn: addDays(today(), 5),
      checkOut: addDays(today(), 7),
      total: 24000,
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "This is not one of your listings in Innkeep." });

    const known = await post("/api/ingest/quote", {
      source: "airbnb",
      listingId: "4242",
      checkIn: addDays(today(), 5),
      checkOut: addDays(today(), 7),
      total: 24000,
    });
    expect(known.status).toBe(200);
    expect(await known.json()).toEqual({ ok: true });
  });

  it("answers the connection test with the reservations pages", async () => {
    const response = await call("/api/ingest/reservations", { headers: bearer(EXTENSION) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, app: "innkeep", links: expect.any(Array) });
  });
});

describe("GET /api/extension/events", () => {
  it("says where to start from, in the language asked for", async () => {
    const response = await call("/api/extension/events?lang=fr-FR", { headers: bearer(EXTENSION) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, notifications: [] });
    expect(body.last).toBeGreaterThan(0);
    expect(body.test).toEqual(expect.any(Object));
    const english = await (await call("/api/extension/events", { headers: bearer(EXTENSION) })).json();
    expect(english.test).not.toEqual(body.test);
  });

  it("lists what happened since an event", async () => {
    const response = await call("/api/extension/events?after=0", { headers: bearer(EXTENSION) });
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.notifications.length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty("test");
  });

  it("refuses a query it cannot read", async () => {
    const response = await call("/api/extension/events?after=soon", { headers: bearer(EXTENSION) });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid query" });
  });
});

describe("GET /api/extension/tour", () => {
  it("lists the pages of a run and where it ends", async () => {
    const response = await call("/api/extension/tour?scope=all", { headers: bearer(EXTENSION) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      steps: expect.any(Array),
      doneUrl: `${ORIGIN}/settings?tab=data`,
    });
  });

  it("refuses a key that was never made", async () => {
    const response = await call("/api/extension/tour?key=made-up", { headers: bearer(EXTENSION) });
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "This link has expired. Press the button again." });
  });
});

describe("POST /api/mcp", () => {
  it("answers an assistant that carries the token", async () => {
    const response = await call("/api/mcp", {
      method: "POST",
      headers: {
        ...bearer(MCP),
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "0" },
        },
      }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ jsonrpc: "2.0", id: 1, result: { serverInfo: {} } });
  });
});

describe("GET /extension/start", () => {
  const start = (headers: Record<string, string>, query = "") =>
    call(`/extension/start${query}`, { headers, redirect: "manual" });

  it("refuses a link from another site", async () => {
    for (const site of ["cross-site", "same-site", "none"]) {
      const response = await start({ cookie: session, "sec-fetch-site": site });
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(`${ORIGIN}/settings?tab=data`);
    }
    expect((await start({ cookie: session })).headers.get("location")).toBe(`${ORIGIN}/settings?tab=data`);
  });

  it("sends a click inside Innkeep on with a key that works once", async () => {
    const response = await start({ cookie: session, "sec-fetch-site": "same-origin" }, "?scope=all");
    expect(response.status).toBe(303);
    const target = new URL(response.headers.get("location") ?? "");
    expect(target.origin + target.pathname).toBe(`${ORIGIN}/extension/run`);
    expect(target.searchParams.get("scope")).toBe("all");
    const key = target.searchParams.get("key") ?? "";
    expect(key.length).toBeGreaterThan(10);

    const tour = () => call(`/api/extension/tour?key=${key}`, { headers: bearer(EXTENSION) });
    const first = await tour();
    expect(first.status).toBe(200);
    expect((await first.json()).doneUrl).toBe(`${ORIGIN}/settings?tab=data`);
    expect((await tour()).status).toBe(410);
  });

  it("asks for reservations only unless told otherwise", async () => {
    const response = await start({ cookie: session, "sec-fetch-site": "same-origin" }, "?scope=everything");
    expect(new URL(response.headers.get("location") ?? "").searchParams.get("scope")).toBe("reservations");
  });

  it("makes no key for someone who is not signed in", async () => {
    const keys = async () =>
      (await getDb().select().from(appState).all()).filter(
        (row) => row.key.startsWith("run:") && row.key !== "run:all",
      ).length;
    const before = await keys();
    const visitor = await start({ "sec-fetch-site": "same-origin" });
    expect(visitor.status).toBe(307);
    expect(visitor.headers.get("location")).toBe(`${ORIGIN}/overview`);

    process.env.PUBLIC_DEMO = "";
    const stranger = await start({ "sec-fetch-site": "same-origin", cookie: "innkeep-session=a-guess" });
    expect(stranger.status).toBe(307);
    expect(stranger.headers.get("location")).toBe(`${ORIGIN}/login`);
    expect(await keys()).toBe(before);
  });
});

describe("landing-only", () => {
  it("answers every API route as if it did not exist", async () => {
    process.env.LANDING_ONLY = "1";
    const paths = [
      ...GUARDED.map(([method, path]) => [method, path] as const),
      ["GET", "/api/ical/feed-token/all.ics"],
      ["GET", "/api/app/overview"],
      ["GET", "/api/app/session"],
      ["POST", "/api/app/session"],
      ["GET", "/api/anything-else"],
    ] as const;
    for (const [method, path] of paths) {
      const response = await call(path, { method, headers: { ...bearer(EXTENSION), cookie: session } });
      expect([path, response.status]).toEqual([path, 404]);
      expect(await response.text()).toBe("");
    }
  });

  it("sends the refresh button's address to the home page", async () => {
    process.env.LANDING_ONLY = "1";
    const response = await call("/extension/start", {
      headers: { cookie: session, "sec-fetch-site": "same-origin" },
      redirect: "manual",
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
  });
});

describe("a second space", () => {
  it("has machines of its own, which never reach the host's data", async () => {
    const { signedUp: again } = await import("./testing");
    const other = await again("other@example.com", "Someone else");
    expect(other.space.store).not.toBe("");
    const asOther = { cookie: other.cookie, "content-type": "application/json" };

    // Their own token, handed to the extension by their own page.
    const page = await (await call("/api/app/extension", { headers: asOther })).json();
    expect(page.token).toMatch(/^x\d+\./);
    expect(page.token).not.toBe(EXTENSION);
    const events = await call("/api/extension/events", { headers: bearer(page.token) });
    expect(events.status).toBe(200);
    // A token altered to name the host's space is refused.
    const forged = page.token.replace(/^x\d+/, "x1");
    expect((await call("/api/extension/events", { headers: bearer(forged) })).status).toBe(401);

    // A property made there has a calendar link that names the space, and is not in the host's list.
    const made = await call("/api/app/properties", {
      method: "POST",
      headers: asOther,
      body: JSON.stringify({ name: "Their cabin" }),
    });
    const { id } = (await made.json()) as { id: number };
    const theirs = await (await call(`/api/app/properties/${id}`, { headers: asOther })).json();
    expect(theirs.property.icalToken).toMatch(new RegExp(`^s${other.space.id}-`));
    const feed = await call(`/api/ical/${theirs.property.icalToken}/all.ics`);
    expect(feed.status).toBe(200);
    expect(await feed.text()).toContain("Their cabin");
    expect((await call(`/api/ical/s${other.space.id}-a-guess/all.ics`)).status).toBe(404);

    const mine = await (await call("/api/app/properties", { headers: { cookie: session } })).json();
    expect(JSON.stringify(mine)).not.toContain("Their cabin");
    const others = await (await call("/api/app/properties", { headers: asOther })).json();
    expect(JSON.stringify(others)).not.toContain("Canal");
    expect((await (await call("/api/app/overview", { headers: asOther })).json()).properties).toBe(1);

    // The scheduler goes through both.
    const cron = await (await call("/api/cron", { headers: bearer(CRON) })).json();
    expect(cron).toMatchObject({ ok: true, spaces: 2 });
  });
});

describe("the app's API, mounted beside the machines", () => {
  it("still shows a visitor the demo and the host their own", async () => {
    const visitor = await (await call("/api/app/overview")).json();
    expect(visitor.properties).toBe(3);
    const host = await (await call("/api/app/overview", { headers: { cookie: session } })).json();
    expect(host.properties).toBe(1);
  });

  it("keeps its own wording for errors", async () => {
    process.env.PUBLIC_DEMO = "";
    const response = await call("/api/app/overview");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Sign in first." });
  });
});
