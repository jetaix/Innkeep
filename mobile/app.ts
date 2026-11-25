import type { Answer, Result, Sources, Store } from "./app.contract.d.ts";

/*
 * The data module: every request the screens make to the host's own Innkeep
 * (the API in `web/server`). The view never sees the session: it is kept in
 * the phone's keychain and sent as a bearer token.
 *
 * Innkeep is self-hosted, so its address is typed by the host: any https
 * origin, or http for one on the home network.
 */
const SESSION = "session";
export const grants = ["net.fetch https:", "net.fetch http:", `secret.keep ${SESSION}`].join("\n");

const API = "/api/app";

/** Why a read failed, for the view to put in words: `failure(x).code`. */
class Refused extends Error {
  constructor(readonly reason: "signed-out" | "server" | "answer") {
    super(reason);
  }
}

type Json = Record<string, unknown>;
const record = (value: unknown): Json => (value !== null && typeof value === "object" ? (value as Json) : {});
const list = (value: unknown): Json[] => (Array.isArray(value) ? value.map(record) : []);
const text = (value: unknown): string => (typeof value === "string" ? value : "");
const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (value: unknown): string => (typeof value === "string" && DAY.test(value) ? value : "");

function ask(server: string, store: Store, path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = store.get(SESSION);
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (init.body != null) headers.set("content-type", "application/json");
  return fetch(`${server}${API}${path}`, { ...init, headers, credentials: "omit", exactTimeout: 15000 });
}

/** A read: the answer's JSON, or a failure the view can name. No connection fails by itself. */
async function read(server: string, store: Store, path: string): Promise<Json> {
  const response = await ask(server, store, path);
  if (response.status === 401) throw new Refused("signed-out");
  if (!response.ok) throw new Refused("server");
  const body: unknown = await response.json().catch(() => null);
  if (body === null || typeof body !== "object") throw new Refused("answer");
  return body as Json;
}

/** A write: done, or the reason in a word the view translates. */
async function write(server: string, store: Store, path: string, method: string, body: unknown) {
  try {
    const response = await ask(server, store, path, { method, body: JSON.stringify(body) });
    if (response.ok) return { ok: true, error: "" };
    return {
      ok: false,
      error: response.status === 401 ? "signed-out" : response.status === 403 ? "demo" : "server",
    };
  } catch (e) {
    if ((e as { code?: string }).code === "bake") throw e;
    return { ok: false, error: "unreachable" };
  }
}

