import { describe, expect, it } from "vitest";
import "./parse.js";

type Parse = {
  parseDate(text: string, lang: string): string | null;
  parseMoney(text: string): number | null;
  parseAirbnbRow(cells: string[], lang: string): Record<string, unknown> | null;
  parseBookingRow(cells: string[], lang: string): Record<string, unknown> | null;
  parseTime(text: string): string | null;
  parseAirbnbListing(path: string, origin: string, cards: Record<string, string[]>): object | null;
  parseAirbnbDay(date: string, lines: string[]): object | null;
  parseBookingRateRow(label: string, cells: { date: string; text: string }[]): object[];
  parseAirbnbQuote(pathname: string, search: string, lines: string[]): object | null;
  parseBookingQuote(search: string, hotelId: string | null, cells: string[][]): object | null;
  buildPreview(raw: Record<string, unknown>): Record<string, unknown> | null;
  highlightLines(lines: string[]): string[];
  amenityLines(lines: string[]): string[];
  parseMonthYear(text: string, lang: string): string | null;
  findDate(text: string, lang: string): string | null;
  parseAirbnbReview(
    id: string,
    header: string[],
    body: string[],
    reply: string[],
    lang: string,
  ): object | null;
  parseBookingReview(parts: Record<string, string>, lang: string): object | null;
  extranetPage(pathname: string): string | null;
  editorSection(pathname: string): string | null;
  buildPage(key: string, title: string, lines: string[], images: string[]): Record<string, unknown> | null;
};
const { parseDate, parseMoney, parseTime, parseAirbnbRow, parseBookingRow, parseAirbnbListing } = (
  globalThis as unknown as { InnkeepParse: Parse }
).InnkeepParse;

describe("parseDate", () => {
  it("reads dates as Airbnb writes them in several languages", () => {
    expect(parseDate("2 nov. 2026", "fr")).toBe("2026-11-02");
    expect(parseDate("23 janv. 2027", "fr")).toBe("2027-01-23");
    expect(parseDate("14 juil. 2027", "fr")).toBe("2027-07-14");
    expect(parseDate("1 août 2027", "fr")).toBe("2027-08-01");
    expect(parseDate("Nov 2, 2026", "en")).toBe("2026-11-02");
    expect(parseDate("2. Nov. 2026", "de")).toBe("2026-11-02");
    expect(parseDate("2 mar 2027", "es")).toBe("2027-03-02");
  });

  it("refuses dates it cannot read with certainty", () => {
    expect(parseDate("11/02/2026", "en")).toBeNull();
    expect(parseDate("31 févr. 2027", "fr")).toBeNull();
    expect(parseDate("soon", "en")).toBeNull();
  });
});

describe("parseMoney", () => {
  it("reads amounts in minor units", () => {
    expect(parseMoney("2 465,78 €")).toBe(246_578);
    expect(parseMoney("343,56 €")).toBe(34_356);
    expect(parseMoney("$1,250.50")).toBe(125_050);
    expect(parseMoney("—")).toBeNull();
  });
});

