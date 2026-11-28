import { describe, expect, it } from "vitest";
import { auditPage, reviewThemes, unansweredLow } from "./listing-audit";

const page = (extra = {}) => ({
  title: "Canal-side loft, 5 min from the old town",
  description:
    "Wake up over the water in Lyon.\n\nThe kitchen has an oven and a dishwasher, the Wi-Fi is fibre, and you can park in the courtyard.\n\nThird floor, no lift.",
  photos: 10,
  amenities: ["Wifi", "Kitchen", "Free parking", "Dishwasher"],
  location: "Lyon, France",
  ...extra,
});
const review = (extra = {}) => ({ rating: 5, scale: 5, body: "", negative: "", reply: "", ...extra });

describe("auditPage", () => {
  it("finds nothing to say about a page that is specific and easy to scan", () => {
    expect(auditPage(page()).findings).toEqual([]);
  });

  it("points at a title that shouts, or that could be any place", () => {
    expect(auditPage(page({ title: "AMAZING APARTMENT!!" })).findings).toContain("shouts");
    expect(auditPage(page({ title: "Bel appartement très calme" })).findings).toContain("vague");
    expect(auditPage(page({ title: "Appartement calme avec terrasse" })).findings).not.toContain("vague");
  });

  it("notices when the place is not named where a guest starts reading", () => {
    const quiet = page({ title: "Loft on the canal", description: "A bright loft.\n\nKitchen, parking.\n" });
    expect(auditPage(quiet).findings).toContain("noPlace");
  });

  it("flags a wall of text, too few photos and amenities left as a list", () => {
    const wall = page({ description: "Wifi and more. ".repeat(40), photos: 4 });
    const audit = auditPage(wall);
    expect(audit.findings).toEqual(expect.arrayContaining(["wall", "fewPhotos", "amenitiesUnsaid"]));
    expect(audit.unsaid).toEqual(["Kitchen", "Free parking", "Dishwasher"]);
  });
});

describe("reviewThemes", () => {
  const reviews = [
    review({ scale: 10, rating: 9, negative: "Un peu de bruit la nuit" }),
    review({ rating: 3, body: "Lovely flat but very noisy street" }),
    review({ rating: 5, body: "Not noisy at all, perfect" }),
    review({ scale: 10, rating: 8, negative: "Les escaliers" }),
  ];

  it("keeps what at least two guests complained about, from their complaints only", () => {
    expect(reviewThemes(reviews, "A bright loft.")).toEqual([{ theme: "noise", count: 2, said: false }]);
  });

  it("says when the listing already tells guests", () => {
    expect(reviewThemes(reviews, "Lively street: expect some noise at night.")[0].said).toBe(true);
  });

  it("counts the low reviews left without an answer", () => {
    expect(unansweredLow([...reviews, review({ rating: 2, reply: "Sorry about that" })])).toBe(1);
  });
});
