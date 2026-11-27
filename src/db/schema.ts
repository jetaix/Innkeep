import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/** Platforms a listing can live on. */
export const OTA_CHANNELS = ["airbnb", "booking"] as const;
export type OtaChannel = (typeof OTA_CHANNELS)[number];

/** Where a reservation or conversation came from. "direct" = created in Innkeep. */
export type Source = OtaChannel | "direct";

export const properties = sqliteTable("properties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  address: text("address").notNull().default(""),
  // Master listing content, shared by every channel unless overridden.
  title: text("title").notNull().default(""),
  description: text("description").notNull().default(""),
  maxGuests: integer("max_guests").notNull().default(2),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  basePrice: integer("base_price").notNull().default(100),
  currency: text("currency").notNull().default("EUR"),
  checkInTime: text("check_in_time").notNull().default("15:00"),
  checkOutTime: text("check_out_time").notNull().default("11:00"),
  houseRules: text("house_rules").notNull().default(""),
  /** Whether this place appears in the cleaning schedule. Off for a place the host cleans without planning. */
  cleaningEnabled: integer("cleaning_enabled", { mode: "boolean" }).notNull().default(true),
  /** Secret used in the public iCal export URLs. */
  icalToken: text("ical_token").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const listings = sqliteTable(
  "listings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    channel: text("channel").$type<OtaChannel>().notNull(),
    listingUrl: text("listing_url").notNull().default(""),
    /** The channel's id for this listing: Airbnb listing id or Booking.com property id. */
    externalId: text("external_id"),
    /** iCal feed exported by the channel, imported by Innkeep. */
    icalUrl: text("ical_url").notNull().default(""),
    titleOverride: text("title_override").notNull().default(""),
    descriptionOverride: text("description_override").notNull().default(""),
    /** Hash of the content last confirmed as live on the channel. */
    publishedHash: text("published_hash"),
    publishedAt: integer("published_at"),
    /** Facts read from the channel's listing editor: JSON, section to lines of text. */
    channelDetails: text("channel_details"),
    channelDetailsAt: integer("channel_details_at"),
    /** The listing as the channel's public page shows it to guests: JSON, see `previewSchema`. */
    publicPreview: text("public_preview"),
    publicPreviewAt: integer("public_preview_at"),
    lastSyncedAt: integer("last_synced_at"),
    lastSyncError: text("last_sync_error"),
  },
  (t) => [uniqueIndex("listings_property_channel").on(t.propertyId, t.channel)],
);

export const reservations = sqliteTable(
  "reservations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    source: text("source").$type<Source>().notNull(),
    kind: text("kind").$type<"reservation" | "block">().notNull().default("reservation"),
    /** UID of the event in the channel's iCal feed; null for direct entries. */
    externalUid: text("external_uid"),
    guestName: text("guest_name").notNull().default(""),
    checkIn: text("check_in").notNull(),
    checkOut: text("check_out").notNull(),
    status: text("status").$type<"confirmed" | "cancelled">().notNull().default("confirmed"),
    /** Details supplied by the channel (reservation link, phone digits…). */
    channelInfo: text("channel_info").notNull().default(""),
    notes: text("notes").notNull().default(""),
    /** Host payout in minor units (cents). Null = unknown, estimated from the nightly rate. */
    amount: integer("amount"),
    /** The channel's confirmation code, e.g. Airbnb's "HM…". */
    externalCode: text("external_code"),
    /** Number of guests, when the channel told us. */
    guests: integer("guests"),
    /** The day the guest booked, when the channel told us. */
    bookedOn: text("booked_on"),
    /** The status as the channel words it, in the host's language. */
    channelStatus: text("channel_status"),
    /** What the guest paid before the channel's commission and fees, in minor units. */
    grossAmount: integer("gross_amount"),
    /** The channel's commission and fees on this stay, in minor units. */
    channelFees: integer("channel_fees"),
    /** The listing (Airbnb) or room (Booking.com) the guest booked, as the channel names it. */
    unitName: text("unit_name"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [uniqueIndex("reservations_external").on(t.propertyId, t.source, t.externalUid)],
);

/**
 * What happened to a stay that the host should hear about: it appeared, was
 * cancelled, or moved. The browser extension reads these to show notifications.
 */
export const reservationEvents = sqliteTable("reservation_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reservationId: integer("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"new" | "cancelled" | "changed">().notNull(),
  /** For "changed": the dates the stay had before, as "check-in/check-out". */
  detail: text("detail").notNull().default(""),
  at: integer("at").notNull(),
});

/**
 * Guest conversations and their messages. Innkeep no longer reads or shows
 * guest messages; the two tables stay so that what an earlier version stored
 * is not lost.
 */