/** What was typed, as an origin: `innkeep.example.com` is https, an address with a scheme keeps it. */
export function origin(typed: string): string | null {
  const value = typed.trim();
  // An address has no spaces; some engines would encode them into a host that exists nowhere.
  if (value === "" || /\s/.test(value)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Nights between two day keys. */
export function nights(checkIn: string, checkOut: string): number {
  const span = Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`);
  return Number.isFinite(span) && span > 0 ? Math.round(span / 86_400_000) : 0;
}

/** Minor units as money, in the language on screen. Whole amounts drop their cents. */
export function money(minor: number, currency: string, locale: string): string {
  const cents = minor % 100 !== 0;
  const digits = cents ? 2 : 0;
  try {
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(digits)} ${currency}`;
  }
}

const sources: Sources = {
  // Signing in: is an Innkeep there, does it ask for a password, is this the one.
  signIn: async ([typed, password], store): Promise<Result<"signIn">> => {
    const refused = (error: string) => ({ ok: false, error, server: "" });
    const server = origin(typed);
    if (!server) return refused("address");
    try {
      const seen = await fetch(`${server}${API}/session`, { credentials: "omit", exactTimeout: 15000 });
      const session = record(await seen.json().catch(() => null));
      // With no demo offered, a password-protected Innkeep answers 401 here: it is one all the same.
      const asksPassword = seen.status === 401 || session.passwordSet === true;
      if (!asksPassword && typeof session.signedIn !== "boolean") return refused("not-innkeep");
      if (!asksPassword) {
        store.forget(SESSION);
        return { ok: true, error: "", server };
      }
      // No password typed: a public demo, where one is offered, opens to read.
      if (password === "" && session.demo === true) {
        store.forget(SESSION);
        return { ok: true, error: "", server };
      }
      if (password === "") return refused("password-needed");
      const answer = await fetch(`${server}${API}/session/native`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "omit",
        exactTimeout: 15000,
      });
      if (answer.status === 401) return refused("password");
      if (answer.status === 429) return refused("too-many");
      if (answer.status === 404) return refused("outdated");
      const token = text(record(await answer.json().catch(() => null)).token);
      if (!answer.ok || token === "") return refused("server");
      store.set(SESSION, token);
      return { ok: true, error: "", server };
    } catch (e) {
      if ((e as { code?: string }).code === "bake") throw e;
      return refused("unreachable");
    }
  },

  signOut: (_args, store): Result<"signOut"> => {
    store.forget(SESSION);
    return { ok: true, error: "" };
  },

  loadOverview: async ([server, locale], store): Promise<Result<"loadOverview">> => {
    const body = await read(server, store, "/overview");
    const currency = text(body.currency) || "EUR";
    const month = list(body.months)[0];
    return {
      server,
      properties: count(body.properties),
      arrivingToday: count(body.arrivingToday),
      occupancy: Math.min(1, Math.max(0, count(body.occupancy))),
      urgent: count(body.urgent),
      net: month ? money(count(month.net), currency, locale) : "",
      upcoming: list(body.upcoming).map((stay) => ({
        id: String(count(stay.id)),
        property: text(stay.property),
        guest: text(stay.guest),
        checkIn: day(stay.checkIn),
        checkOut: day(stay.checkOut),
      })),
    };
  },

  loadStays: async ([server, locale, today], store): Promise<Result<"loadStays">> => {
    const [body, places] = await Promise.all([
      read(server, store, "/stays"),
      read(server, store, "/properties"),
    ]);
    const properties = new Map(list(places.properties).map((place) => [count(place.id), place]));
    const clashing = new Set(Array.isArray(body.conflicts) ? body.conflicts.map(count) : []);
    return {
      server,
      items: list(body.stays)
        .filter(
          (stay) => stay.kind === "reservation" && day(stay.checkIn) !== "" && day(stay.checkOut) > today,
        )
        .map((stay) => {
          const place = properties.get(count(stay.propertyId));
          const checkIn = day(stay.checkIn);
          const checkOut = day(stay.checkOut);
          return {
            id: String(count(stay.id)),
            guest: text(stay.guestName),
            property: text(place?.name),
            source: text(stay.source),
            checkIn,
            checkOut,
            nights: nights(checkIn, checkOut),
            guests: count(stay.guests),
            amount:
              typeof stay.amount === "number"
                ? money(stay.amount, text(place?.currency) || "EUR", locale)
                : "",
            code: text(stay.externalCode),
            notes: text(stay.notes),
            now: checkIn <= today,
            clash: clashing.has(count(stay.id)),
          };
        }),
    };
  },

  loadCleaning: async ([server], store): Promise<Result<"loadCleaning">> => {
    const body = await read(server, store, "/cleaning");
    const today = day(body.today);
    const names = new Map(list(body.properties).map((place) => [count(place.id), text(place.name)]));
    return {
      server,
      items: list(body.schedule)
        // What is left to do, and what was done today: the past is the web app's business.
        .filter((item) => item.status !== "skipped" && day(item.date) !== "")
        .filter((item) => day(item.date) >= today || item.status === "pending")
        .slice(0, 40)
        .map((item) => {
          const propertyId = count(item.propertyId);
          const date = day(item.date);
          return {
            key: `${propertyId}-${date}`,
            propertyId: String(propertyId),
            property: names.get(propertyId) ?? "",
            date,
            from: text(item.from),
            sameDay: item.sameDay === true,
            done: item.status === "done",
            late: date < today,
            cleaner: text(record(item.cleaner).name),
            guest: text(record(item.after).guestName),
          };
        }),
    };
  },

  setCleaned: ([server, propertyId, date, done], store): Promise<Result<"setCleaned">> =>
    write(server, store, `/cleanings/${encodeURIComponent(propertyId)}/${encodeURIComponent(date)}`, "PUT", {
      status: done ? "done" : "pending",
    }),
};

export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
