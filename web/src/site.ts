/**
 * What Innkeep is called and where this copy of it lives, for the public
 * pages and their head tags.
 */
export const site = {
  name: "Innkeep",
  tagline: "The open-source channel manager for hosts with one or two places",
  description:
    "Innkeep keeps your Airbnb and Booking.com calendars in sync, shows what you will earn after costs and tells you what to fix. Free, open source and self-hosted.",
  repo: "https://github.com/jetaix/Innkeep",
  license: "MIT",
} as const;

/** The public address of this deployment, without a trailing slash. */
export const siteUrl = __SITE__.url;

/** True when only the public pages are published: links into the dashboard are then left out. */
export const landingOnly = __SITE__.landingOnly;

/** The public website presents the hosted version and takes early-access requests for it. */
export const takesAccessRequests = __SITE__.takesAccess;

/** True when visitors who are not signed in get a dashboard on sample data. */
export const hasPublicDemo = __SITE__.demo;

/** The brand's glass colours, for the places the tokens do not reach (structured data, link previews). */
export const brand = {
  ground: "#f3f4ef",
  ink: "#15171c",
  muted: "#555a61",
  coral: "#ff5d73",
  blue: "#3d6df2",
  green: "#10a88f",
  overlap: "#4b2bbd",
} as const;

/**
 * The head tags of a public page, in the shape a route's `head` returns:
 * its title and description, its one true address, what a link preview
 * shows, and structured data for search engines when the page has some.
 *
 * `title` is completed with the site's name; pass `absolute` to use it as it is.
 */
export function pageHead(page: {
  title: string;
  description: string;
  /** The page's address on the site, starting with "/". */
  path: string;
  absolute?: boolean;
  /** One or more schema.org objects. */
  structured?: object | object[];
}) {
  const title = page.absolute ? page.title : `${page.title} · ${site.name}`;
  const url = `${siteUrl}${page.path === "/" ? "/" : page.path}`;
  const image = `${siteUrl}/og.png`;
  const structured = page.structured ? [page.structured].flat() : [];
  return {
    meta: [
      { title },
      { name: "description", content: page.description },
      { property: "og:title", content: title },
      { property: "og:description", content: page.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: site.name },
      { property: "og:locale", content: "en" },
      { property: "og:locale:alternate", content: "fr" },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: page.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
    // "<" is written as an escape, so nothing in a text can close the script early.
    scripts: structured.map((data) => ({
      type: "application/ld+json",
      children: JSON.stringify(data).replace(/</g, "\\u003c"),
    })),
  };
}