export const conversations = sqliteTable(
  "conversations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    source: text("source").$type<Source>().notNull(),
    guestName: text("guest_name").notNull(),
    /** Thread identifier on the channel side, used to group inbound messages. */
    externalThreadId: text("external_thread_id"),
    unread: integer("unread").notNull().default(0),
    lastMessageAt: integer("last_message_at").notNull(),
  },
  (t) => [uniqueIndex("conversations_thread").on(t.source, t.externalThreadId)],
);

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  direction: text("direction").$type<"in" | "out">().notNull(),
  body: text("body").notNull(),
  /**
   * delivered: the channel accepted it. local: saved in Innkeep only because
   * the channel has no connected messaging API, so the host must paste it.
   */
  delivery: text("delivery").$type<"delivered" | "local">().notNull().default("delivered"),
  sentAt: integer("sent_at").notNull(),
  /** Tells a message read from a platform's inbox apart from its neighbours, so reading it twice keeps one. */
  externalKey: text("external_key"),
});

export const CHARGE_FREQUENCIES = ["once", "monthly", "yearly", "per_stay", "per_night", "percent"] as const;
export type ChargeFrequency = (typeof CHARGE_FREQUENCIES)[number];

export const CHARGE_CATEGORIES = [
  "cleaning",
  "commission",
  "utilities",
  "subscription",
  "maintenance",
  "tax",
  "other",
] as const;
export type ChargeCategory = (typeof CHARGE_CATEGORIES)[number];

/** A cost set against revenue: a one-off bill, a subscription, a fee per stay or a commission. */
export const charges = sqliteTable("charges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Null applies the charge to every property. */
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  category: text("category").$type<ChargeCategory>().notNull().default("other"),
  frequency: text("frequency").$type<ChargeFrequency>().notNull(),
  /** Minor units (cents), or basis points (1500 = 15%) when frequency is "percent". */
  amount: integer("amount").notNull(),
  /** Limits per-stay, per-night and percent charges to one booking source. */
  appliesTo: text("applies_to").$type<Source | "all">().notNull().default("all"),
  /** The bill date for "once"; otherwise the first day the charge is active. */
  startsOn: text("starts_on").notNull(),
  endsOn: text("ends_on"),
  createdAt: integer("created_at").notNull(),
});

/** What a line of costs can be filed under: a charge's own category, or a loan's repayment. */
export type CostCategory = ChargeCategory | "loan";

/** Money borrowed for a property, repaid in equal monthly payments. */
export const loans = sqliteTable("loans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Null counts the loan against every property. */
  propertyId: integer("property_id").references(() => properties.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  /** The amount borrowed, in minor units (cents). */
  principal: integer("principal").notNull(),
  /** Yearly interest rate in basis points (385 = 3.85%). */
  rate: integer("rate").notNull(),
  /** How many monthly payments repay it. */
  months: integer("months").notNull(),
  /** Borrower's insurance paid with each payment, in minor units. */
  insurance: integer("insurance").notNull().default(0),
  /** The day of the first payment. */
  startsOn: text("starts_on").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const dismissedSuggestions = sqliteTable("dismissed_suggestions", {
  key: text("key").primaryKey(),
  dismissedAt: integer("dismissed_at").notNull(),
});

/** The latest AI-written advice, kept so the page renders without calling the model. */
export const aiAdvice = sqliteTable("ai_advice", {
  id: integer("id").primaryKey(),
  generatedAt: integer("generated_at").notNull(),
  model: text("model").notNull(),
  payload: text("payload").notNull(),
});

export type Charge = typeof charges.$inferSelect;
export type Loan = typeof loans.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

/** Small facts about this installation, such as when the browser extension last called. */
export const appState = sqliteTable("app_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * What one night costs a guest on one platform, as the platform's own calendar
 * shows it. Airbnb has one price per night; Booking.com has one per rate plan.
 */
export const nightlyPrices = sqliteTable(
  "nightly_prices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    source: text("source").$type<OtaChannel>().notNull(),
    /** Booking.com rate plan ("Standard Rate"); empty on Airbnb. */
    plan: text("plan").notNull().default(""),
    date: text("date").notNull(),
    /** Minor units (cents), before any platform fee. */
    amount: integer("amount").notNull(),
    /** A label the platform puts on the day, such as a public holiday. */
    note: text("note"),
    seenAt: integer("seen_at").notNull(),
  },
  (t) => [uniqueIndex("nightly_prices_night").on(t.propertyId, t.source, t.plan, t.date)],
);
export type NightlyPrice = typeof nightlyPrices.$inferSelect;

/**
 * What a guest is shown for a whole stay on a platform's public listing page:
 * nightly prices plus the platform's fees, minus any discount. Read by the
 * extension when the host opens that page from Innkeep.
 */
export const guestQuotes = sqliteTable(
  "guest_quotes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    source: text("source").$type<OtaChannel>().notNull(),
    checkIn: text("check_in").notNull(),
    checkOut: text("check_out").notNull(),
    guests: integer("guests"),
    /** What the guest pays in total, minor units. */
    total: integer("total").notNull(),
    /** The price before a discount, when the page shows one. */
    original: integer("original"),
    seenAt: integer("seen_at").notNull(),
  },
  (t) => [uniqueIndex("guest_quotes_stay").on(t.propertyId, t.source, t.checkIn, t.checkOut)],
);
export type GuestQuote = typeof guestQuotes.$inferSelect;

/**
 * A review a guest left on a platform, as its public page shows it, with the
 * host's reply when there is one. Read by the browser extension.
 */
export const reviews = sqliteTable(
  "reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    source: text("source").$type<OtaChannel>().notNull(),
    /** The platform's id for the review, or a key built from author, date and opening words. */
    externalKey: text("external_key").notNull(),
    /** The name the platform shows publicly, usually a first name. */
    author: text("author").notNull(),
    rating: real("rating"),
    /** Airbnb scores out of 5, Booking.com out of 10. */
    scale: integer("scale").notNull().default(5),
    /** "YYYY-MM-DD", or "YYYY-MM" when the platform only shows the month. */
    reviewedOn: text("reviewed_on"),
    /** Length of stay, month and kind of trip, as the platform words them. */
    stay: text("stay").notNull().default(""),
    title: text("title").notNull().default(""),
    /** The review; on Booking.com, what the guest liked. */
    body: text("body").notNull().default(""),
    /** Booking.com only: what the guest did not like. */
    negative: text("negative").notNull().default(""),
    reply: text("reply").notNull().default(""),
    seenAt: integer("seen_at").notNull(),
  },
  (t) => [uniqueIndex("reviews_key").on(t.propertyId, t.source, t.externalKey)],
);
export type Review = typeof reviews.$inferSelect;

