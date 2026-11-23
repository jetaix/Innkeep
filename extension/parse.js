/**
 * Pure parsing helpers for the reservations pages. No DOM access and no
 * network: text in, plain values out, so they are unit tested in Node
 * (see parse.test.ts) and shared by the content scripts as `InnkeepParse`.
 */
(() => {
  const fold = (value) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\./g, "")
      .trim();

  /** Month names as the browser writes them in `lang`, plus English as a fallback. */
  function monthNames(lang) {
    const names = [];
    for (const locale of [lang, "en"]) {
      for (const style of ["short", "long"]) {
        let format;
        try {
          format = new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" });
        } catch {
          continue;
        }
        for (let month = 0; month < 12; month++) {
          names.push({ month, name: fold(format.format(new Date(Date.UTC(2024, month, 15)))) });
        }
      }
    }
    // Longest first, so "juillet" is not mistaken for "juin".
    return names.filter((entry) => entry.name.length >= 3).sort((a, b) => b.name.length - a.name.length);
  }

  /**
   * Reads a written date such as "2 nov. 2026", "Nov 2, 2026" or "2. Nov. 2026".
   * Returns "YYYY-MM-DD", or null when the month is not spelled out (an
   * all-numeric date is ambiguous between day/month orders, so it is refused).
   */
  function parseDate(text, lang) {
    const year = /\b(19|20)\d{2}\b/.exec(text)?.[0];
    if (!year) return null;
    const rest = text.replace(year, " ");
    const day = /\b(\d{1,2})\b/.exec(rest)?.[1];
    const word = fold(rest.replace(/[\d,]/g, " "))
      .split(/\s+/)
      .find((token) => token.length >= 3);
    if (!day || !word) return null;

    const match = monthNames(lang).find(
      (entry) => word.startsWith(entry.name) || entry.name.startsWith(word),
    );
    if (!match) return null;
    const iso = `${year}-${String(match.month + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
    const check = new Date(`${iso}T00:00:00Z`);
    return Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== iso ? null : iso;
  }

  /** "2 465,78 €", "$1,250.50" or "1.250 €" to minor units (cents). */
  function parseMoney(text) {
    const cleaned = text.replace(/[^\d.,]/g, "");
    if (!/\d/.test(cleaned)) return null;
    const last = Math.max(cleaned.lastIndexOf("."), cleaned.lastIndexOf(","));
    const decimals = last !== -1 && cleaned.length - last - 1 <= 2;
    const normalised = decimals
      ? `${cleaned.slice(0, last).replace(/[.,]/g, "")}.${cleaned.slice(last + 1)}`
      : cleaned.replace(/[.,]/g, "");
    const value = Number(normalised);
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  }

  /**
   * Whether a status cell says the booking was cancelled or never happened.
   * The word is close enough across the languages both sites offer; a payout
   * or price of zero is the second signal.
   */
  const CANCELLED = /annul|cancel|storn|geannul|declin|refus|rifiut|abgelehnt|no[- ]?show/i;

  const firstLine = (text) => text.split("\n")[0].trim();

  /**
   * One row of Airbnb's host reservations table, as the text of its cells:
   * status, guests, contact, check-in, check-out, booked, listing, code, payout, actions.
   * The contact cell (phone number) is deliberately not read.
   */
  function parseAirbnbRow(cells, lang) {
    if (cells.length < 9) return null;
    const code = cells[7].trim();
    const checkIn = parseDate(cells[3], lang);
    const checkOut = parseDate(cells[4], lang);
    if (!/^[A-Z0-9]{6,12}$/.test(code) || !checkIn || !checkOut || checkOut <= checkIn) return null;

    const [guestName = "", party = ""] = cells[1].split("\n").map((line) => line.trim());
    const guests = Number(/\d+/.exec(party)?.[0]);
    const payout = parseMoney(cells[8]);
    const statusText = firstLine(cells[0]);
    return {
      code,
      checkIn,
      checkOut,
      guestName,
      guests: Number.isInteger(guests) && guests > 0 ? guests : null,
      payout,
      listingName: cells[6].replace(/\s*\n\s*/g, " | ").trim(),
      status: CANCELLED.test(statusText) || payout === 0 ? "cancelled" : "confirmed",
      statusText,
      bookedOn: parseDate(firstLine(cells[5]), lang),
    };
  }

  /**
   * One row of the Booking.com extranet reservations table, as the text of its cells:
   * guest, arrival, departure, rooms, booked on, status, price, commission and fees, number.
   * A row with no price is a cancelled booking. The payout is the price minus
   * Booking.com's commission and fees.
   */
  function parseBookingRow(cells, lang) {
    if (cells.length < 9) return null;
    const code = cells[8].trim();
    const checkIn = parseDate(cells[1], lang);
    const checkOut = parseDate(cells[2], lang);
    if (!/^\d{7,12}$/.test(code) || !checkIn || !checkOut || checkOut <= checkIn) return null;

    const [guestName = "", party = ""] = cells[0]
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const guests = Number(/\d+/.exec(party)?.[0]);
    const price = parseMoney(firstLine(cells[6]));
    const fees = parseMoney(firstLine(cells[7]));
    const statusText = firstLine(cells[5]);
    const cancelled = CANCELLED.test(statusText) || !price;
    return {
      code,
      checkIn,
      checkOut,
      guestName,
      guests: Number.isInteger(guests) && guests > 0 ? guests : null,
      payout: cancelled ? null : Math.max(0, price - (fees ?? 0)),
      listingName: "",
      status: cancelled ? "cancelled" : "confirmed",
      statusText,
      bookedOn: parseDate(firstLine(cells[4]), lang),
      price: cancelled ? null : price,
      fees: cancelled ? null : fees,
      room: firstLine(cells[3]),
    };
  }

  /** "16:00 - 21:00" or "4:00 PM" to "16:00"; the first time on the line. */
  function parseTime(text) {
    const match = /\b(\d{1,2})[:h.](\d{2})\s*([ap])?\.?m?\b/i.exec(text);
    if (!match) return null;
    let hour = Number(match[1]);
    const half = match[3]?.toLowerCase();
    if (half === "p" && hour < 12) hour += 12;
    if (half === "a" && hour === 12) hour = 0;
    return hour > 23 || Number(match[2]) > 59 ? null : `${String(hour).padStart(2, "0")}:${match[2]}`;
  }

  /**
   * Editor cards that describe the listing itself. Cards that hold access
   * details (door codes, directions, wifi) or people (host, co-hosts) are
   * never read.
   */
  const LISTING_SECTIONS = [
    "property-type",
    "photo-tour",
    "sleeping-arrangements",
    "pricing",
    "discounts",
    "availability",
    "instant-book",
    "amenities",
    "accessibility",
    "check-in-out",
    "house-rules",
    "guest-safety",
    "cancellation-policy",
  ];

  /**
   * The Airbnb listing editor: the listing id from the address, plus the text
   * of its cards, keyed by the section each card links to (heading first,
   * values after). Only the id is required, because the editor spreads the
   * cards over two tabs.
   */
  function parseAirbnbListing(pathname, origin, cards) {
    const listingId = /\/hosting\/listings\/editor\/(\d{5,25})(\/|$)/.exec(pathname)?.[1];
    if (!listingId) return null;
    const values = (section) => (cards[section] ?? []).slice(1);
    const whole = (value) => (Number.isInteger(value) && value >= 0 ? value : null);

    const listing = { listingId, listingUrl: `${origin}/rooms/${listingId}` };
    const title = values("title").join(" ").trim();
    if (title) listing.title = title;

    const maxGuests = whole(Number(/\d+/.exec(values("number-of-guests").join(" "))?.[0]));
    if (maxGuests) listing.maxGuests = maxGuests;

    const description = values("description").join("\n\n").trim();
    if (description) listing.description = description;

    const address = values("location").join(", ").trim();
    if (address) listing.address = address;

    // "1 bedroom", "1 bed", "1 bathroom", "18 photos"; a studio has no bedroom line.
    const counts = values("photo-tour")
      .map((line) => /^(\d+(?:[.,]\d)?)\s/.exec(line)?.[1])
      .filter(Boolean)
      .map((count) => Number(count.replace(",", ".")));
    if (counts.length === 4 || counts.length === 3) {
      const [bedrooms, , bathrooms] = counts.length === 4 ? counts : [0, ...counts];
      listing.bedrooms = whole(bedrooms) ?? undefined;
      listing.bathrooms = whole(Math.ceil(bathrooms)) ?? undefined;
    }

    const times = values("check-in-out").map(parseTime).filter(Boolean);
    if (times.length >= 2) {
      listing.checkInTime = times[0];
      listing.checkOutTime = times.at(-1);
    }

    // The card ends with "+ 2 more" when it does not show every rule.
    const rules = values("house-rules").filter((line) => !line.startsWith("+"));
    if (rules.length) listing.houseRules = rules.join("\n");

    const details = {};
    for (const section of LISTING_SECTIONS) {
      // Cards join some values with stray separators ("Entire place", ",", "· Flat").
      const lines = (cards[section] ?? [])
        .map((line) => line.replace(/^[·•,\s]+/, "").slice(0, 200))
        .filter(Boolean)
        .slice(0, 12);
      if (lines.length > 1) details[section] = lines;
    }
    if (Object.keys(details).length) listing.details = details;

    // Nothing beyond the id means the cards have not loaded yet.
    return Object.keys(listing).length > 2 ? listing : null;
  }

  /**
   * A line that is an amount with its currency ("93 €", "€ 70.5", "CHF 120"),
   * as opposed to a day number or a weekday ("jeu. 19").
   */
  const isPrice = (line) => /\d/.test(line) && /\p{Sc}|\b[A-Z]{3}\b/u.test(line);

  /**
   * One day of Airbnb's listing calendar, as the lines of text in its cell:
   * "lundi 1 nov.", "1", "Prix par nuit", "62 €", then a holiday name on some days.
   * Booked or blocked days show no price and return null.
   */
  function parseAirbnbDay(date, lines) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const index = lines.findIndex((line, position) => position > 0 && isPrice(line));
    const amount = index === -1 ? null : parseMoney(lines[index]);
    if (!amount) return null;
    // Whatever follows the price is the label Airbnb puts on the day (a holiday, an event).
    const note = lines
      .slice(index + 1)
      .join(" ")
      .trim()
      .slice(0, 80);
    return note ? { date, amount, note } : { date, amount };
  }

  /**
   * One row of the Booking.com extranet calendar: the row's label and its
   * cells as { date, text }. Only rate rows carry a currency; rows such as
   * "rooms to sell" return nothing. The plan is the label's first line, minus
   * the occupancy ("× 2") and the edit link that share the cell.
   */
  function parseBookingRateRow(label, cells) {
    const plan = (label.split("\n")[0] ?? "")
      .replace(/\s*[×x]\s*\d+.*$/i, "")
      .trim()
      .slice(0, 60);
    const prices = [];
    for (const cell of cells) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cell.date) || !isPrice(cell.text)) continue;
      const amount = parseMoney(cell.text);
      if (amount) prices.push({ date: cell.date, amount, plan });
    }
    return plan ? prices : [];
  }

  /** Every amount written on the lines that carry a currency. */
  const amountsIn = (lines) =>
    lines
      .filter(isPrice)
      .flatMap((line) => line.match(/\d[\d\s.,\u202f\u00a0]*/g) ?? [])
      .map((text) => parseMoney(text))
      .filter((amount) => amount && amount > 0);

  /**
   * The booking box of a public Airbnb listing page opened with dates: the
   * stay from the address (check_in, check_out, adults) and the amounts the
   * box shows above the date fields. The lowest is what the guest pays in
   * total; a higher one beside it is the price before a discount.
   */
  function parseAirbnbQuote(pathname, search, lines) {
    const listingId = /^\/rooms\/(\d{5,25})(\/|$)/.exec(pathname)?.[1];
    const params = new URLSearchParams(search);
    const checkIn = params.get("check_in") ?? "";
    const checkOut = params.get("check_out") ?? "";
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!listingId || !iso.test(checkIn) || !iso.test(checkOut) || checkOut <= checkIn) return null;

    // Amounts sit above the date fields; below them come deposits and fine print.
    const end = lines.findIndex((line) => /\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/.test(line));
    const amounts = amountsIn(end === -1 ? lines : lines.slice(0, end));
    if (amounts.length === 0) return null;
    const total = Math.min(...amounts);
    const highest = Math.max(...amounts);
    const guests = Number(params.get("adults"));
    return {
      listingId,
      checkIn,
      checkOut,
      guests: Number.isInteger(guests) && guests > 0 ? guests : null,
      total,
      original: highest > total ? highest : null,
    };
  }

  /**
   * A public Booking.com property page opened with dates: the stay from the
   * address (checkin, checkout, group_adults), the property id the page
   * carries, and the lines of each offer's price cell. The cheapest offer is
   * what a guest pays; a struck-through amount beside it is the price before
   * a discount.
   */
  function parseBookingQuote(search, hotelId, priceCells) {
    const params = new URLSearchParams(search);
    const checkIn = params.get("checkin") ?? "";
    const checkOut = params.get("checkout") ?? "";
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!/^\d{3,12}$/.test(hotelId ?? "") || !iso.test(checkIn) || !iso.test(checkOut) || checkOut <= checkIn)
      return null;

    const offers = priceCells
      .map((lines) => amountsIn(lines))
      .filter((amounts) => amounts.length > 0)
      .map((amounts) => ({ total: Math.min(...amounts), highest: Math.max(...amounts) }))
      .sort((a, b) => a.total - b.total);
    if (offers.length === 0) return null;
    const guests = Number(params.get("group_adults"));
    return {
      listingId: hotelId,
      checkIn,
      checkOut,
      guests: Number.isInteger(guests) && guests > 0 ? guests : null,
      total: offers[0].total,
      original: offers[0].highest > offers[0].total ? offers[0].highest : null,
    };
  }

  /**
   * Airbnb's highlights section as text lines: a heading for screen readers,
   * then a title and a sentence per highlight, sometimes a "learn more" link
   * at the end. Returns the title and sentence pairs only.
   */
  function highlightLines(lines) {
    const rest = lines.slice(1);
    return rest.length % 2 ? rest.slice(0, -1) : rest;
  }

  /**
   * Airbnb's amenities section as text lines, without its heading, its "show
   * all" button, and the amenities it lists as unavailable (written twice:
   * "Unavailable: Smoke alarm" then "Smoke alarm").
   */
  function amenityLines(lines) {
    const body = lines.slice(1, -1);
    return body.filter((line, index) => {
      const next = body[index + 1];
      const previous = body[index - 1];
      const flagsNext = next != null && line !== next && line.endsWith(next);
      const flagged = previous != null && previous !== line && previous.endsWith(line);
      return !flagsNext && !flagged;
    });
  }

  /**
   * A public listing page condensed into what Innkeep shows as a preview.
   * `raw` is what the page scripts collected: the page's own structured data
   * (schema.org JSON-LD) and the text lines of a few sections. Review texts,
   * reviewer names and host details are never part of it.
   */
  function buildPreview(raw) {
    const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
    const list = (values, max, length) =>
      [...new Set((values ?? []).map((value) => text(value, length)).filter(Boolean))].slice(0, max);
    const ld = raw.ld ?? {};
    const rating = Number(ld.aggregateRating?.ratingValue);
    const reviews = Number(ld.aggregateRating?.reviewCount ?? ld.aggregateRating?.ratingCount);
    const images = list([...(raw.images ?? []), ...[ld.image].flat()], 12, 500).filter((url) =>
      /^https:\/\//.test(url),
    );
    const title = text(raw.title, 255) || text(ld.name, 255);
    if (!title) return null;
    return {
      title,
      description: text(raw.description, 6000) || text(ld.description, 6000),
      images,
      rating: Number.isFinite(rating) && rating > 0 ? rating : null,
      // Airbnb scores out of 5, Booking.com out of 10.
      ratingScale: Number(ld.aggregateRating?.bestRating) === 10 || rating > 5 ? 10 : 5,
      reviews: Number.isInteger(reviews) && reviews >= 0 ? reviews : null,
      location:
        text(raw.location, 200) || text(ld.address?.streetAddress ?? ld.address?.addressLocality, 200),
      summary: list(raw.summary, 4, 200),
      highlights: list(raw.highlights, 8, 300),
      amenities: list(raw.amenities, 16, 80),
    };
  }

  /** "octobre 2026" or "October 2026" to "2026-10"; null when the month is not spelled out. */
  function parseMonthYear(text, lang) {
    const year = /\b(19|20)\d{2}\b/.exec(text)?.[0];
    if (!year) return null;
    const words = fold(text.replace(/\d/g, " "))
      .split(/\s+/)
      .filter((word) => word.length >= 3);
    const names = monthNames(lang);
    for (const word of words) {
      const match = names.find((entry) => word.startsWith(entry.name) || entry.name.startsWith(word));
      if (match) return `${year}-${String(match.month + 1).padStart(2, "0")}`;
    }
    return null;
  }

  /** The date written somewhere in a sentence ("Reviewed: 2 April 2026"), or just its month. */
  function findDate(text, lang) {
    const dayFirst = /(\d{1,2})\.?\s+(\S+)\s+((?:19|20)\d{2})/.exec(text);
    const monthFirst = /(\S+)\s+(\d{1,2}),?\s+((?:19|20)\d{2})/.exec(text);
    return (
      (dayFirst && parseDate(dayFirst[0], lang)) ||
      (monthFirst && parseDate(monthFirst[0], lang)) ||
      parseMonthYear(text, lang)
    );
  }

  /**
   * One review in Airbnb's reviews window, as the text lines of its three
   * blocks: the header (name, time on Airbnb, rating, ",", "·", month, ",",
   * "·", kind of trip), the review itself, and the host's reply (heading,
   * month, text) when there is one.
   */
  function parseAirbnbReview(id, header, body, reply, lang) {
    const author = (header[0] ?? "").slice(0, 80);
    const text = body.join("\n").trim();
    if (!id || !author || !text) return null;
    // The rating is the line just before the first separator.
    const firstComma = header.indexOf(",");
    const rating = Number(/[1-5]/.exec(firstComma > 0 ? header[firstComma - 1] : "")?.[0]);
    const dots = header.flatMap((line, index) => (line === "·" ? [index] : []));
    return {
      key: String(id),
      author,
      rating: rating || null,
      scale: 5,
      reviewedOn: dots.length ? parseMonthYear(header[dots[0] + 1] ?? "", lang) : null,
      stay: (dots.length > 1 ? (header[dots[1] + 1] ?? "") : "").slice(0, 120),
      title: "",
      body: text.slice(0, 5000),
      negative: "",
      reply: reply.slice(2).join("\n").trim().slice(0, 5000),
    };
  }

  /**
   * One review card of a public Booking.com page, as the text of its parts.
   * The score is written twice (once for screen readers); the first number is
   * taken. The reply starts with a label ending in a colon.
   */
  function parseBookingReview(parts, lang) {
    const clean = (value) => (value ?? "").replace(/\s+/g, " ").trim();
    const author = clean(parts.author).slice(0, 80);
    const title = clean(parts.title);
    const positive = clean(parts.positive);
    const negative = clean(parts.negative);
    if (!author || (!title && !positive && !negative)) return null;
    const score = Number(/\d{1,2}(?:[.,]\d)?/.exec(clean(parts.score))?.[0].replace(",", "."));
    const reviewedOn = findDate(clean(parts.date), lang);
    const reply = clean(parts.reply);
    return {
      // The page gives reviews no id; who, when and the opening words tell them apart.
      key: `${author}|${reviewedOn ?? ""}|${(title || positive || negative).slice(0, 40)}`,
      author,
      rating: Number.isFinite(score) && score > 0 && score <= 10 ? score : null,
      scale: 10,
      reviewedOn,
      stay: [clean(parts.nights).replace(/[·\s]+$/, ""), clean(parts.stayDate), clean(parts.traveler)]
        .filter(Boolean)
        .join(", ")
        .slice(0, 120),
      title: title.slice(0, 200),
      body: positive.slice(0, 5000),
      negative: negative.slice(0, 5000),
      reply: reply
        .slice(reply.indexOf(":") + 1)
        .trim()
        .slice(0, 5000),
    };
  }

  const WEEKDAYS = [
    ["dimanche", "sunday"],
    ["lundi", "monday"],
    ["mardi", "tuesday"],
    ["mercredi", "wednesday"],
    ["jeudi", "thursday"],
    ["vendredi", "friday"],
    ["samedi", "saturday"],
  ];

  /**
   * When a message was sent, as Airbnb's inbox says it: "Hier, 21:18",
   * "Aujourd'hui, 9:05", "lundi, 14:30", "12 nov., 08:15" or "12 nov. 2026,
   * 08:15". Answers a timestamp in the browser's own time zone, or null when
   * the day cannot be told with certainty.
   */
  function parseMessageWhen(when, lang, now) {
    const time = /(\d{1,2})[:h](\d{2})\s*([ap]m)?/i.exec(when);
    if (!time) return null;
    let hour = Number(time[1]);
    const minute = Number(time[2]);
    if (time[3]) hour = (hour % 12) + (/p/i.test(time[3]) ? 12 : 0);
    if (hour > 23 || minute > 59) return null;

    const dayText = when
      .slice(0, time.index)
      .replace(/[,\s]+$/, "")
      .trim();
    const word = fold(dayText).replace(/[^a-z]/g, "");
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    if (word === "" || /^(aujourdhui|today)$/.test(word)) {
      // Today.
    } else if (/^(hier|yesterday)$/.test(word)) {
      date.setDate(date.getDate() - 1);
    } else if (WEEKDAYS.some((names) => names.includes(word))) {
      const target = WEEKDAYS.findIndex((names) => names.includes(word));
      // A weekday on its own is the most recent one, never today.
      date.setDate(date.getDate() - ((date.getDay() - target + 7) % 7 || 7));
    } else {
      const withYear = /\b(19|20)\d{2}\b/.test(dayText);
      let iso = parseDate(withYear ? dayText : `${dayText} ${date.getFullYear()}`, lang);
      if (!iso) return null;
      // Without a year the date is in the past: "28 déc." read in January was last year.
      if (!withYear && new Date(`${iso}T00:00:00`).getTime() > date.getTime() + 86_400_000) {
        iso = parseDate(`${dayText} ${date.getFullYear() - 1}`, lang);
        if (!iso) return null;
      }
      const [year, month, day] = iso.split("-").map(Number);
      date.setFullYear(year, month - 1, day);
    }
    date.setHours(hour, minute, 0, 0);
    return date.getTime();
  }

  /**
   * One message of an Airbnb conversation, from the sentence the inbox gives
   * screen readers: "Camille a envoyé Bonjour. Envoyé à Hier, 21:23. Lu par
   * Jonathan", sometimes after "Hier." or "Dernier message.". A notice from
   * Airbnb itself ("Message du service Airbnb : …") is marked as such.
   */
  function parseAirbnbMessage(label, lang, now) {
    const text = (label ?? "").replace(/\s+/g, " ").trim();
    // The last "sent at": the message itself may contain those words.
    const tails = [
      ...text.matchAll(/\. (?:Envoyé à|Envoyé|Sent at|Sent) (.*?\d{1,2}[:h]\d{2}(?:\s?[ap]m)?)(?=\.|$)/gi),
    ];
    const tail = tails.at(-1);
    if (!tail) return null;
    const head = text.slice(0, tail.index);
    const sentAt = parseMessageWhen(tail[1], lang, now);

    const service =
      /(?:^|\. )(?:Message du service Airbnb|Message from Airbnb(?: service)?) ?: ?([\s\S]*)$/i.exec(head);
    if (service) return { service: true, author: "Airbnb", body: service[1].trim().slice(0, 5000), sentAt };
    const person = /(?:^|\. )([^.:]{1,60}?) (?:a envoyé|sent) ([\s\S]+)$/.exec(head);
    if (!person) return null;
    const body = person[2].trim().slice(0, 5000);
    return body ? { service: false, author: person[1].trim(), body, sentAt } : null;
  }

  /**
   * Extranet pages worth keeping as they are shown: the ones that describe
   * the property. Pages about money, the account, guests or messages are
   * never read this way, whatever they are called.
   */
  const EXTRANET_KEEP =
    /photo|description|general|facilit|amenit|room|polic|propert|quality|score|opportunit|promotion|restriction|nearby|location|sustainab|view|setting|profile|house|rule|children|bed|charge|fee|tax|language|content/;
  const EXTRANET_NEVER =
    /financ|invoice|payout|payment|bank|vat|security|account|user|access|messag|inbox|contact|reserv|booking|guest|review|calendar|home|login|sign|statement|card|commission|legal|contract/;

  /** The page name of an extranet address ("photos"), when that page may be kept; null otherwise. */
  function extranetPage(pathname) {
    const name = /\/extranet_ng\/manage\/(?:[a-z0-9_-]+\/)*([a-z0-9_-]+)\.html$/i
      .exec(pathname)?.[1]
      ?.toLowerCase();
    return name && EXTRANET_KEEP.test(name) && !EXTRANET_NEVER.test(name) ? name : null;
  }

  /** The section of an Airbnb editor address, when it is one that describes the listing. */
  function editorSection(pathname) {
    const section = /\/hosting\/listings\/editor\/\d+\/(?:details|arrival)\/([a-z0-9-]+)$/.exec(
      pathname,
    )?.[1];
    return section && LISTING_SECTIONS.includes(section) ? section : null;
  }

  /**
   * One admin page kept as shown: its name, a title, the lines of text of its
   * main area and the photos in it. Long pages are cut, repeated lines dropped.
   */
  function buildPage(key, title, lines, images) {
    const kept = [];
    const seen = new Set();
    for (const raw of lines) {
      const line = raw.replace(/\s+/g, " ").trim().slice(0, 240);
      if (!line || seen.has(line)) continue;
      seen.add(line);
      kept.push(line);
      if (kept.length >= 250) break;
    }
    const photos = [...new Set(images)].filter((url) => /^https:\/\//.test(url)).slice(0, 60);
    if (!key || (kept.length === 0 && photos.length === 0)) return null;
    return {
      key: key.slice(0, 80),
      title: (title || key).replace(/\s+/g, " ").trim().slice(0, 120),
      lines: kept,
      images: photos,
    };
  }

  globalThis.InnkeepParse = {
    parseDate,
    parseMoney,
    parseTime,
    parseAirbnbRow,
    parseBookingRow,
    parseAirbnbListing,
    parseAirbnbDay,
    parseBookingRateRow,
    parseAirbnbQuote,
    parseBookingQuote,
    buildPreview,
    highlightLines,
    amenityLines,
    parseMonthYear,
    findDate,
    parseAirbnbReview,
    parseBookingReview,
    parseMessageWhen,
    parseAirbnbMessage,
    extranetPage,
    editorSection,
    buildPage,
  };
})();
