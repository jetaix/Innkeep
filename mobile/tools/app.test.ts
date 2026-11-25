import { describe, expect, it } from "vitest";
import { money, nights, origin } from "../app";

describe("the address a host types", () => {
  it("is https unless it says otherwise, and keeps only the origin", () => {
    expect(origin("innkeep.example.com")).toBe("https://innkeep.example.com");
    expect(origin("  https://innkeep.example.com/overview?x=1 ")).toBe("https://innkeep.example.com");
    expect(origin("http://192.168.1.20:3000/")).toBe("http://192.168.1.20:3000");
  });

  it("is refused when it is not one", () => {
    expect(origin("")).toBeNull();
    expect(origin("not an address")).toBeNull();
    expect(origin("ftp://innkeep.example.com")).toBeNull();
  });
});

describe("a stay's figures", () => {
  it("counts nights between two days, across a month's end", () => {
    expect(nights("2026-01-30", "2026-02-02")).toBe(3);
    expect(nights("2026-03-28", "2026-03-30")).toBe(2);
    expect(nights("2026-01-03", "2026-01-03")).toBe(0);
    expect(nights("", "2026-01-03")).toBe(0);
  });

  it("writes minor units as money, without cents when there are none", () => {
    expect(money(123400, "EUR", "en")).toBe("€1,234");
    expect(money(61250, "EUR", "en")).toBe("€612.50");
    expect(money(61250, "EUR", "fr")).toMatch(/^612,50\s€$/);
  });
});
