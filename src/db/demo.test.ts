import { describe, expect, it } from "vitest";
import { getDb, hostOnly, onlyReads, properties, withData } from "@/db";

describe("the public demo", () => {
  it("tells a read from a write", () => {
    expect(onlyReads("execute", ["select 1"])).toBe(true);
    expect(onlyReads("execute", [{ sql: "  SELECT * FROM properties", args: [] }])).toBe(true);
    expect(onlyReads("execute", [{ sql: "insert into properties (name) values (?)", args: ["x"] }])).toBe(
      false,
    );
    expect(onlyReads("execute", ["delete from properties"])).toBe(false);
    expect(onlyReads("batch", [[{ sql: "select 1" }, { sql: "update properties set name = 'x'" }]])).toBe(
      false,
    );
    expect(onlyReads("transaction", ["write"])).toBe(false);
  });

  it("keeps the sample data apart from the host's own", async () => {
    const db = getDb();
    await db
      .insert(properties)
      .values({ name: "The host's flat", icalToken: "host-token", createdAt: 0 })
      .run();

    const demo = await withData("demo", () => db.select({ name: properties.name }).from(properties).all());
    expect(demo.length).toBeGreaterThan(0);
    expect(demo.map((row) => row.name)).not.toContain("The host's flat");

    const real = await db.select({ name: properties.name }).from(properties).all();
    expect(real.map((row) => row.name)).toEqual(["The host's flat"]);
  });

  it("keeps the host's own accounts from a visitor", async () => {
    await expect(withData("demo", () => hostOnly())).rejects.toThrow("This is a demo");
    await expect(withData("demo-readonly", () => hostOnly())).rejects.toThrow("This is a demo");
    await expect(withData("real", () => hostOnly())).resolves.toBeUndefined();
  });

  it("refuses a visitor's changes and leaves the host's data alone", async () => {
    const db = getDb();
    await expect(withData("demo-readonly", () => db.delete(properties).run())).rejects.toMatchObject({
      cause: { name: "DemoReadOnlyError" },
    });
    const stillThere = await withData("demo-readonly", () => db.select().from(properties).all());
    expect(stillThere.length).toBeGreaterThan(0);
    expect((await db.select().from(properties).all()).length).toBe(1);
  });
});
