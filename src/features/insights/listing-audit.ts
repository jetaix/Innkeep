/**
 * A listing read the way a guest reads it: does the title say something
 * concrete, can the description be scanned, are the amenities put to use, and
 * does it own up to what guests keep pointing out in their reviews.
 *
 * Plain checks over text the extension already read from the platform's
 * public page. Nothing here knows how a platform ranks listings, and nothing
 * is invented: every finding points at words that are, or are not, on the page.
 */
export type PageFacts = {
  title: string;
  description: string;
  /** How many photos the public page showed, up to the dozen the extension reads. */
  photos: number;
  amenities: string[];
  /** "Lyon, France": the place the platform names. Empty when it gave none. */
  location: string;
};

export type ReviewFacts = {
  rating: number | null;
  scale: number;
  body: string;
  /** Booking.com's own "what the guest did not like". */
  negative: string;
  reply: string;
};

export type PageFinding = "shouts" | "vague" | "noPlace" | "wall" | "fewPhotos" | "amenitiesUnsaid";

const plain = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const words = (text: string) => plain(text).match(/[a-z0-9]+/g) ?? [];

/** Words a title can be made of without telling one place from another. */
const GENERIC = new Set(
  `cosy cozy nice beautiful lovely charming amazing great superb wonderful perfect quiet calm modern new bright
   apartment flat studio house home place room loft apt appartement maison logement chambre charmant charmante joli
   jolie beau bel belle magnifique superbe agreable calme moderne neuf lumineux petit petite grand grande tres
   the and with for near in of le la les un une des du de et avec pour pres dans au aux a en`.split(/\s+/),
);

/** Fewer photos than this leaves rooms unshown. */
const ENOUGH_PHOTOS = 6;

export function auditPage(page: PageFacts): { findings: PageFinding[]; unsaid: string[] } {
  const findings: PageFinding[] = [];
  const letters = page.title.replace(/[^\p{L}]/gu, "");
  if (
    (letters.length >= 8 && letters.replace(/[^\p{Lu}]/gu, "").length / letters.length > 0.6) ||
    /!{2,}|[☀-➿\u{1f300}-\u{1faff}]/u.test(page.title)
  ) {
    findings.push("shouts");
  }
  const titleWords = words(page.title);
  // Adjectives and the kind of place, with no number, no place and no feature.
  if (titleWords.length > 0 && titleWords.every((word) => GENERIC.has(word))) findings.push("vague");

  const place = plain(page.location.split(",")[0] ?? "").trim();
  const opening = plain(`${page.title} ${page.description.slice(0, 300)}`);
  if (place.length >= 3 && !opening.includes(place)) findings.push("noPlace");

  if (page.description.length >= 500 && (page.description.match(/\n/g) ?? []).length < 2) {
    findings.push("wall");
  }
  if (page.photos > 0 && page.photos < ENOUGH_PHOTOS) findings.push("fewPhotos");

  // An amenity that is ticked but never written about is a feature, not yet a reason to book.
  const text = plain(page.description);
  const unsaid = page.amenities.filter((amenity) => {
    const key = words(amenity).sort((a, b) => b.length - a.length)[0];
    return key != null && key.length >= 4 && !text.includes(key);
  });
  if (page.description.length > 0 && unsaid.length >= 3) findings.push("amenitiesUnsaid");
  return { findings, unsaid: unsaid.slice(0, 3) };
}

/** What guests complain about, by the words they use for it in English and French. */
const THEMES = {
  noise: ["noise", "noisy", "loud", "bruit", "bruyant"],
  stairs: ["stairs", "steps", "no lift", "no elevator", "escalier", "sans ascenseur"],
  parking: ["parking", "park the", "stationnement", "se garer"],
  cleanliness: ["dirty", "dust", "not clean", "stain", "sale", "poussiere", "tache", "pas propre"],
  wifi: ["wifi", "wi-fi", "internet"],
  temperature: ["cold", "too hot", "heating", "froid", "trop chaud", "chauffage", "clim"],
  checkIn: ["check-in", "check in", "the key", "keys", "cle ", "cles", "clef", "arrivee"],
  bed: ["mattress", "the bed", "matelas", "le lit", "sommier", "canape-lit", "sofa bed"],
} as const;
export type ReviewTheme = keyof typeof THEMES;

/** A review that scored under four fifths of its scale. */
export const isLow = (review: Pick<ReviewFacts, "rating" | "scale">) =>
  review.rating != null && review.rating / review.scale < 0.8;

/**
 * The complaints at least two reviews share. `said` is true when the listing's
 * own text already mentions the subject: then guests were told, and the fix is
 * in the place, not in the words.
 */
export function reviewThemes(
  reviews: ReviewFacts[],
  listingText: string,
): { theme: ReviewTheme; count: number; said: boolean }[] {
  const complaints = reviews
    .map((review) => plain(`${review.negative} ${isLow(review) ? review.body : ""}`))
    .filter((text) => text.trim() !== "");
  const text = plain(listingText);
  return (Object.keys(THEMES) as ReviewTheme[])
    .map((theme) => ({
      theme,
      count: complaints.filter((complaint) => THEMES[theme].some((word) => complaint.includes(word))).length,
      said: THEMES[theme].some((word) => text.includes(word)),
    }))
    .filter((found) => found.count >= 2)
    .sort((a, b) => b.count - a.count);
}

/** Low reviews the host has not answered: the next guest reads them, and the silence. */
export const unansweredLow = (reviews: ReviewFacts[]) =>
  reviews.filter((review) => isLow(review) && review.reply.trim() === "").length;