/**
 * A page of a platform's admin (Airbnb's listing editor, the Booking.com
 * extranet) kept as it was shown: its lines of text and its photos. Only
 * pages that describe the property are kept; see `extension/parse.js`.
 */
export const channelPages = sqliteTable(
  "channel_pages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    /** "editor/amenities", "extranet/photos"… */
    page: text("page").notNull(),
    title: text("title").notNull().default(""),
    /** JSON array of text lines, in page order. */
    lines: text("lines").notNull().default("[]"),
    /** JSON array of photo addresses on the platform's image servers. */
    images: text("images").notNull().default("[]"),
    seenAt: integer("seen_at").notNull(),
  },
  (t) => [uniqueIndex("channel_pages_page").on(t.listingId, t.page)],
);
export type ChannelPage = typeof channelPages.$inferSelect;

/** Someone who cleans for the host. A contact, not an account: they never sign in. */
export const cleaners = sqliteTable("cleaners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export type Cleaner = typeof cleaners.$inferSelect;

/** Who cleans a property: priority 0 is the usual cleaner, 1 the backup. */
export const cleanerAssignments = sqliteTable(
  "cleaner_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    cleanerId: integer("cleaner_id")
      .notNull()
      .references(() => cleaners.id, { onDelete: "cascade" }),
    priority: integer("priority").notNull().default(0),
  },
  (t) => [uniqueIndex("cleaner_assignments_rank").on(t.propertyId, t.priority)],
);
export type CleanerAssignment = typeof cleanerAssignments.$inferSelect;

export const CLEANING_STATUSES = ["pending", "done", "skipped"] as const;
export type CleaningStatus = (typeof CLEANING_STATUSES)[number];
/** Where the host stands with the cleaner for one cleaning: not asked, asked and waiting, or agreed. */
export const CLEANING_REQUESTS = ["none", "asked", "confirmed"] as const;
export type CleaningRequest = (typeof CLEANING_REQUESTS)[number];

/**
 * What the host recorded about one cleaning day of a property. Cleanings
 * after a check-out are worked out from the reservations and need no row; a
 * row exists once the host marks, annotates or reassigns one, adds a
 * cleaning by hand (`manual`), or is told about one on Telegram.
 */
export const cleanings = sqliteTable(
  "cleanings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    status: text("status").$type<CleaningStatus>().notNull().default("pending"),
    /** Set when someone other than the property's usual cleaner takes this one. */
    cleanerId: integer("cleaner_id").references(() => cleaners.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    manual: integer("manual", { mode: "boolean" }).notNull().default(false),
    doneAt: integer("done_at"),
    /** When the host was told on Telegram that this cleaning is needed; null if they were not. */
    notifiedAt: integer("notified_at"),
    request: text("request").$type<CleaningRequest>().notNull().default("none"),
  },
  (t) => [uniqueIndex("cleanings_day").on(t.propertyId, t.date)],
);
export type CleaningRecord = typeof cleanings.$inferSelect;
