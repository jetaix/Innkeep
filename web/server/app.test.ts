import { beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { app } from "./app";
import { signedUp } from "./testing";
import { decide } from "./scope";

/** The host's cookie, once they have signed up in `beforeAll`. */
let session = "";
const get = (path: string, cookie?: string) =>
  app.request(`/api/app${path}`, { headers: cookie ? { cookie } : undefined });
const send = (path: string, body: unknown, method = "POST") =>
  app.request(`/api/app${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("who sees which data", () => {
  beforeAll(async () => {
    process.env.PUBLIC_DEMO = "1";
    session = (await signedUp()).cookie;
    await getDb().insert(properties).values({ name: "The host's flat", icalToken: "t", createdAt: 0 }).run();
  });

  it("decides from the session, never from what the request claims", async () => {
    expect(await decide("GET", session.split("=")[1])).toMatchObject({
      scope: "real",
      signedIn: true,
      role: "admin",
      space: { store: "" },
    });
    expect(await decide("GET", undefined)).toMatchObject({ scope: "demo", signedIn: false });
    expect(await decide("POST", "not-a-session")).toMatchObject({ scope: "demo-readonly", signedIn: false });
    process.env.PUBLIC_DEMO = "";
    expect(await decide("GET", undefined)).toEqual({ refuse: 401 });
    process.env.PUBLIC_DEMO = "1";
  });

  it("shows a visitor the sample data, not the host's", async () => {
    const visitor = await (await get("/overview")).json();
    expect(visitor.properties).toBe(3);
    const host = await (await get("/overview", session)).json();
    expect(host.properties).toBe(1);
  });

  it("ignores a header that claims the host's data", async () => {
    const response = await app.request("/api/app/overview", { headers: { "x-innkeep-data": "real" } });
    expect((await response.json()).properties).toBe(3);
  });

  it("says who is asking", async () => {
    expect(await (await get("/session")).json()).toMatchObject({
      signedIn: false,
      demo: true,
    });
    expect(await (await get("/session", session)).json()).toMatchObject({
      signedIn: true,
      demo: false,
      role: "admin",
      member: { name: "The host", email: "host@example.com" },
    });
  });

  it("turns a visitor away when no demo is offered", async () => {
    process.env.PUBLIC_DEMO = "";
    expect((await get("/overview")).status).toBe(401);
    expect((await get("/overview", session)).status).toBe(200);
    process.env.PUBLIC_DEMO = "1";
  });

  it("gives the first account the main database, even in beta, and says so beforehand", async () => {
    // This file's host signed up first, with no owner named and the default mode.
    expect(await (await get("/account")).json()).toEqual({ mode: "beta", first: false });
    expect(
      (await send("/account", { name: "N", email: "n@example.com", password: "a long enough password" }))
        .status,
    ).toBe(403);
  });

  it("signs in with an email and a password, and counts the misses", async () => {
    const wrong = await send("/session", { email: "host@example.com", password: "a guess" });
    expect(wrong.status).toBe(401);
    expect(wrong.headers.get("set-cookie")).toBeNull();
    expect((await send("/session", { password: "a long enough password" })).status).toBe(401);

    const right = await send("/session", { email: "Host@Example.com", password: "a long enough password" });
    expect(right.status).toBe(200);
    expect(right.headers.get("set-cookie")).toContain(session);
    expect(right.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
