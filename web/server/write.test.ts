import { beforeAll, describe, expect, it } from "vitest";
import { cleaners, getDb, listings, properties, reservations, withData } from "../../src/db";
import { app } from "./app";
import { signedUp } from "./testing";

/** The host's cookie, once they have signed up in `beforeAll`. */
let session = "";
const send = (method: string, path: string, body?: unknown, cookie?: string) =>
  app.request(`/api/app${path}`, {
    method,
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body ?? {}),
  });
const host = (method: string, path: string, body?: unknown) => send(method, path, body, session);
const count = async (table: typeof properties | typeof reservations | typeof cleaners | typeof listings) =>
  (await getDb().select().from(table).all()).length;

describe("the write API", () => {
  let flat: number;

  beforeAll(async () => {
    process.env.PUBLIC_DEMO = "1";
    delete process.env.TELEGRAM_BOT_TOKEN;
    session = (await signedUp()).cookie;
  });

  it("lets the host create, edit and remove a property", async () => {
    const created = await host("POST", "/properties", { name: "The host's flat" });
    expect(created.status).toBe(200);
    flat = ((await created.json()) as { id: number }).id;

    const edited = await host("PUT", `/properties/${flat}`, {
      name: "Flat by the port",
      address: "",
      title: "",
      description: "",
      maxGuests: "4",
      bedrooms: "1",
      bathrooms: "1",
      basePrice: "90",
      currency: "eur",
      checkInTime: "15:00",
      checkOutTime: "11:00",
      houseRules: "",
    });
    expect(edited.status).toBe(200);
    const row = (await getDb().select().from(properties).all())[0];
    expect(row).toMatchObject({ name: "Flat by the port", maxGuests: 4, currency: "EUR" });
  });

  it("saves the calendar links of the setup guide, and says when one cannot be read", async () => {
    // Nothing filled in: nothing saved, nothing to read.
    const none = await host("PUT", `/setup/${flat}/calendars`, { airbnb: "", booking: "  " });
    expect(await none.json()).toEqual({ unreadable: false });
    expect(await count(listings)).toBe(0);

    // A link that is not a calendar is kept, with what went wrong reading it.
    const wrong = await host("PUT", `/setup/${flat}/calendars`, { airbnb: "not a link" });
    expect(await wrong.json()).toEqual({ unreadable: true });
    const saved = await getDb().select().from(listings).all();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ propertyId: flat, channel: "airbnb", icalUrl: "not a link" });
    expect(saved[0]?.lastSyncError).toBeTruthy();

    expect((await host("PUT", "/setup/abc/calendars", {})).status).toBe(400);
    expect((await host("PUT", `/setup/${flat}/calendars`, { airbnb: 3 })).status).toBe(400);
  });

  it("lets the host add a stay, and refuses dates that end before they start", async () => {
    const stay = { propertyId: flat, kind: "reservation", guestName: "Ada", amount: "300" };
    const backwards = await host("POST", "/stays", {
      ...stay,
      checkIn: "2027-03-10",
      checkOut: "2027-03-08",
    });
    expect(backwards.status).toBe(400);
    expect(await count(reservations)).toBe(0);

    const added = await host("POST", "/stays", { ...stay, checkIn: "2027-03-08", checkOut: "2027-03-10" });
    expect(added.status).toBe(200);
    const { id } = (await added.json()) as { id: number };
    expect((await getDb().select().from(reservations).all())[0]).toMatchObject({
      amount: 30000,
      source: "direct",
    });

    expect(
      (
        await host("PUT", `/stays/${id}`, {
          guestName: "Ada L.",
          checkIn: "2027-03-08",
          checkOut: "2027-03-11",
        })
      ).status,
    ).toBe(200);
    expect((await getDb().select().from(reservations).all())[0]).toMatchObject({
      guestName: "Ada L.",
      checkOut: "2027-03-11",
    });

    expect((await host("DELETE", `/stays/${id}`)).status).toBe(200);
    expect(await count(reservations)).toBe(0);
  });

  it("counts a loan from its bank's table once one is imported", async () => {
    const added = await host("POST", "/loans", {
      label: "Mortgage",
      principal: "200000",
      rate: "3,85",
      years: "20",
      insurance: "",
      propertyId: "",
      startsOn: "2027-01-05",
    });
    expect(added.status).toBe(200);
    const { id } = (await added.json()) as { id: number };
    const costs = async () =>
      (
        (await (await app.request("/api/app/charges", { headers: { cookie: session } })).json()) as {
          costs: { id: number; amount: number }[];
        }
      ).costs;
    expect(await costs()).toContainEqual(expect.objectContaining({ id: -id, amount: 1_196_21 }));

    const refused = await host("PUT", `/loans/${id}/schedule`, { table: "no figures here" });
    expect(refused.status).toBe(400);
    expect(((await refused.json()) as { error: string }).error).toContain("table-empty");

    const table =
      "05/01/2027 1 226,21 641,67 554,54 30,00 199 445,46\n05/02/2027 1 226,21 639,89 556,32 30,00 198 889,14";
    const imported = await host("PUT", `/loans/${id}/schedule`, { table });
    expect(await imported.json()).toEqual({ lines: 2 });
    expect((await costs()).filter((cost) => cost.id === -id).map((cost) => cost.amount)).toEqual([
      1_226_21, 1_226_21,
    ]);

    expect((await host("DELETE", `/loans/${id}/schedule`)).status).toBe(200);
    expect(await costs()).toContainEqual(expect.objectContaining({ id: -id, amount: 1_196_21 }));

    // Edited with the payment the bank takes: that figure is counted, not a computed one.
    const terms = {
      label: "Mortgage",
      principal: "200000",
      rate: "3,85",
      years: "20",
      propertyId: "",
      startsOn: "2027-01-05",
    };
    const edited = await host("PUT", `/loans/${id}`, { ...terms, payment: "1 245,50", insurance: "30" });
    expect(edited.status).toBe(200);
    expect(await costs()).toContainEqual(expect.objectContaining({ id: -id, amount: 1_245_50 }));
    expect((await host("PUT", `/loans/${id}`, { ...terms, payment: "20", insurance: "30" })).status).toBe(
      400,
    );
    expect((await host("PUT", "/loans/99999", { ...terms, payment: "1200", insurance: "" })).status).toBe(
      400,
    );
    expect((await host("DELETE", `/loans/${id}`)).status).toBe(200);
  });

  it("lets the host add a cost, a cleaner and a cleaning day", async () => {
    const charge = await host("POST", "/charges", {
      label: "Cleaning",
      category: "cleaning",
      frequency: "per_stay",
      amount: "55",
      appliesTo: "all",
      propertyId: "",
      startsOn: "2027-01-01",
      endsOn: "",
    });
    expect([200, 400]).toContain(charge.status);

    expect((await host("POST", "/cleaners", { name: "Sandrine", phone: "" })).status).toBe(200);
    expect(await count(cleaners)).toBe(1);
    expect((await host("PUT", `/cleanings/${flat}/2027-03-10`, { status: "done" })).status).toBe(200);
    expect((await host("PUT", `/cleanings/${flat}/not-a-date`, { status: "done" })).status).toBe(400);
  });

  it("refuses every change a visitor tries, in the host's data and in the demo", async () => {
    const before = { real: await count(properties), demo: await withData("demo", () => count(properties)) };
    const attempts: [string, string, unknown?][] = [
      ["POST", "/properties", { name: "Squat" }],
      ["PUT", `/properties/${flat}`, { name: "Renamed" }],
      ["DELETE", `/properties/${flat}`],
      ["DELETE", "/properties/1"],
      ["POST", "/stays", { propertyId: 1, kind: "block", checkIn: "2027-01-01", checkOut: "2027-01-05" }],
      ["POST", "/cleaners", { name: "Nobody", phone: "" }],
      ["POST", "/suggestions/restore"],
      ["DELETE", "/sample-data"],
    ];
    for (const [method, path, body] of attempts) {
      // Refused as a visitor's change, or earlier for being incomplete: never applied.
      expect([400, 403], `${method} ${path}`).toContain((await send(method, path, body)).status);
    }
    expect(await count(properties)).toBe(before.real);
    expect(await withData("demo", () => count(properties))).toBe(before.demo);
    expect((await getDb().select().from(properties).all())[0]?.name).toBe("Flat by the port");
  });

  it.each([
    ["POST", "/telegram/test"],
    ["POST", "/telegram/chats"],
    ["PUT", "/telegram/chat"],
    ["POST", "/advice"],
    ["POST", "/claude"],
    ["DELETE", "/claude"],
    ["PUT", "/setup/1/calendars"],
  ])("keeps the host's own accounts from a visitor: %s %s", async (method, path) => {
    expect((await send(method, path, {})).status).toBe(403);
  });

  it("turns a visitor away from every change when no demo is offered", async () => {
    process.env.PUBLIC_DEMO = "";
    expect((await send("POST", "/properties", { name: "Squat" })).status).toBe(401);
    expect((await send("POST", "/telegram/test")).status).toBe(401);
    process.env.PUBLIC_DEMO = "1";
  });

  it("answers an early-access request from anyone, and checks the address", async () => {
    const bad = await send("POST", "/access", { email: "not an address", locale: "fr" });
    expect(await bad.json()).toMatchObject({ status: "error" });
    // No bot is set here, so a valid address is refused at the sending step, not before.
    const good = await send("POST", "/access", { email: "host@example.com" });
    expect(await good.json()).toMatchObject({ status: "error" });
    expect(await (await send("POST", "/access", { email: "a@b.co", company: "bot" })).json()).toMatchObject({
      status: "error",
    });
  });

  it("removes the property at the end, for the host only", async () => {
    expect((await host("DELETE", `/properties/${flat}`)).status).toBe(200);
    expect(await count(properties)).toBe(0);
  });
});
