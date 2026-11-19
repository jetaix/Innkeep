import { describe, expect, it } from "vitest";
import type { Review } from "@/db/schema";
import { isLow, newestFirst, reviewStats } from "./compute";

let nextId = 1;
const review = (extra: Partial<Review>): Review => ({
  id: nextId++,
  propertyId: 1,
  source: "airbnb",
  externalKey: String(nextId),
  author: "Guest",
  rating: 5,
  scale: 5,
  reviewedOn: "2026-10",
  stay: "",
  title: "",
  body: "Great",
  negative: "",
  reply: "",
  seenAt: 0,
  ...extra,
});

describe("reviewStats", () => {
  it("averages on the platform's own scale and counts what needs attention", () => {
    const all = [
      review({ rating: 5, reply: "Thanks" }),
      review({ rating: 4 }),
      review({ rating: 3 }),
      review({ source: "booking", rating: 7, scale: 10 }),
      review({ source: "booking", rating: 10, scale: 10, reply: "Thanks" }),
    ];
    expect(reviewStats(all, "airbnb")).toEqual({ count: 3, average: 4, scale: 5, unanswered: 2, low: 1 });
    expect(reviewStats(all, "booking")).toMatchObject({ count: 2, average: 8.5, scale: 10, low: 1 });
    expect(reviewStats([], "booking")).toMatchObject({ count: 0, average: null, scale: 10 });
  });
});

describe("isLow", () => {
  it("is under four stars, or under eight out of ten", () => {
    expect(isLow({ rating: 4, scale: 5 })).toBe(false);
    expect(isLow({ rating: 3, scale: 5 })).toBe(true);
    expect(isLow({ rating: 7.9, scale: 10 })).toBe(true);
    expect(isLow({ rating: null, scale: 10 })).toBe(false);
  });
});

describe("newestFirst", () => {
  it("orders by date, treating a month alone as its end", () => {
    const ordered = newestFirst([
      review({ reviewedOn: "2026-04-02", author: "a" }),
      review({ reviewedOn: "2026-10", author: "b" }),
      review({ reviewedOn: "2026-04", author: "c" }),
      review({ reviewedOn: null, author: "d" }),
    ]).map((entry) => entry.author);
    expect(ordered).toEqual(["b", "c", "a", "d"]);
  });
});