describe("parseAirbnbRow", () => {
  // Cell order and formats as seen on the live fr page; every value here is invented.
  const row = [
    "Confirmée",
    "Camille Durand\n2 voyageurs",
    "+33 6 00 00 00 00",
    "23 janv. 2027",
    "31 janv. 2027",
    "30 oct. 2026\n15:25 CET",
    "Sea view flat\nOld town",
    "HMTESTCODE",
    "343,56 €",
    "Détails",
  ];

  it("extracts the fields Innkeep needs and nothing from the contact column", () => {
    const parsed = parseAirbnbRow(row, "fr");
    expect(parsed).toEqual({
      code: "HMTESTCODE",
      checkIn: "2027-01-23",
      checkOut: "2027-01-31",
      guestName: "Camille Durand",
      guests: 2,
      payout: 34_356,
      listingName: "Sea view flat | Old town",
      status: "confirmed",
      statusText: "Confirmée",
      bookedOn: "2026-10-30",
    });
    expect(JSON.stringify(parsed)).not.toContain("+33");
  });

  it("skips rows it cannot read rather than guessing", () => {
    expect(parseAirbnbRow(row.slice(0, 5), "fr")).toBeNull();
    expect(parseAirbnbRow(row.with(3, "23/01/2027"), "fr")).toBeNull();
    expect(parseAirbnbRow(row.with(7, "Détails"), "fr")).toBeNull();
  });

  it("marks cancelled rows, and treats past and current stays as confirmed", () => {
    const cancelled = parseAirbnbRow(row.with(0, "Annulée par le voyageur").with(8, "0,00 €"), "fr");
    expect(cancelled).toMatchObject({ status: "cancelled", statusText: "Annulée par le voyageur" });
    expect(parseAirbnbRow(row.with(0, "Canceled by guest"), "en")?.status).toBe("cancelled");
    expect(parseAirbnbRow(row.with(0, "Ancien voyageur"), "fr")?.status).toBe("confirmed");
    expect(parseAirbnbRow(row.with(0, "Séjour en cours"), "fr")?.status).toBe("confirmed");
  });
});

describe("parseBookingRow", () => {
  // Cell order and formats as seen on the live fr extranet; every value here is invented.
  const row = [
    "Camille Durand\n2 personnes",
    "3 juin 2026",
    "6 juin 2026",
    "Appartement 1 Chambre",
    "2 juin 2026",
    "OK\nPaiement par Booking.com",
    "€ 268,61\nVirement bancaire",
    "€ 49,52",
    "5000000001",
  ];

  it("reads a booking and works out the payout after commission and fees", () => {
    expect(parseBookingRow(row, "fr")).toEqual({
      code: "5000000001",
      checkIn: "2026-06-03",
      checkOut: "2026-06-06",
      guestName: "Camille Durand",
      guests: 2,
      payout: 21_909,
      listingName: "",
      status: "confirmed",
      statusText: "OK",
      bookedOn: "2026-06-02",
      price: 26_861,
      fees: 4_952,
      room: "Appartement 1 Chambre",
    });
  });

  it("marks cancelled bookings, which show a price of zero, and gives them no payout", () => {
    const cancelled = row.with(5, "Annulée").with(6, "€ 0\nVirement bancaire").with(7, "€ 0");
    expect(parseBookingRow(cancelled, "fr")).toMatchObject({
      status: "cancelled",
      payout: null,
      price: null,
    });
  });
});

describe("parseTime", () => {
  it("reads the first time on a line, in 24-hour or 12-hour form", () => {
    expect(parseTime("16:00 - 21:00")).toBe("16:00");
    expect(parseTime("4:00 PM - 9:00 PM")).toBe("16:00");
    expect(parseTime("12:00 AM")).toBe("00:00");
    expect(parseTime("10h00")).toBe("10:00");
    expect(parseTime("Départ")).toBeNull();
  });
});

