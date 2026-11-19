/**
 * The products Innkeep is compared with on the Alternatives pages.
 *
 * Only what needs no translation lives here: names, addresses and the pages
 * each claim was read from. The wording of every fact is in
 * `src/i18n/messages/alternatives.ts`, keyed by `slug`, in both languages.
 *
 * Prices and features were read on the vendors' own sites on CHECKED_ON.
 * When updating one, update its sources and that date together.
 */
export const CHECKED_ON = "2026-11-18";

export type AlternativeSlug =
  | "hospitable"
  | "hostaway"
  | "guesty-lite"
  | "lodgify"
  | "smoobu"
  | "ownerrez"
  | "hostfully"
  | "uplisting"
  | "beds24"
  | "hosthub"
  | "renttools"
  | "qloapps";

export type Alternative = {
  slug: AlternativeSlug;
  name: string;
  url: string;
  /** Commercial products use the platforms' partner APIs; the open-source ones do not. */
  kind: "commercial" | "open-source";
  sources: string[];
};

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "hospitable",
    name: "Hospitable",
    url: "https://hospitable.com",
    kind: "commercial",
    sources: [
      "https://hospitable.com/pricing",
      "https://hospitable.com/features/vacation-rental-channel-manager/booking-com",
    ],
  },
  {
    slug: "hostaway",
    name: "Hostaway",
    url: "https://www.hostaway.com",
    kind: "commercial",
    sources: [
      "https://www.hostaway.com/pricing/",
      "https://www.hostaway.com/thank-you-waitlist/",
      "https://www.hostaway.com/vacation-rental-booking-com-channel-manager",
    ],
  },
  {
    slug: "guesty-lite",
    name: "Guesty Lite",
    url: "https://www.guesty.com/guesty-lite/",
    kind: "commercial",
    sources: ["https://www.guesty.com/pricing/", "https://www.guesty.com/guesty-lite/"],
  },
  {
    slug: "lodgify",
    name: "Lodgify",
    url: "https://www.lodgify.com",
    kind: "commercial",
    sources: ["https://www.lodgify.com/pricing/"],
  },
  {
    slug: "smoobu",
    name: "Smoobu",
    url: "https://www.smoobu.com",
    kind: "commercial",
    sources: [
      "https://www.smoobu.com/en/pricing/",
      "https://www.smoobu.com/en/channel-manager/",
      "https://www.smoobu.com/en/channel-manager-airbnb/",
    ],
  },
  {
    slug: "ownerrez",
    name: "OwnerRez",
    url: "https://www.ownerrez.com",
    kind: "commercial",
    sources: ["https://www.ownerrez.com/pricing", "https://www.ownerrez.com/channel-management"],
  },
  {
    slug: "hostfully",
    name: "Hostfully",
    url: "https://www.hostfully.com",
    kind: "commercial",
    sources: [
      "https://www.hostfully.com/pricing/",
      "https://www.hostfully.com/pricing/property-management-software/",
    ],
  },
  {
    slug: "uplisting",
    name: "Uplisting",
    url: "https://www.uplisting.io",
    kind: "commercial",
    sources: ["https://www.uplisting.io/pricing"],
  },
  {
    slug: "beds24",
    name: "Beds24",
    url: "https://beds24.com",
    kind: "commercial",
    sources: ["https://beds24.com/pricing.html", "https://beds24.com/channel-manager.html"],
  },
  {
    slug: "hosthub",
    name: "Hosthub",
    url: "https://www.hosthub.com",
    kind: "commercial",
    sources: [
      "https://www.hosthub.com/pricing",
      "https://www.hosthub.com/channel-manager/",
      "https://www.hosthub.com/guides/airbnb-booking-com-channel-manager/",
    ],
  },
  {
    slug: "renttools",
    name: "RentTools.io",
    url: "https://github.com/Gribadan/RentTools.io",
    kind: "open-source",
    sources: ["https://github.com/Gribadan/RentTools.io"],
  },
  {
    slug: "qloapps",
    name: "QloApps",
    url: "https://qloapps.com",
    kind: "open-source",
    sources: ["https://github.com/Qloapps/QloApps", "https://qloapps.com/channel-manager/"],
  },
];

export function findAlternative(slug: string): Alternative | undefined {
  return ALTERNATIVES.find((alternative) => alternative.slug === slug);
}
