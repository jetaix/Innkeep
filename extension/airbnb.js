/**
 * Airbnb host pages. Reads only what is on screen, when the host clicks.
 * Makes no requests to Airbnb and never reads the phone number column.
 */
InnkeepUI.reservations({
  source: "airbnb",
  isActive: () => location.pathname.startsWith("/hosting/reservations"),
  rowSelector: 'tr[data-testid="host-reservations-table-row"]',
  readRow: InnkeepParse.parseAirbnbRow,
  lang: () => document.documentElement.lang || navigator.language,
});

// Listing editor: add the listing to Innkeep, or bring its details up to date.
(() => {
  /** The text of every editor card on screen, keyed by the section it links to. */
  const readCards = () => {
    const cards = {};
    for (const link of document.querySelectorAll("a[href]")) {
      const url = new URL(link.href);
      const section = /\/editor\/\d+\/(?:details|arrival)\/([a-z0-9-]+)$/.exec(url.pathname)?.[1];
      // "Skip to content" links point at the open section too; they carry a fragment.
      if (!section || url.hash) continue;
      // The link is an empty overlay; the card around it holds the text.
      const text = link.innerText.trim() ? link.innerText : (link.parentElement?.innerText ?? "");
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length > (cards[section]?.length ?? 0)) cards[section] = lines;
    }
    return cards;
  };
  const read = () => InnkeepParse.parseAirbnbListing(location.pathname, location.origin, readCards());

  InnkeepUI.mount({
    isActive: () => location.pathname.startsWith("/hosting/listings/editor/") && read() !== null,
    prompt: "Innkeep can read this listing's details.",
    button: "Send to Innkeep",
    autoKey: () => {
      const listing = read();
      return listing ? JSON.stringify(listing).length + location.pathname.split("/")[5] : null;
    },
    collect() {
      const listing = read();
      return listing
        ? { path: "/api/ingest/listing", payload: { source: "airbnb", ...listing } }
        : { error: "Could not read this listing." };
    },
    describe: (result) => ({
      tone: "good",
      text:
        result.status === "created"
          ? "Added to Innkeep. Now paste its calendar link there."
          : result.status === "linked"
            ? "Linked to the matching property in Innkeep."
            : result.status === "updated"
              ? "Innkeep now has this listing's details."
              : "Innkeep already has these details.",
    }),
  });
})();

// Listing calendar: the nightly price of every free day the host scrolls past.
(() => {
  const listingId = () => /^\/multicalendar\/(\d{5,25})(\/|$)/.exec(location.pathname)?.[1] ?? null;
  // The calendar only keeps a few months in the page, so days are remembered as they appear.
  const seen = new Map();
  let seenFor = null;

  const collect = () => {
    const id = listingId();
    if (id !== seenFor) {
      seen.clear();
      seenFor = id;
    }
    if (!id) return;
    for (const day of document.querySelectorAll("button[data-date]")) {
      const lines = day.innerText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const parsed = InnkeepParse.parseAirbnbDay(day.dataset.date, lines);
      if (parsed) seen.set(parsed.date, parsed);
    }
  };

  InnkeepUI.mount({
    isActive: () => {
      collect();
      return listingId() !== null && seen.size > 0;
    },
    prompt: "Innkeep can read these nightly prices. Scroll to cover more months.",
    button: "Send to Innkeep",
    // The host scrolls to reveal more months, so the tab is never closed for them.
    keepOpen: true,
    autoKey: () => (seen.size ? `${seenFor}:${seen.size}` : null),
    collect: () => ({
      path: "/api/ingest/prices",
      payload: { source: "airbnb", listingId: seenFor, prices: [...seen.values()] },
    }),
    describe: (result) => ({
      tone: "good",
      text: `${result.saved} nightly prices in Innkeep, up to ${result.until}. Scroll down for later months.`,
    }),
  });
})();

