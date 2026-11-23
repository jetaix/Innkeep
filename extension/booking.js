/**
 * Booking.com extranet reservations page. Reads only the rows on screen, when
 * the host clicks. Makes no requests to Booking.com and does not change the
 * date filter or the page for you.
 */
InnkeepUI.reservations({
  source: "booking",
  isActive: () => location.pathname.endsWith("/search_reservations.html"),
  rowSelector: "table.reservation-table tbody tr",
  readRow: InnkeepParse.parseBookingRow,
  // The extranet does not set <html lang>; its language is in the address.
  lang: () => new URLSearchParams(location.search).get("lang") || navigator.language,
  listingId: () => new URLSearchParams(location.search).get("hotel_id"),
});

// Extranet calendar: every rate row on screen, night by night.
(() => {
  const byTestId = (root, value, prefix = false) =>
    root.querySelectorAll(
      prefix
        ? `[data-test-id^="${value}"], [data-testid^="${value}"]`
        : `[data-test-id="${value}"], [data-testid="${value}"]`,
    );
  const testId = (element) =>
    element.getAttribute("data-test-id") ?? element.getAttribute("data-testid") ?? "";

  const read = () =>
    [...byTestId(document, "row")].flatMap((row) => {
      const label = byTestId(row, "first-cell")[0]?.innerText ?? "";
      const cells = [...byTestId(row, "cell-", true)].map((cell) => ({
        date: testId(cell).slice("cell-".length),
        text: cell.innerText.trim(),
      }));
      return InnkeepParse.parseBookingRateRow(label, cells);
    });

  InnkeepUI.mount({
    isActive: () => location.pathname.endsWith("/calendar/index.html") && read().length > 0,
    prompt: "Innkeep can read these nightly rates. Move the calendar forward to cover more dates.",
    button: "Send to Innkeep",
    keepOpen: true,
    autoKey: () => {
      const prices = read();
      return prices.length ? `${prices.length}:${prices[0].date}:${prices.at(-1).date}` : null;
    },
    collect: () => ({
      path: "/api/ingest/prices",
      payload: {
        source: "booking",
        listingId: new URLSearchParams(location.search).get("hotel_id"),
        prices: read(),
      },
    }),
    describe: (result) => ({
      tone: "good",
      text: `${result.saved} nightly rates in Innkeep, up to ${result.until}.`,
    }),
  });
})();

