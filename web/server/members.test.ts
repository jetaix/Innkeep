import { beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { app } from "./app";
import { signedUp } from "./testing";

/** The host's cookie, once they have signed up in `beforeAll`. */
let owner = "";

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
    process.env.PUBLIC_DEMO = "";
    owner = (await signedUp()).cookie;
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
      reset: null,
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

  it("signs a member in with their own address and password", async () => {
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
  });

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

  it("lets a member change their password, and an admin hand over a link for a forgotten one", async () => {
    const { cookie } = await join("visitor", "forgetful@example.com");
    const wrong = await call("PUT", "/account/password", cookie, {
      current: "not it",
      password: "another long password",
    });
    expect(wrong.status).toBe(400);
    const changed = await call("PUT", "/account/password", cookie, {
      current: "a long enough password",
      password: "another long password",
    });
    expect(changed.status).toBe(200);
    // The old session covered the old password; the answer opened a new one.
    expect((await call("GET", "/cleaning", cookie)).status).toBe(401);
    expect((await call("GET", "/cleaning", cookieOf(changed))).status).toBe(200);

    const { members } = (await (await call("GET", "/members", owner)).json()) as {
      members: { id: number; email: string }[];
    };
    const id = members.find((member) => member.email === "forgetful@example.com")?.id;
    expect((await call("POST", `/members/${id}/reset`, cookieOf(changed))).status).toBe(403);
    const { token } = (await (await call("POST", `/members/${id}/reset`, owner)).json()) as { token: string };
    expect(await (await call("GET", `/invitations/${token}`)).json()).toMatchObject({
      reset: { name: "Sandrine" },
    });
    const reset = await call("POST", `/invitations/${token}`, undefined, {
      password: "a third long password",
    });
    expect(reset.status).toBe(200);
    expect((await call("GET", "/cleaning", cookieOf(reset))).status).toBe(200);
    const signedIn = await call("POST", "/session", undefined, {
      email: "forgetful@example.com",
      password: "a third long password",
    });
    expect(signedIn.status).toBe(200);
    expect(
      (await call("POST", `/invitations/${token}`, undefined, { password: "a fourth password" })).status,
    ).toBe(400);
  });

  it("keeps a space's last admin", async () => {
    const { members } = (await (await call("GET", "/members", owner)).json()) as {
      members: { id: number; email: string; role: string }[];
    };
    const admins = members.filter((member) => member.role === "admin");
    for (const admin of admins.slice(1)) await call("DELETE", `/members/${admin.id}`, owner);
    const last = admins[0];
    expect((await call("DELETE", `/members/${last?.id}`, owner)).status).toBe(400);
    expect((await call("PUT", `/members/${last?.id}`, owner, { role: "visitor" })).status).toBe(400);
  });

  it("gives whoever signs up a space of their own, with its own members", async () => {
    const signed = await call("POST", "/account", undefined, {
      name: "Camille",
      email: "camille@example.com",
      password: "a long enough password",
    });
    expect(signed.status).toBe(200);
    const camille = cookieOf(signed);
    expect(await (await call("GET", "/session", camille)).json()).toMatchObject({
      signedIn: true,
      role: "admin",
      member: { name: "Camille" },
    });
    // Empty, and none of the host's: not their property, not their members.
    expect(await (await call("GET", "/properties", camille)).json()).toMatchObject({ properties: [] });
    const { members } = (await (await call("GET", "/members", camille)).json()) as {
      members: { email: string }[];
    };
    expect(members.map((member) => member.email)).toEqual(["camille@example.com"]);
    // Nor can they touch the host's members by number.
    const hosts = (await (await call("GET", "/members", owner)).json()) as { members: { id: number }[] };
    const before = hosts.members.length;
    await call("DELETE", `/members/${hosts.members.at(-1)?.id}`, camille);
    await call("PUT", `/members/${hosts.members.at(-1)?.id}`, camille, { role: "admin" });
    expect((await call("POST", `/members/${hosts.members.at(-1)?.id}/reset`, camille)).status).toBe(400);
    const after = (await (await call("GET", "/members", owner)).json()) as { members: unknown[] };
    expect(after.members.length).toBe(before);

    // One account per address; a short password is refused.
    expect(
      (
        await call("POST", "/account", undefined, {
          name: "C",
          email: "camille@example.com",
          password: "a long enough password",
        })
      ).status,
    ).toBe(400);
    expect(
      (await call("POST", "/account", undefined, { name: "C", email: "c2@example.com", password: "short" }))
        .status,
    ).toBe(400);
  });

  it("closes sign-up when the host says so, and keeps invitations working", async () => {
    process.env.SIGN_UP = "closed";
    expect(await (await call("GET", "/account")).json()).toEqual({ open: false, claimable: false });
    const refused = await call("POST", "/account", undefined, {
      name: "Late",
      email: "late@example.com",
      password: "a long enough password",
    });
    expect(refused.status).toBe(403);
    expect((await join("visitor", "invited-late@example.com")).joined.status).toBe(200);
    process.env.SIGN_UP = "";
  });

  it("does not take a forged member cookie", async () => {
    const forged = `innkeep-session=m1.${"0".repeat(64)}`;
    expect((await call("GET", "/cleaning", forged)).status).toBe(401);
  });
});