// Public listing page, opened from Innkeep: the listing as guests see it, and, when
// the address carries dates, what a guest pays for that stay.
(() => {
  const listingId = () => /^\/rooms\/(\d{5,25})(\/|$)/.exec(location.pathname)?.[1] ?? null;
  const isReviews = () => /\/reviews\/?$/.test(location.pathname);
  const sectionLines = (id) => [
    ...new Set(
      (document.querySelector(`[data-section-id="${id}"]`)?.innerText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];

  const readQuote = () => {
    const lines = sectionLines("BOOK_IT_SIDEBAR");
    return lines.length ? InnkeepParse.parseAirbnbQuote(location.pathname, location.search, lines) : null;
  };

  /** The page's own structured data, plus the sections that describe the place. */
  const readPreview = () => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => {
        try {
          return JSON.parse(script.textContent);
        } catch {
          return null;
        }
      })
      .find((data) => data?.["@type"] === "VacationRental" || data?.["@type"] === "Product");
    if (!ld) return null;
    return InnkeepParse.buildPreview({
      ld,
      summary: sectionLines("OVERVIEW_DEFAULT_V2"),
      highlights: InnkeepParse.highlightLines(sectionLines("HIGHLIGHTS_DEFAULT")),
      amenities: InnkeepParse.amenityLines(sectionLines("AMENITIES_DEFAULT")),
    });
  };

  InnkeepUI.mount({
    // The reviews window has its own reader below.
    isActive: () =>
      InnkeepUI.trusted() && listingId() !== null && !isReviews() && (readQuote() ?? readPreview()) !== null,
    prompt: "Innkeep can read this listing as guests see it.",
    button: "Send to Innkeep",
    autoKey: () => {
      const quote = readQuote();
      const preview = readPreview();
      if (!quote && !preview) return null;
      return `${quote?.checkIn}:${quote?.total}:${preview?.images.length}:${preview?.amenities.length}`;
    },
    collect() {
      const quote = readQuote();
      const preview = readPreview();
      if (quote) return { path: "/api/ingest/quote", payload: { source: "airbnb", ...quote, preview } };
      return preview
        ? { path: "/api/ingest/preview", payload: { source: "airbnb", listingId: listingId(), preview } }
        : { error: "Could not read this page." };
    },
    describe: () => ({ tone: "good", text: "Saved in Innkeep." }),
  });
})();

// Public listing page with its reviews window open, opened from Innkeep: the reviews guests left.
(() => {
  const listingId = () => /^\/rooms\/(\d{5,25})\/reviews\/?$/.exec(location.pathname)?.[1] ?? null;
  const lines = (element) =>
    (element?.innerText ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  // The window loads more reviews as it is scrolled, so they are remembered as they appear.
  const seen = new Map();

  const collect = () => {
    const lang = document.documentElement.lang || navigator.language;
    for (const item of document.querySelectorAll('[role="dialog"][aria-modal="true"] [data-review-id]')) {
      const [header, body, reply] = item.children;
      const review = InnkeepParse.parseAirbnbReview(
        item.dataset.reviewId,
        lines(header),
        lines(body),
        lines(reply),
        lang,
      );
      if (review) seen.set(review.key, review);
    }
  };

  /** How many reviews the page says the listing has, from its structured data. */
  const total = () => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const count = Number(JSON.parse(script.textContent).aggregateRating?.ratingCount);
        if (count > 0) return count;
      } catch {
        // Not the block we are after.
      }
    }
    return null;
  };

  InnkeepUI.mount({
    isActive: () => {
      if (!InnkeepUI.trusted() || !listingId()) return false;
      collect();
      return seen.size > 0;
    },
    prompt: "Innkeep can read these reviews. Scroll the list to load them all.",
    button: "Send to Innkeep",
    // Stay open until every review has been seen; then the tab can go.
    keepOpen: () => seen.size < (total() ?? Infinity),
    autoKey: () => (seen.size ? `reviews:${seen.size}` : null),
    collect: () => ({
      path: "/api/ingest/reviews",
      payload: { source: "airbnb", listingId: listingId(), reviews: [...seen.values()] },
    }),
    describe: (result) => ({
      tone: "good",
      text: `${result.saved} reviews in Innkeep${seen.size < (total() ?? 0) ? `, of ${total()}. Scroll for the rest.` : "."}`,
    }),
  });
})();