// Public property page, opened from Innkeep: the listing as guests see it, and, when
// the address carries dates, what a guest pays for that stay.
(() => {
  const isPublic = () => location.hostname === "www.booking.com";
  const hotelId = () => document.querySelector('input[name="hotel_id"]')?.value ?? null;
  // Which page this is, so Innkeep can recognise a listing it has no Booking.com number for yet.
  const pageUrl = () => location.origin + location.pathname;
  const blockLines = (testId) => [
    ...new Set(
      (document.querySelector(`[data-testid="${testId}"]`)?.innerText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  ];

  const readQuote = () => {
    const cells = [...document.querySelectorAll("#hprt-table tbody tr .hprt-table-cell-price")].map((cell) =>
      cell.innerText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
    return InnkeepParse.parseBookingQuote(location.search, hotelId(), cells);
  };

  /** The page's own structured data, plus its gallery, description and facilities. */
  const readPreview = () => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((script) => {
        try {
          return JSON.parse(script.textContent);
        } catch {
          return null;
        }
      })
      .find((data) => data?.aggregateRating || data?.["@type"] === "Hotel");
    if (!ld) return null;
    return InnkeepParse.buildPreview({
      ld,
      description: document.querySelector('[data-testid="property-description"]')?.innerText,
      images: [...document.querySelectorAll('[data-testid="GalleryUnifiedDesktop-wrapper"] img')].map(
        (image) => image.src,
      ),
      // First line is the block's heading.
      highlights: blockLines("PropertyHighlightList-wrapper").slice(1),
      // First line is the block's heading.
      amenities: blockLines("property-most-popular-facilities-wrapper").slice(1),
    });
  };

  InnkeepUI.mount({
    // The reviews panel has its own reader below.
    isActive: () =>
      isPublic() &&
      InnkeepUI.trusted() &&
      location.hash !== "#tab-reviews" &&
      hotelId() !== null &&
      (readQuote() ?? readPreview()) !== null,
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
      if (quote) {
        return {
          path: "/api/ingest/quote",
          payload: { source: "booking", listingUrl: pageUrl(), ...quote, preview },
        };
      }
      return preview
        ? {
            path: "/api/ingest/preview",
            payload: { source: "booking", listingId: hotelId(), listingUrl: pageUrl(), preview },
          }
        : { error: "Could not read this page." };
    },
    describe: () => ({ tone: "good", text: "Saved in Innkeep." }),
  });
})();

// Public property page with its reviews panel open, opened from Innkeep: the reviews guests left.
(() => {
  const hotelId = () => document.querySelector('input[name="hotel_id"]')?.value ?? null;
  // Ten reviews per page of the panel: they are remembered as the host pages through.
  const seen = new Map();

  const collect = () => {
    // The address has no language; the page itself does.
    const lang = document.documentElement.lang || navigator.language;
    for (const card of document.querySelectorAll('[data-testid="review-card"]')) {
      // textContent, not innerText: the panel may not be painted yet when this runs.
      const part = (testId) => card.querySelector(`[data-testid="${testId}"]`)?.textContent ?? "";
      const name = [
        ...(card.querySelector('[data-testid="review-avatar"]')?.querySelectorAll("*") ?? []),
      ].find((element) => !element.children.length && element.textContent.trim());
      const review = InnkeepParse.parseBookingReview(
        {
          author: name?.textContent ?? "",
          date: part("review-date"),
          title: part("review-title"),
          score: part("review-score"),
          positive: part("review-positive-text"),
          negative: part("review-negative-text"),
          reply: part("review-partner-reply"),
          nights: part("review-num-nights"),
          stayDate: part("review-stay-date"),
          traveler: part("review-traveler-type"),
        },
        lang,
      );
      if (review) seen.set(review.key, review);
    }
  };

  const total = () => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const count = Number(JSON.parse(script.textContent).aggregateRating?.reviewCount);
        if (count > 0) return count;
      } catch {
        // Not the block we are after.
      }
    }
    return null;
  };

  InnkeepUI.mount({
    isActive: () => {
      if (location.hostname !== "www.booking.com" || !InnkeepUI.trusted() || !hotelId()) return false;
      collect();
      return seen.size > 0;
    },
    prompt: "Innkeep can read these reviews. Go through the pages of the list to cover them all.",
    button: "Send to Innkeep",
    keepOpen: () => seen.size < (total() ?? Infinity),
    autoKey: () => (seen.size ? `reviews:${seen.size}` : null),
    collect: () => ({
      path: "/api/ingest/reviews",
      payload: {
        source: "booking",
        listingId: hotelId(),
        listingUrl: location.origin + location.pathname,
        reviews: [...seen.values()],
      },
    }),
    describe: (result) => ({
      tone: "good",
      text: `${result.saved} reviews in Innkeep${seen.size < (total() ?? 0) ? `, of ${total()}. Open the next page of the list.` : "."}`,
    }),
  });
})();

// Extranet pages that describe the property (photos, facilities, policies…):
// kept as shown. No control of their own. During a run, the extranet's own
// menu also tells the run which of these pages exist.
(() => {
  const isExtranet = () => location.hostname === "admin.booking.com";
  const hotelId = () => new URLSearchParams(location.search).get("hotel_id");

  const read = () => {
    const key = isExtranet() ? InnkeepParse.extranetPage(location.pathname) : null;
    if (!key) return null;
    const area = document.querySelector("main, [role='main'], #main-content") ?? document.body;
    return InnkeepParse.buildPage(
      `extranet/${key}`,
      area.querySelector("h1, h2")?.innerText ?? document.title,
      area.innerText.split("\n"),
      [...area.querySelectorAll("img")]
        .map((image) => image.currentSrc || image.src)
        .filter((url) => /bstatic\.com\/xdata\/images\/hotel\//.test(url)),
    );
  };

  InnkeepUI.mount({
    quiet: true,
    isActive: () => hotelId() !== null && read() !== null,
    keepOpen: true,
    autoKey: () => {
      const page = read();
      return page ? `${page.key}:${page.lines.length}:${page.images.length}` : null;
    },
    collect: () => ({
      path: "/api/ingest/page",
      payload: { source: "booking", listingId: hotelId(), page: read() },
    }),
  });

  // Tell a run which property pages this extranet has, from its own menu.
  // Only addresses of the same property, and only pages `extranetPage` accepts.
  const reportMenu = () => {
    if (!isExtranet() || !hotelId()) return;
    const pages = new Map();
    for (const link of document.querySelectorAll('a[href*="/extranet_ng/manage/"]')) {
      const url = new URL(link.href);
      const key = InnkeepParse.extranetPage(url.pathname);
      if (!key || url.searchParams.get("hotel_id") !== hotelId() || pages.has(key)) continue;
      // The session part of the address is left out; the browser's own sign-in carries the visit.
      pages.set(key, {
        url: `${url.origin}${url.pathname}?hotel_id=${hotelId()}`,
        label: `Booking.com: ${link.innerText.trim().slice(0, 40) || key}`,
      });
    }
    if (pages.size) void InnkeepUI.ask({ type: "innkeep:tour-found", pages: [...pages.values()] });
  };
  setTimeout(reportMenu, 2500);
})();