describe("parseAirbnbListing", () => {
  const path = "/hosting/listings/editor/1400000000000000001/details/photo-tour";
  const origin = "https://www.airbnb.fr";
  // Card text as the live fr editor lays it out; every value here is invented.
  const cards = {
    title: ["Titre", "Sea view flat | Old town"],
    "number-of-guests": ["Nombre maximal de voyageurs", "2 voyageurs"],
    "photo-tour": ["Visite photo", "1 chambre", "2 lits", "1 salle de bain", "18 photos"],
    description: ["Description", "A flat for two", "Quiet, bright and close to the harbour."],
    location: ["Lieu", "1 rue de l'Exemple, 74000 Annecy, France"],
    pricing: ["Tarification", "55 € – 300 € par nuit"],
    "house-rules": ["Règlement intérieur", "Pas d'animaux", "Interdiction de fumer", "+ 2 autres"],
  };

  it("reads the listing's facts and keeps the cards that describe it", () => {
    expect(parseAirbnbListing(path, origin, cards)).toEqual({
      listingId: "1400000000000000001",
      listingUrl: "https://www.airbnb.fr/rooms/1400000000000000001",
      title: "Sea view flat | Old town",
      maxGuests: 2,
      description: "A flat for two\n\nQuiet, bright and close to the harbour.",
      address: "1 rue de l'Exemple, 74000 Annecy, France",
      bedrooms: 1,
      bathrooms: 1,
      houseRules: "Pas d'animaux\nInterdiction de fumer",
      details: {
        "photo-tour": cards["photo-tour"],
        pricing: cards.pricing,
        "house-rules": cards["house-rules"],
      },
    });
  });

  it("reads arrival and departure times from the arrival tab, where there is no title", () => {
    expect(
      parseAirbnbListing(path.replace("details/photo-tour", "arrival/check-in-out"), origin, {
        "check-in-out": ["Arrivée", "16:00 - 21:00", "Départ", "10:00"],
      }),
    ).toMatchObject({ checkInTime: "16:00", checkOutTime: "10:00" });
  });

  it("never keeps cards that hold access details or people", () => {
    const parsed = parseAirbnbListing(path, origin, {
      ...cards,
      directions: ["Itinéraire", "Door code 4711"],
      "wifi-details": ["Wifi", "network", "password"],
      "co-hosts": ["Co-hôtes", "Someone"],
    });
    expect(JSON.stringify(parsed)).not.toMatch(/4711|password|Someone/);
  });

  it("counts a studio as no bedroom", () => {
    expect(
      parseAirbnbListing(path, origin, { "photo-tour": ["Photo tour", "1 bed", "1.5 baths", "9 photos"] }),
    ).toMatchObject({ bedrooms: 0, bathrooms: 2 });
  });

  it("returns nothing outside the editor or before the cards have loaded", () => {
    expect(parseAirbnbListing("/hosting/reservations", origin, cards)).toBeNull();
    expect(parseAirbnbListing(path, origin, {})).toBeNull();
    expect(parseAirbnbListing(path, origin, { title: ["Titre"] })).toBeNull();
  });
});

describe("calendar prices", () => {
  const { parseAirbnbDay, parseBookingRateRow } = (globalThis as unknown as { InnkeepParse: Parse })
    .InnkeepParse;

  it("reads the nightly price and the day's label from an Airbnb calendar cell", () => {
    expect(parseAirbnbDay("2027-11-01", ["lundi 1 nov.", "1", "Prix par nuit", "62 €", "Toussaint"])).toEqual(
      {
        date: "2027-11-01",
        amount: 6_200,
        note: "Toussaint",
      },
    );
    expect(parseAirbnbDay("2027-07-10", ["Saturday, Jul 10", "10", "Nightly price", "$1,121"])).toEqual({
      date: "2027-07-10",
      amount: 112_100,
    });
  });

  it("returns nothing for a booked day, which shows no price", () => {
    expect(parseAirbnbDay("2026-11-20", ["vendredi 20 nov.", "20"])).toBeNull();
    expect(parseAirbnbDay("not a date", ["x", "1", "62 €"])).toBeNull();
  });

  it("reads a Booking.com rate row and ignores rows that are not prices", () => {
    const cells = [
      { date: "2026-11-19", text: "€ 70.5" },
      { date: "2026-11-20", text: "€ 63,45" },
      { date: "2026-11-21", text: "" },
    ];
    expect(parseBookingRateRow("Standard Rate × 2\nModifier", cells)).toEqual([
      { date: "2026-11-19", amount: 7_050, plan: "Standard Rate" },
      { date: "2026-11-20", amount: 6_345, plan: "Standard Rate" },
    ]);
    // The header row repeats the dates ("jeu. 19") and has no label.
    expect(parseBookingRateRow("", [{ date: "2026-11-19", text: "jeu. 19" }])).toEqual([]);
    expect(parseBookingRateRow("Standard Rate", [{ date: "2026-11-19", text: "jeu. 19" }])).toEqual([]);
    const rooms = cells.map((cell) => ({ ...cell, text: "0" }));
    expect(parseBookingRateRow("Hébergements à vendre", rooms)).toEqual([]);
  });
});

