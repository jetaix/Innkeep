import { beforeAll, describe, expect, it } from "vitest";
import { getDb, properties } from "../../src/db";
import { sessionValue } from "../../src/lib/session";
import { app } from "./app";

const PASSWORD = "a sentence only the test knows";
const session = `innkeep-session=${sessionValue(PASSWORD)}`;
const get = (path: string, cookie?: string) =>
  app.request(`/api/app${path}`, { headers: cookie ? { cookie } : undefined });

/** Every address a page reads from. A new one belongs in this list. */
const OPEN = [
  "/session",
  "/overview",
  "/nav",
  "/properties",
  "/properties/1",
  "/properties/1/preview",
  "/stays",
  "/stays?from=2026-01-01&to=2026-02-01",
  "/feeds",
  "/cleaning",
  "/revenue",
  "/revenue?back=0&ahead=1",
  "/revenue/years",
  "/charges",
  "/pricing?property=1",
  "/reviews",
  "/suggestions?locale=fr",
  "/advice",
  "/freshness",
];
const HOST_ONLY = ["/extension", "/settings"];

describe("the read API", () => {
  beforeAll(async () => {
    process.env.APP_PASSWORD = PASSWORD;
    process.env.PUBLIC_DEMO = "1";
    await getDb().insert(properties).values({ name: "The host's flat", icalToken: "t", createdAt: 0 }).run();
  });

  it.each(OPEN)("answers a visitor from the sample data: %s", async (path) => {
    const response = await get(path);
    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain("The host's flat");
  });

  it.each([...OPEN, ...HOST_ONLY])("answers the host: %s", async (path) => {
    expect((await get(path, session)).status).toBe(200);
  });

  it.each(HOST_ONLY)("keeps how Innkeep is set up from a visitor: %s", async (path) => {
    expect((await get(path)).status).toBe(403);
  });

  it("shows the host their own properties", async () => {
    const own = (await (await get("/properties", session)).json()) as { properties: { name: string }[] };
    expect(own.properties.map((property) => property.name)).toEqual(["The host's flat"]);
  });

  it("turns everyone without a session away when no demo is offered", async () => {
    process.env.PUBLIC_DEMO = "";
    for (const path of [...OPEN, ...HOST_ONLY]) expect((await get(path)).status).toBe(401);
    process.env.PUBLIC_DEMO = "1";
  });

  it.each([
    ["/properties/999", 404],
    ["/properties/abc", 404],
    ["/pricing", 400],
    ["/pricing?property=999", 404],
    ["/stays?from=yesterday", 400],
    ["/suggestions?locale=de", 400],
    ["/nowhere", 404],
  ])("says what is wrong with %s", async (path, status) => {
    const response = await get(path, session);
    expect(response.status).toBe(status);
  });
});
