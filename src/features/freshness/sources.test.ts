import { describe, expect, it, vi } from "vitest";

process.env.DATABASE_PATH = ":memory:";
vi.mock("server-only", () => ({}));

import { type DataSource, olderThanADay } from "./sources";

const source = (extra: Partial<DataSource>): DataSource => ({
  id: "x",
  kind: "adminPages",
  propertyId: 1,
  channel: "booking",
  at: null,
  state: "never",
  automatic: false,
  action: { type: "popup" },
  ...extra,
});

describe("olderThanADay", () => {
  const now = Date.parse("2027-03-10T12:00:00Z");

  it("asks for what was never read or is more than a day old", () => {
    const old = olderThanADay(
      [
        source({ id: "never" }),
        source({ id: "old", at: now - 30 * 3_600_000 }),
        source({ id: "fresh", at: now - 3_600_000 }),
      ],
      now,
    );
    expect(old.map((entry) => entry.id)).toEqual(["never", "old"]);
  });

  it("does not ask again for what a full run already failed to read", () => {
    expect(olderThanADay([source({ tried: true })], now)).toEqual([]);
  });
});
