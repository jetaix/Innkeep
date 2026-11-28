import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { app } from "./app";

const call = (method: string, path: string, cookie?: string, body?: unknown) =>
  app.request(`/api/app${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const cookieOf = (answer: Response) => answer.headers.get("set-cookie")?.split(";")[0] ?? "";
const account = (email: string, claim?: string) =>
  call("POST", "/account", undefined, { name: "Someone", email, password: "a long enough password", claim });

/** An Innkeep that had data, and a password, before accounts existed. */
describe("taking over the data that was there before accounts", () => {
  beforeAll(async () => {
    process.env.APP_PASSWORD = "the old shared password";
    process.env.PUBLIC_DEMO = "";
    await getDb().insert(properties).values({ name: "The host's flat", icalToken: "t", createdAt: 0 }).run();
  });
  afterAll(() => {
    process.env.APP_PASSWORD = "";
  });

  it("no longer opens anything with the old password", async () => {
    expect((await call("POST", "/session", undefined, { password: "the old shared password" })).status).toBe(
      401,
    );
    expect((await call("GET", "/overview")).status).toBe(401);
    expect(await (await call("GET", "/account")).json()).toEqual({ open: true, claimable: true });
  });

  it("gives a stranger who signs up first an empty space, not the host's data", async () => {
    const stranger = await account("stranger@example.com");
    expect(stranger.status).toBe(200);
    expect(await (await call("GET", "/properties", cookieOf(stranger))).json()).toMatchObject({
      properties: [],
    });
    expect((await account("guesser@example.com", "a guess")).status).toBe(400);
    expect(await (await call("GET", "/account")).json()).toMatchObject({ claimable: true });
  });

  it("gives the data to whoever types the old password", async () => {
    const owner = await account("owner@example.com", "the old shared password");
    expect(owner.status).toBe(200);
    expect(await owner.json()).toMatchObject({ claimed: true });
    const mine = (await (await call("GET", "/properties", cookieOf(owner))).json()) as {
      properties: { name: string }[];
    };
    expect(mine.properties.map((property) => property.name)).toEqual(["The host's flat"]);
    // Their partner, who knew the password too, joins the same space as an admin.
    const partner = await account("partner@example.com", "the old shared password");
    expect(partner.status).toBe(200);
    const { members } = (await (await call("GET", "/members", cookieOf(partner))).json()) as {
      members: { email: string; role: string }[];
    };
    expect(members.map((member) => [member.email, member.role])).toEqual([
      ["owner@example.com", "admin"],
      ["partner@example.com", "admin"],
    ]);
    // Once the variable is removed, nothing is left to claim.
    process.env.APP_PASSWORD = "";
    expect(await (await call("GET", "/account")).json()).toEqual({ open: true, claimable: false });
    expect((await account("late@example.com", "the old shared password")).status).toBe(400);
    process.env.APP_PASSWORD = "the old shared password";
  });
});
