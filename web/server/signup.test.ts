import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { app } from "./app";

const call = (method: string, path: string, cookie?: string, body?: unknown) =>
  app.request(`/api/app${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
const cookieOf = (answer: Response) => answer.headers.get("set-cookie")?.split(";")[0] ?? "";
const account = (email: string) =>
  call("POST", "/account", undefined, { name: "Someone", email, password: "a long enough password" });
const names = async (cookie: string) =>
  (
    (await (await call("GET", "/properties", cookie)).json()) as { properties: { name: string }[] }
  ).properties.map((property) => property.name);

/** An Innkeep that had data before accounts existed, with its owner named. */
describe("who gets the data already there, and who may sign up", () => {
  let owner = "";
  let other = "";

  beforeAll(async () => {
    process.env.PUBLIC_DEMO = "";
    process.env.OWNER_EMAIL = " Owner@Example.com ";
    process.env.SIGN_UP = "open";
    await getDb().insert(properties).values({ name: "The host's flat", icalToken: "t", createdAt: 0 }).run();
  });
  afterEach(() => {
    process.env.SIGN_UP = "open";
  });

  it("keeps the main database for the owner's address, even when someone else comes first", async () => {
    expect(await (await call("GET", "/account")).json()).toEqual({ mode: "open", first: false });
    const stranger = await account("stranger@example.com");
    expect(stranger.status).toBe(200);
    other = cookieOf(stranger);
    expect(await names(other)).toEqual([]);

    const mine = await account("owner@example.com");
    expect(mine.status).toBe(200);
    owner = cookieOf(mine);
    expect(await names(owner)).toEqual(["The host's flat"]);
  });

  it("lets in only approved addresses while in beta, which is the default", async () => {
    process.env.SIGN_UP = "";
    expect(await (await call("GET", "/account")).json()).toEqual({ mode: "beta", first: false });
    const refused = await account("camille@example.com");
    expect(refused.status).toBe(403);
    expect(refused.headers.get("set-cookie")).toBeNull();

    // They ask; the request waits in the host's Settings.
    const asked = await call("POST", "/access", undefined, { email: "Camille@Example.com", locale: "fr" });
    expect(await asked.json()).toMatchObject({ status: "sent" });
    expect((await account("camille@example.com")).status).toBe(403);
    const { requests } = (await (await call("GET", "/access-requests", owner)).json()) as {
      requests: { id: number; email: string; status: string }[];
    };
    expect(requests).toMatchObject([{ email: "camille@example.com", status: "pending" }]);

    // Another space's admin has no say in it.
    expect((await call("GET", "/access-requests", other)).status).toBe(403);
    expect((await call("PUT", `/access-requests/${requests[0]?.id}`, other)).status).toBe(403);
    expect((await call("POST", "/access-requests", other, { email: "friend@example.com" })).status).toBe(403);
    expect((await call("DELETE", `/access-requests/${requests[0]?.id}`, other)).status).toBe(403);
    expect((await call("GET", "/access-requests")).status).toBe(401);
    expect((await account("camille@example.com")).status).toBe(403);

    // The host approves: now the address gets an empty space of its own.
    expect((await call("PUT", `/access-requests/${requests[0]?.id}`, owner)).status).toBe(200);
    const joined = await account("camille@example.com");
    expect(joined.status).toBe(200);
    expect(await names(cookieOf(joined))).toEqual([]);
  });

  it("lets the host add an address directly, and take an approval back", async () => {
    process.env.SIGN_UP = "beta";
    expect((await call("POST", "/access-requests", owner, { email: "not an address" })).status).toBe(400);
    expect((await call("POST", "/access-requests", owner, { email: "Friend@Example.com" })).status).toBe(200);
    const { requests } = (await (await call("GET", "/access-requests", owner)).json()) as {
      requests: { id: number; email: string; status: string }[];
    };
    const friend = requests.find((request) => request.email === "friend@example.com");
    expect(friend?.status).toBe("approved");
    expect((await call("DELETE", `/access-requests/${friend?.id}`, owner)).status).toBe(200);
    expect((await account("friend@example.com")).status).toBe(403);
  });

  it("takes nobody when closed, and still lets invitations in", async () => {
    process.env.SIGN_UP = "closed";
    expect((await account("late@example.com")).status).toBe(403);
    const { token } = (await (await call("POST", "/invitations", owner, { role: "visitor" })).json()) as {
      token: string;
    };
    const joined = await call("POST", `/invitations/${token}`, undefined, {
      name: "Sandrine",
      email: "sandrine@example.com",
      password: "a long enough password",
    });
    expect(joined.status).toBe(200);
  });
});
