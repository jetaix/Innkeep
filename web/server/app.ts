import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { appState, getDb, withData } from "../../src/db";
import { getSuggestions } from "../../src/features/insights/queries";
import { findConflicts, getProperties, getStays } from "../../src/features/reservations/queries";
import { occupancyAhead } from "../../src/features/revenue/compute";
import { getRevenue } from "../../src/features/revenue/queries";
import { addDays, today } from "../../src/lib/dates";
import {
  appPassword,
  passwordMatches,
  publicDemo,
  recentFailures,
  SESSION_DAYS,
  sessionValue,
  tooManyAttempts,
} from "../../src/lib/session";
import { decide, SESSION_COOKIE } from "./scope";

export type SessionData = { signedIn: boolean; demo: boolean; passwordSet: boolean };

export type OverviewData = {
  properties: number;
  currency: string;
  arrivingToday: number;
  occupancy: number;
  urgent: number;
  months: { month: string; net: number }[];
  upcoming: { id: number; property: string; guest: string | null; checkIn: string; checkOut: string }[];
};

/** Wrong passwords are counted in the host's own data, so the limit holds across servers. */
const FAILURES = "sign-in-failures";

async function failures(): Promise<number[]> {
  const row = await withData("real", () =>
    getDb().select().from(appState).where(eq(appState.key, FAILURES)).get(),
  );
  try {
    const parsed: unknown = JSON.parse(row?.value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((at) => typeof at === "number") : [];
  } catch {
    return [];
  }
}

type Env = { Variables: { signedIn: boolean } };

/** The API the client-rendered app talks to. Machine routes (iCal, ingest, MCP, cron) join it in a later phase. */
export const app = new Hono<Env>().basePath("/api/app");

// Signing in and out are the only things someone without a session may ask of the host's side.
app.post("/session", async (c) => {
  const password = appPassword();
  if (!password) return c.json({ ok: true });
  const given = z.object({ password: z.string().max(500) }).safeParse(await c.req.json().catch(() => null));
  const now = Date.now();
  const earlier = await failures();
  if (tooManyAttempts(earlier, now)) return c.json({ error: "Too many attempts. Try again in ten minutes." }, 429);
  if (!given.success || !passwordMatches(given.data.password, password)) {
    const value = JSON.stringify([...recentFailures(earlier, now), now]);
    await withData("real", () =>
      getDb()
        .insert(appState)
        .values({ key: FAILURES, value })
        .onConflictDoUpdate({ target: appState.key, set: { value } })
        .run(),
    );
    await new Promise((resolve) => setTimeout(resolve, 800));
    return c.json({ error: "That is not the password. Check it and try again." }, 401);
  }
  setCookie(c, SESSION_COOKIE, sessionValue(password), {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: c.req.header("x-forwarded-proto") === "https",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
  return c.json({ ok: true });
});

app.delete("/session", (c) => {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

/**
 * Everything below reads or writes data. Each request is wrapped in the data
 * it may see, so no handler can reach the host's database by mistake.
 */
app.use("*", async (c, next) => {
  const verdict = decide(c.req.method, getCookie(c, SESSION_COOKIE));
  if ("refuse" in verdict) return c.json({ error: "Sign in first." }, 401);
  c.set("signedIn", verdict.signedIn);
  await withData(verdict.scope, next);
});

app.get("/session", (c) =>
  c.json<SessionData>({
    signedIn: c.get("signedIn"),
    demo: !c.get("signedIn") && publicDemo(),
    passwordSet: appPassword() != null,
  }),
);

app.get("/overview", async (c) => {
  const properties = await getProperties();
  const now = today();
  const stays = (await getStays(addDays(now, -1))).filter((stay) => stay.checkOut > now);
  const guests = stays.filter((stay) => stay.kind === "reservation");
  const revenue = await getRevenue({ monthsBack: 0, monthsAhead: 1 });
  const { active } = await getSuggestions("en");
  const name = (id: number) => properties.find((property) => property.id === id)?.name ?? "";
  // Kept for the calendar and the list, which arrive with their own endpoints.
  findConflicts(stays);
  return c.json<OverviewData>({
    properties: properties.length,
    currency: revenue.currency,
    arrivingToday: guests.filter((stay) => stay.checkIn === now).length,
    occupancy:
      properties.length === 0
        ? 0
        : properties.reduce((sum, property) => sum + occupancyAhead(property.id, guests, now, 30), 0) /
          properties.length,
    urgent: active.filter((suggestion) => suggestion.severity === "urgent").length,
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
});

app.onError((error, c) => {
  // drizzle wraps what the database layer throws.
  const cause = (error as { cause?: { name?: string } }).cause;
  if (error.name === "DemoReadOnlyError" || cause?.name === "DemoReadOnlyError") {
    return c.json({ error: "This is a demo: changes are not saved." }, 403);
  }
  console.error(error);
  return c.json({ error: "Something went wrong." }, 500);
});
