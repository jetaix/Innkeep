import { beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { sessionValue } from "../../src/lib/session";
import { app } from "./app";

const PASSWORD = "a sentence only the test knows";
const owner = `innkeep-session=${sessionValue(PASSWORD)}`;

const call = (method: string, path: string, cookie?: string, body?: unknown) =>
  app.request(`/api/app${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
/** The session cookie an answer opened, as a browser would send it back. */
const cookieOf = (answer: Response) => answer.headers.get("set-cookie")?.split(";")[0] ?? "";

async function join(role: "admin" | "visitor", email: string) {
  const invited = await call("POST", "/invitations", owner, { role, email: "" });
  const { token } = (await invited.json()) as { token: string };
  const joined = await call("POST", `/invitations/${token}`, undefined, {
    name: "Sandrine",
    email,
    password: "a long enough password",
  });
  return { token, joined, cookie: cookieOf(joined) };
}

describe("members and their roles", () => {
  let flat: number;

  beforeAll(async () => {
    process.env.APP_PASSWORD = PASSWORD;
    process.env.PUBLIC_DEMO = "";
    const row = await getDb()
      .insert(properties)
      .values({ name: "The host's flat", icalToken: "t", createdAt: 0 })
      .returning({ id: properties.id })
      .get();
    flat = row.id;
  });

  it("lets only someone signed in invite, and shows what a link offers", async () => {
    expect((await call("POST", "/invitations", undefined, { role: "visitor" })).status).toBe(401);
    const invited = await call("POST", "/invitations", owner, { role: "visitor", email: "sandrine" });
    const { token } = (await invited.json()) as { token: string };
    expect(await (await call("GET", `/invitations/${token}`)).json()).toEqual({
      role: "visitor",
      email: "sandrine",
    });
    expect((await call("GET", "/invitations/not-a-token")).status).toBe(404);
  });

  it("turns an invitation into a member once, signed in with the role it carried", async () => {
    const { token, joined, cookie } = await join("visitor", "Sandrine@Example.com");
    expect(joined.status).toBe(200);
    const session = (await (await call("GET", "/session", cookie)).json()) as { role: string };
    expect(session).toMatchObject({ signedIn: true, role: "visitor", member: { name: "Sandrine" } });
    // The link is used up, and the address is taken.
    const again = await call("POST", `/invitations/${token}`, undefined, {
      name: "Someone",
      email: "other@example.com",
      password: "a long enough password",
    });
    expect(again.status).toBe(400);
    expect((await join("visitor", "sandrine@example.com")).joined.status).toBe(400);
  });

  it("refuses a password that is too short", async () => {
    const invited = await call("POST", "/invitations", owner, { role: "visitor" });
    const { token } = (await invited.json()) as { token: string };
    const joined = await call("POST", `/invitations/${token}`, undefined, {
      name: "Paul",
      email: "paul@example.com",
      password: "short",
    });
    expect(joined.status).toBe(400);
  });

  it("shows a visitor the cleaning and the properties, and nothing else", async () => {
    const { cookie } = await join("visitor", "cleaner@example.com");
    for (const path of [
      "/cleaning",
      "/properties",
      `/properties/${flat}`,
      "/nav",
      "/stays?from=2027-01-01",
    ]) {
      expect([path, (await call("GET", path, cookie)).status]).toEqual([path, 200]);
    }
    for (const path of [
      "/overview",
      "/revenue",
      "/charges",
      "/reviews",
      "/settings",
      "/members",
      "/suggestions",
    ]) {
      expect([path, (await call("GET", path, cookie)).status]).toEqual([path, 403]);
    }
    // One change is theirs: saying a cleaning is done. Nothing else about it, and nothing elsewhere.
    const day = `/cleanings/${flat}/2027-03-05`;
    expect((await call("PUT", day, cookie, { status: "done" })).status).toBe(200);
    expect((await call("PUT", day, cookie, { status: "done", notes: "mine" })).status).toBe(403);
    expect((await call("PUT", day, cookie, { request: "confirmed" })).status).toBe(403);
    expect((await call("DELETE", day, cookie)).status).toBe(403);
    expect((await call("POST", "/cleanings", cookie, { propertyId: flat, date: "2027-03-06" })).status).toBe(
      403,
    );
    expect((await call("PUT", `/properties/${flat}`, cookie, { name: "Mine now" })).status).toBe(403);
    expect((await call("POST", "/invitations", cookie, { role: "admin" })).status).toBe(403);
    expect((await call("POST", "/sync", cookie)).status).toBe(403);
  });

  it("signs a member in with their own address and password, and the owner with the instance's", async () => {
    await join("admin", "partner@example.com");
    const wrong = await call("POST", "/session", undefined, {
      email: "partner@example.com",
      password: "nope",
    });
    expect(wrong.status).toBe(401);
    const right = await call("POST", "/session", undefined, {
      email: "Partner@example.com",
      password: "a long enough password",
    });
    expect(right.status).toBe(200);
    const cookie = cookieOf(right);
    expect((await call("GET", "/revenue", cookie)).status).toBe(200);
    expect((await call("GET", "/members", cookie)).status).toBe(200);
    expect((await call("POST", "/session", undefined, { password: PASSWORD })).status).toBe(200);
  }, 15_000);

  it("holds a member to a new role at once, and signs out one who is removed", async () => {
    const { cookie } = await join("admin", "helper@example.com");
    const { members } = (await (await call("GET", "/members", owner)).json()) as {
      members: { id: number; email: string }[];
    };
    const helper = members.find((member) => member.email === "helper@example.com");
    expect((await call("GET", "/revenue", cookie)).status).toBe(200);
    await call("PUT", `/members/${helper?.id}`, owner, { role: "visitor" });
    expect((await call("GET", "/revenue", cookie)).status).toBe(403);
    await call("DELETE", `/members/${helper?.id}`, owner);
    expect((await call("GET", "/cleaning", cookie)).status).toBe(401);
  });

  it("does not take a forged member cookie", async () => {
    const forged = `innkeep-session=m1.${"0".repeat(64)}`;
    expect((await call("GET", "/cleaning", forged)).status).toBe(401);
  });
});