describe("parseAirbnbQuote", () => {
  const { parseAirbnbQuote } = (globalThis as unknown as { InnkeepParse: Parse }).InnkeepParse;
  const path = "/rooms/1400000000000000001";
  const search = "?check_in=2027-02-01&check_out=2027-02-04&adults=2";
  // The booking box as the live fr page lays it out.
  const box = [
    "288 €",
    "258 € au total",
    "258 € au total. Prix initial : 288 €",
    "ARRIVÉE",
    "01/02/2027",
    "DÉPART",
    "04/02/2027",
    "0 € aujourd'hui · Annulation gratuite avant le 18 janvier",
  ];

  it("reads what the guest pays and the price before the discount", () => {
    expect(parseAirbnbQuote(path, search, box)).toEqual({
      listingId: "1400000000000000001",
      checkIn: "2027-02-01",
      checkOut: "2027-02-04",
      guests: 2,
      total: 25_800,
      original: 28_800,
    });
  });

  it("reads a plain total, with thousands, and no discount", () => {
    expect(parseAirbnbQuote(path, search, ["$1,258 total", "CHECK-IN", "2/1/2027"])).toMatchObject({
      total: 125_800,
      original: null,
    });
  });

  it("needs dates in the address and an amount in the box", () => {
    expect(parseAirbnbQuote(path, "?adults=2", box)).toBeNull();
    expect(parseAirbnbQuote("/hosting/reservations", search, box)).toBeNull();
    expect(parseAirbnbQuote(path, search, ["ARRIVÉE", "01/02/2027"])).toBeNull();
  });
});

describe("parseBookingQuote", () => {
  const { parseBookingQuote } = (globalThis as unknown as { InnkeepParse: Parse }).InnkeepParse;
  const search = "?checkin=2027-02-01&checkout=2027-02-04&group_adults=2&no_rooms=1";
  // One price cell per offer, as the live fr page lays them out.
  const standard = ["€ 271", "Tarif € 271", "Taxes et frais compris"];

  it("reads what the guest pays for the stay", () => {
    expect(parseBookingQuote(search, "14170000", [standard])).toEqual({
      listingId: "14170000",
      checkIn: "2027-02-01",
      checkOut: "2027-02-04",
      guests: 2,
      total: 27_100,
      original: null,
    });
  });

  it("takes the cheapest offer and its price before discount", () => {
    const discounted = ["€ 300", "€ 244", "Taxes et frais compris"];
    expect(parseBookingQuote(search, "14170000", [standard, discounted])).toMatchObject({
      total: 24_400,
      original: 30_000,
    });
  });

  it("needs dates, a property id and a price", () => {
    expect(parseBookingQuote("?group_adults=2", "14170000", [standard])).toBeNull();
    expect(parseBookingQuote(search, null, [standard])).toBeNull();
    expect(parseBookingQuote(search, "14170000", [["Complet"]])).toBeNull();
  });
});