// Listing editor, one section open: that section as the editor shows it (every
// amenity, every rule, every photo), kept as a page. No control of its own.
(() => {
  const listingId = () => /\/hosting\/listings\/editor\/(\d{5,25})\//.exec(location.pathname)?.[1] ?? null;

  /** The open section's panel: the part of the editor that is not the list of cards. */
  const panel = () =>
    [...document.querySelectorAll("main#site-content section")].find(
      (section) => !section.querySelector("#navigation-tabs") && !section.parentElement.closest("section"),
    );

  const read = () => {
    const section = InnkeepParse.editorSection(location.pathname);
    const area = section && panel();
    if (!area) return null;
    return InnkeepParse.buildPage(
      `editor/${section}`,
      area.querySelector("h1, h2")?.innerText ?? section,
      area.innerText.split("\n"),
      [...area.querySelectorAll("img")].map((image) => image.currentSrc || image.src),
    );
  };

  InnkeepUI.mount({
    quiet: true,
    isActive: () => listingId() !== null && read() !== null,
    keepOpen: true,
    autoKey: () => {
      const page = read();
      return page ? `${page.key}:${page.lines.length}:${page.images.length}` : null;
    },
    collect: () => ({
      path: "/api/ingest/page",
      payload: { source: "airbnb", listingId: listingId(), page: read() },
    }),
  });
})();

// A conversation of the host's inbox, only when the host turned this on in
// the settings: the messages on screen, to read in Innkeep. Nothing is ever
// typed or sent on Airbnb, and other conversations are not opened.
(async () => {
  // Off unless the host asked for it: nothing below is even set up.
  if ((await InnkeepUI.option("readMessages")) !== true) return;

  const threadId = () => /^\/hosting\/messages\/(\d+)/.exec(location.pathname)?.[1] ?? null;

  const read = () => {
    const list = document.querySelector('[data-testid="message-list"]');
    if (!list || !threadId()) return null;
    const lang = document.documentElement.lang || navigator.language;
    const rows = [...list.querySelectorAll(':scope > [role="group"][aria-label]')].flatMap((row) => {
      const message = InnkeepParse.parseAirbnbMessage(row.getAttribute("aria-label"), lang, Date.now());
      if (!message || message.service) return [];
      // A guest's message carries their small profile photo; the host's own do not.
      const avatar = [...row.querySelectorAll("img")].some(
        (image) => image.getBoundingClientRect().width <= 56,
      );
      return [{ ...message, avatar }];
    });
    if (rows.length === 0) return null;
    const guests = new Set(rows.filter((row) => row.avatar).map((row) => row.author));
    const title = document.querySelector('[data-testid="thread-header-title-button"]')?.textContent ?? "";
    const guestName = ([...guests][0] ?? title).replace(/\s+/g, " ").trim().slice(0, 80);
    if (!guestName) return null;
    return {
      threadId: threadId(),
      guestName,
      messages: rows.map((row) => ({
        direction: guests.has(row.author) ? "in" : "out",
        body: row.body,
        sentAt: row.sentAt,
      })),
    };
  };

  // During a run, tell it which conversations the inbox lists, so each is opened in turn.
  // Only what the inbox shows by itself: nothing is scrolled or clicked to load more.
  const reportInbox = () => {
    if (!location.pathname.startsWith("/hosting/messages")) return;
    const pages = [...document.querySelectorAll('[data-testid^="inbox_list_"]')].flatMap((item) => {
      const id = /^inbox_list_(\d+)$/.exec(item.dataset.testid)?.[1];
      return id ? [{ url: `${location.origin}/hosting/messages/${id}`, label: "Airbnb: conversation" }] : [];
    });
    if (pages.length) void InnkeepUI.ask({ type: "innkeep:tour-found", pages });
  };
  // The list fills in after the page: look twice.
  setTimeout(reportInbox, 1500);
  setTimeout(reportInbox, 3500);

  InnkeepUI.mount({
    isActive: () => read() !== null,
    prompt: "Innkeep can keep this conversation.",
    button: "Send to Innkeep",
    keepOpen: true,
    autoKey: () => {
      const conversation = read();
      return conversation
        ? `${conversation.threadId}:${conversation.messages.length}:${conversation.messages.at(-1).body.length}`
        : null;
    },
    collect: () => {
      const conversation = read();
      return conversation
        ? { path: "/api/ingest/messages", payload: { source: "airbnb", ...conversation } }
        : { error: "Could not read this conversation." };
    },
    describe: (result) => ({
      tone: "good",
      text: result.added
        ? `${result.added} new messages in Innkeep.`
        : "This conversation is up to date in Innkeep.",
    }),
  });
})();
