import { beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { app } from "./app";

const call = (method: string, path: string, cookie?: string, body?: unknown) =>
  app.request(`/api/app${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const cookieOf = (answer: Response) => answer.headers.get("set-cookie")?.split(";")[0] ?? "";
const password = "a long enough password";
const account = (email: string) => call("POST", "/account", undefined, { name: "Someone", email, password });
const names = async (cookie: string) =>
  (
    (await (await call("GET", "/properties", cookie)).json()) as { properties: { name: string }[] }
  ).properties.map((property) => property.name);

/** The owner is named after the main database already has people in it. */
describe("the owner's address, named late", () => {
  beforeAll(async () => {
    process.env.PUBLIC_DEMO = "";
    process.env.OWNER_EMAIL = "";
    process.env.SIGN_UP = "open";
    await getDb().insert(properties).values({ name: "The host's flat", icalToken: "t", createdAt: 0 }).run();
  });

  it("comes back to the data already there when it signs in", async () => {
    // Someone else was first and holds the main database; the owner got an empty space.
    expect(await names(cookieOf(await account("first@example.com")))).toEqual(["The host's flat"]);
    expect(await names(cookieOf(await account("owner@example.com")))).toEqual([]);

    process.env.OWNER_EMAIL = "owner@example.com";
    const back = await call("POST", "/session", undefined, { email: "Owner@Example.com", password });
    expect(await back.json()).toEqual({ ok: true, role: "admin" });
    expect(await names(cookieOf(back))).toEqual(["The host's flat"]);
  });

  it("joins the members already there when it signs up", async () => {
    process.env.OWNER_EMAIL = "late@example.com";
    process.env.SIGN_UP = "closed";
    expect(await names(cookieOf(await account("late@example.com")))).toEqual(["The host's flat"]);
    expect((await account("nobody@example.com")).status).toBe(403);
  });
});