describe("buildPreview", () => {
  const { buildPreview } = (globalThis as unknown as { InnkeepParse: Parse }).InnkeepParse;

  it("builds a preview from the page's structured data and section text", () => {
    const preview = buildPreview({
      ld: {
        name: "Sea view flat | Old town",
        description: "A flat for two.",
        image: ["https://img.example/1.jpg", "https://img.example/2.jpg"],
        aggregateRating: { ratingValue: 4.86, ratingCount: "14" },
        address: { addressLocality: "Annecy" },
      },
      summary: ["Entire place - Annecy, France", "2 guests · 1 bedroom"],
      highlights: ["Private balcony", "Private balcony"],
      amenities: ["Kitchen", "Wifi"],
    });
    expect(preview).toEqual({
      title: "Sea view flat | Old town",
      description: "A flat for two.",
      images: ["https://img.example/1.jpg", "https://img.example/2.jpg"],
      rating: 4.86,
      ratingScale: 5,
      reviews: 14,
      location: "Annecy",
      summary: ["Entire place - Annecy, France", "2 guests · 1 bedroom"],
      highlights: ["Private balcony"],
      amenities: ["Kitchen", "Wifi"],
    });
  });

  it("prefers the page's full description and gallery, and knows Booking.com scores out of ten", () => {
    const preview = buildPreview({
      ld: {
        name: "Charming flat",
        description: "Short.",
        image: "https://img.example/cover.jpg",
        aggregateRating: { ratingValue: 9.2, reviewCount: 21, bestRating: 10 },
        address: { streetAddress: "1 Example Street, 74000 Annecy" },
      },
      description: "The full description from the page.",
      images: ["https://img.example/a.jpg", "javascript:alert(1)"],
    });
    expect(preview).toMatchObject({
      description: "The full description from the page.",
      images: ["https://img.example/a.jpg", "https://img.example/cover.jpg"],
      rating: 9.2,
      ratingScale: 10,
      reviews: 21,
      location: "1 Example Street, 74000 Annecy",
    });
  });

  it("returns nothing without a title", () => {
    expect(buildPreview({ ld: {} })).toBeNull();
  });
});

describe("Airbnb section lines", () => {
  const { highlightLines, amenityLines } = (globalThis as unknown as { InnkeepParse: Parse }).InnkeepParse;

  it("keeps the highlight pairs, without the heading or the trailing link", () => {
    const pairs = ["Near the citadel", "Two minutes on foot.", "Private balcony", "With air conditioning."];
    expect(highlightLines(["Listing highlights", ...pairs, "Learn more"])).toEqual(pairs);
    expect(highlightLines(["Listing highlights", ...pairs])).toEqual(pairs);
  });

  it("keeps the amenities on offer, without those marked unavailable", () => {
    expect(
      amenityLines([
        "What this place offers",
        "Kitchen",
        "Wifi",
        "Indisponible : Détecteur de monoxyde de carbone",
        "Détecteur de monoxyde de carbone",
        "Show all 38 amenities",
      ]),
    ).toEqual(["Kitchen", "Wifi"]);
  });
});

describe("reviews", () => {
  const { parseMonthYear, findDate, parseAirbnbReview, parseBookingReview } = (
    globalThis as unknown as { InnkeepParse: Parse }
  ).InnkeepParse;

  it("reads a month and year, or a full date inside a sentence", () => {
    expect(parseMonthYear("octobre 2026", "fr")).toBe("2026-10");
    expect(parseMonthYear("October 2026", "en")).toBe("2026-10");
    expect(parseMonthYear("2026", "fr")).toBeNull();
    expect(findDate("Commentaire envoyé le 2 avril 2026", "fr")).toBe("2026-04-02");
    expect(findDate("Reviewed: April 2, 2026", "en")).toBe("2026-04-02");
    expect(findDate("avril 2026", "fr")).toBe("2026-04");
  });

  // Block layout as on the live fr page; every name and sentence here is invented.
  const header = [
    "Camille",
    "10 ans sur Airbnb",
    "Évaluation : 5 étoiles",
    ",",
    "·",
    "octobre 2026",
    ",",
    "·",
    "Séjour d'environ une semaine",
  ];

  it("reads an Airbnb review with the host's reply", () => {
    expect(
      parseAirbnbReview(
        "1500000000000000001",
        header,
        ["Très bel appartement.", "Je recommande."],
        ["Réponse envoyée par Alex", "octobre 2026", "Merci beaucoup !"],
        "fr",
      ),
    ).toEqual({
      key: "1500000000000000001",
      author: "Camille",
      rating: 5,
      scale: 5,
      reviewedOn: "2026-10",
      stay: "Séjour d'environ une semaine",
      title: "",
      body: "Très bel appartement.\nJe recommande.",
      negative: "",
      reply: "Merci beaucoup !",
    });
  });

  it("reads an Airbnb review without a reply, and skips an empty one", () => {
    expect(parseAirbnbReview("1", header, ["Parfait"], [], "fr")).toMatchObject({ reply: "", rating: 5 });
    expect(parseAirbnbReview("1", header, [], [], "fr")).toBeNull();
  });

  it("reads a Booking.com review with what the guest liked and disliked", () => {
    expect(
      parseBookingReview(
        {
          author: "Camille",
          date: "Commentaire envoyé le 2 avril 2026",
          title: "Bon séjour",
          score: "Avec une note de 7,07,0",
          positive: "Le calme et la décoration",
          negative: "L'escalier",
          reply: "Réponse de l'établissement :Merci pour votre retour.",
          nights: "2 nuits ·",
          stayDate: "avril 2026",
          traveler: "Couple",
        },
        "fr",
      ),
    ).toEqual({
      key: "Camille|2026-04-02|Bon séjour",
      author: "Camille",
      rating: 7,
      scale: 10,
      reviewedOn: "2026-04-02",
      stay: "2 nuits, avril 2026, Couple",
      title: "Bon séjour",
      body: "Le calme et la décoration",
      negative: "L'escalier",
      reply: "Merci pour votre retour.",
    });
    expect(parseBookingReview({ author: "Camille", score: "Scored 1010" }, "en")).toBeNull();
    expect(parseBookingReview({ author: "Camille", title: "Top", score: "Scored 1010" }, "en")).toMatchObject(
      {
        rating: 10,
      },
    );
  });
});

describe("admin pages", () => {
  const { extranetPage, editorSection, buildPage } = (globalThis as unknown as { InnkeepParse: Parse })
    .InnkeepParse;
  const extranet = (name: string) => `/hotel/hoteladmin/extranet_ng/manage/${name}.html`;

  it("keeps extranet pages that describe the property", () => {
    expect(extranetPage(extranet("photos"))).toBe("photos");
    expect(extranetPage(extranet("facilities"))).toBe("facilities");
    expect(extranetPage(extranet("quality_rating"))).toBe("quality_rating");
    expect(extranetPage(extranet("policies"))).toBe("policies");
  });

  it("never keeps pages about money, the account, guests or messages", () => {
    for (const name of [
      "finance_overview",
      "invoices",
      "bank_details",
      "security_settings",
      "messaging_inbox",
      "search_reservations",
      "guest_reviews",
      "home",
      "payment_policies",
      "account_users",
    ]) {
      expect(extranetPage(extranet(name)), name).toBeNull();
    }
    expect(extranetPage("/hotel/fr/some-property.html")).toBeNull();
  });

  it("keeps the editor sections that describe the listing, not access details or people", () => {
    const editor = (path: string) => `/hosting/listings/editor/1400000000000000001/${path}`;
    expect(editorSection(editor("details/amenities"))).toBe("amenities");
    expect(editorSection(editor("arrival/check-in-out"))).toBe("check-in-out");
    expect(editorSection(editor("arrival/wifi-details"))).toBeNull();
    expect(editorSection(editor("arrival/directions"))).toBeNull();
    expect(editorSection(editor("details/co-hosts"))).toBeNull();
    expect(editorSection(editor("details"))).toBeNull();
  });

  it("keeps a page's text once per line, and its photos", () => {
    expect(
      buildPage(
        "photos",
        "  Photos ",
        ["Main photo", "Main  photo", "", "Bedroom"],
        ["https://img.example/1.jpg", "https://img.example/1.jpg", "data:image/png;base64,AAAA"],
      ),
    ).toEqual({
      key: "photos",
      title: "Photos",
      lines: ["Main photo", "Bedroom"],
      images: ["https://img.example/1.jpg"],
    });
    expect(buildPage("photos", "Photos", [], [])).toBeNull();
  });
});
