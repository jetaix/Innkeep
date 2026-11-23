import type { AlternativeSlug } from "@/features/marketing/alternatives";

/**
 * The Alternatives pages: how Innkeep compares with other channel managers.
 * Every figure was read on the vendor's own site; see the date and sources
 * in `features/marketing/alternatives.ts`. Keep both languages saying the
 * same thing, and never round a claim up.
 */
type Facts = {
  /** Who the product is for. */
  segment: string;
  /** Starting price for 1 and 2 listings, excluding VAT. */
  price: string;
  free: string;
  /** How it reaches Airbnb and Booking.com. */
  connection: string;
  inbox: string;
  automation: string;
  site: string;
  license: string;
  /** The main drawback for a host with one or two listings. */
  drawback: string;
};

type Product = Facts & {
  /** What the vendor's pages said, and how each figure was read. */
  note: string;
  /** Completes "Choose <product> if…". */
  chooseThem: string;
  /** Completes "Choose Innkeep if…". */
  chooseInnkeep: string;
};

const en = {
  title: "Alternatives",
  heading: "Innkeep and the alternatives",
  description:
    "How Innkeep compares with Hospitable, Guesty, Lodgify, Smoobu and other channel managers, for hosts with one or two listings.",
  intro:
    "Every commercial product here connects to Airbnb and Booking.com through the platforms' partner APIs, which gives near-instant availability, rates and in-app messaging. None is open source or self-hostable. Innkeep is the other kind of tool: free, open source, on your own machine, and limited to what a host can get without a partner agreement.",
  checked: (date: string) =>
    `Checked on ${date}. Prices change, and several vendors were running Black Friday promotions that day; list prices are shown where the page made them visible. "Not public" means the vendor does not publish it; "unverified" means it could not be confirmed on the vendor's own site.`,
  priceNote: "Prices are for 1 / 2 listings, excluding VAT.",
  nav: { alternatives: "Alternatives", all: "All alternatives" },
  columns: {
    product: "Product",
    segment: "Made for",
    price: "Starting price, 1 / 2 listings",
    free: "Free tier or trial",
    connection: "Airbnb and Booking.com",
    inbox: "Unified inbox",
    automation: "Automation and AI",
    site: "Direct booking site",
    license: "Open source / self-hosted",
    drawback: "Main drawback at 1–2 listings",
  },
  kinds: {
    commercial: {
      title: "Hosted products",
      intro: "Paid services (one has a free tier) with official connections to the platforms.",
    },
    openSource: {
      title: "Open source and self-hosted",
      intro:
        "No project found offers partner-API connections to Airbnb or Booking.com: that access is granted to approved connectivity partners, which a self-hosted tool does not have.",
    },
  },
  compare: (name: string) => `Innkeep vs ${name}`,
  vs: {
    title: (name: string) => `Innkeep vs ${name}`,
    description: (name: string) =>
      `An honest comparison of Innkeep and ${name} for a host with one or two listings: price, connection to Airbnb and Booking.com, and what each one cannot do.`,
    lead: "What each one is, what it costs, and which to choose.",
    innkeep: "Innkeep",
    chooseThem: (name: string) => `Choose ${name} if`,
    chooseInnkeep: "Choose Innkeep if",
    notes: (name: string) => `What ${name}'s pages said`,
    visit: (name: string) => `Visit ${name}`,
    tryInnkeep: "Get Innkeep on GitHub",
    others: "Other comparisons",
  },
  sources: {
    title: "Sources",
    intro: (date: string) => `Read on ${date}.`,
    more: [
      "https://www.hoteldruid.com/",
      "https://github.com/pixelcrash/Sync-Rentals-Calendar",
      "GitHub repository search for channel manager, iCal sync and self-hosted short-term-rental terms",
    ],
  },
  fit: {
    title: "Where Innkeep fits",
    stronger: {
      title: "Stronger",
      items: [
        "Free and MIT-licensed, with no per-listing fee, booking commission or paid add-ons.",
        "Self-hosted: reservations, guest names, reviews and revenue stay on your own machine.",
        "Scoped to 1–2 listings: one calendar, double-booking detection, revenue after fees and subscriptions, and each night's price on both platforms side by side.",
        "An MCP server, which among the products here only Hospitable (Host plan) and Uplisting list.",
      ],
    },
    weaker: {
      title: "Weaker",
      items: [
        "Calendar sync is iCal, so it is not instant. Airbnb and Booking.com refresh imported calendars on their own schedule, and a double booking can occur in that window; Innkeep detects it but cannot prevent it.",
        "No partner API, so no in-app messaging and no pushing of listing content, rates or restrictions. Replies and changes are made on each platform.",
        "Guest names, payouts, prices and reviews come from a browser extension that reads your own pages when you ask. It only works while your computer is on, and the platforms' terms restrict automated data collection.",
        "No login or multi-user support yet, so it should not be exposed to the public internet as is.",
        "No public direct-booking website, payment processing or dynamic pricing of its own.",
        "Hospitable Essentials is also free and uses the partner APIs. Innkeep's case against it rests on data ownership, self-hosting and no vendor dependency, not on features or price.",
      ],
    },
  },
  otherOpenSource: {
    title: "Other open-source projects looked at",
    items: [
      "HotelDruid (AGPL, version 3.0.8 of December 2025) covers B&Bs, apartments and hotels; the booking engine and channel manager are proprietary add-ons on the vendor's hosting.",
      "miniCal (OSL-3.0 per search results) is a hotel PMS with channel extensions; unverified, the repository page returned 404 during this check.",
      "pixelcrash/Sync-Rentals-Calendar (41 stars) is an iCal merger last updated in 2020. Several other small repositories (stayops, primo, openstay-pms) exist with 0 stars and were not evaluated.",
    ],
  },
  innkeep: {
    segment: "Hosts, 1–2 listings",
    price: "Free",
    free: "Free",
    connection: "iCal both ways for dates; other details read from your own pages by a browser extension",
    inbox: "No",
    automation: "Rules, price comparison, optional advice from Claude, MCP server",
    site: "Direct bookings and blocks, no public site",
    license: "MIT / Yes",
    drawback: "iCal latency; no login yet; depends on an extension you run yourself",
  } satisfies Facts,
  products: {
    hospitable: {
      segment: "Solo hosts to managers",
      price: "Essentials €0; Host €25.52/mo billed annually (≈€29 monthly), 2nd property +€10",
      free: "Free tier; 14-day trial",
      connection:
        "API (Booking.com Premier; Airbnb Preferred+ per vendor help centre, seen in search results only)",
      inbox: "Yes",
      automation: "Scheduled messages free; automation, dynamic pricing, AI replies, MCP on Host",
      site: "Professional and up (€51.92/mo annual, 2 properties included)",
      license: "No / No",
      drawback:
        "Free tier is limited (support by AI chat and community only, 10 AI replies/week); direct site needs the top-priced tier for small hosts",
      note: 'The pricing page lists a free Essentials plan with Airbnb, Vrbo, Booking.com and Agoda sync, unified inbox, calendar and scheduled messages, for unlimited properties. Host covers 1 property (max 2), Professional includes 2, Mogul 3 (€87.12/mo annual). The page showed annual prices with "Save 12%"; the monthly figure of about €29 is derived from that, not displayed. Custom upsells carry a 10% processing fee on Essentials.',
      chooseThem:
        "you want instant sync and messaging inside one app, and a hosted service holding your data is fine with you. Its free tier already does more than Innkeep can.",
      chooseInnkeep:
        "you want your reservations and revenue to stay on your own machine, with no account at a vendor and no plan to outgrow.",
    },
    hostaway: {
      segment: "Managers, 2+ listings",
      price: "Not public (quiz, then sales)",
      free: "Not stated",
      connection: 'API ("direct, two-way APIs")',
      inbox: "Yes",
      automation: "AI replies, automation",
      site: "Yes",
      license: "No / No",
      drawback: "Single-listing hosts are sent to a waitlist; no public price",
      note: 'The pricing page is a quiz starting at "2–14 listings"; "Only have 1 listing?" leads to a waitlist page saying the product is not available for that portfolio size. No price is published. A "Black Friday, up to 50% off" banner was shown without a base price.',
      chooseThem: "you manage several listings, expect to grow, and are ready to talk to sales for a price.",
      chooseInnkeep: "you have one or two places: Hostaway does not take single-listing hosts at all.",
    },
    "guesty-lite": {
      segment: "Hosts, 1–3 listings",
      price:
        "From $9/listing/mo + 1% per reservation; $20 (annual) or $29 (monthly) per listing without the fee",
      free: "14-day trial",
      connection: 'Stated as "syncs in real time"; API/partner status unverified',
      inbox: "Yes",
      automation: "ReplyAI drafts, automated messages and tasks",
      site: "Yes (templates)",
      license: "No / No",
      drawback: "Reservation fee on the cheapest plan; Pro (4+) pricing is quote-only",
      note: "Lite is for 1–3 listings and covers Airbnb, Booking.com and Vrbo only. The $9 + 1% plan is described as a limited-time offer on the Lite page. Pro (4+ listings, 60+ channels) and Enterprise (200+) are quote-only.",
      chooseThem:
        "you want real-time sync, a booking website and AI-drafted replies for a small monthly fee.",
      chooseInnkeep:
        "you would rather pay nothing, give up no share of each reservation, and keep your data at home.",
    },
    lodgify: {
      segment: "Hosts wanting a website",
      price: "Basic €16 monthly / €13 yearly (1 property only); Starter €28 / €41 monthly",
      free: "7-day trial",
      connection: "API",
      inbox: "Yes",
      automation: "AI writing assistant; custom automation from Professional",
      site: "From Starter",
      license: "No / No",
      drawback: "Basic has no website and no custom automation, and stops at 1 property",
      note: "Prices were read from the interactive calculator in EUR for 1 and 2 properties; a first page load showed slightly different monthly figures (Basic €14, Starter €26), so treat them as approximate. Professional was €48 (1) / €77 (2) with a 60% yearly Black Friday discount. All plans show 0% booking fee.",
      chooseThem: "a website that takes direct bookings and payments is what you are after.",
      chooseInnkeep: "you only sell through Airbnb and Booking.com and want a clear view of both, for free.",
    },
    smoobu: {
      segment: "Hosts and small managers, EU",
      price: "Prepaid €35 / €47 monthly; Flex €29 / €41 + 0.9% per booking",
      free: "14-day trial",
      connection: "API (Airbnb Preferred Partner)",
      inbox: "Yes (central inbox)",
      automation: "Scheduled messages; AI unverified",
      site: "Yes, included",
      license: "No / No",
      drawback: "List price is high for 1 unit unless paid 1–2 years upfront",
      note: "Billed in EUR. Black Friday prices were €11.90 (1 unit) / €15.98 (2 units) per month on yearly billing, against the list prices above; the FAQ on the same page states the normal discounts as 10% yearly and 20% two-year. All core features, including the website builder and API access, are in every plan.",
      chooseThem: "you want every feature in one plan, billed in euros, with a website included.",
      chooseInnkeep:
        "€35 a month is a lot for one flat, and dates, prices and revenue in one place are enough for you.",
    },
    ownerrez: {
      segment: "Owners and managers, US-centric",
      price: "$40 / $55 monthly base; $109 / $153 with all premium features",
      free: "14-day trial",
      connection: "API (included in base)",
      inbox: 'Messaging; "unified inbox" unverified',
      automation: "Triggers; Rezzy AI is a premium add-on",
      site: "Premium add-on",
      license: "No / No",
      drawback: "Feature depth and add-on pricing are more than a 1–2 listing host needs",
      note: 'Prices come from the calculator data embedded in the pricing page. The base price includes channel API connections to Vrbo, Airbnb, Booking.com and Google. Hosted website, Rezzy AI and other premium features are toggles that raise the price. Currency shown as "$", country not stated.',
      chooseThem:
        "you want deep accounting, owner statements and fine-grained control, and are happy to configure it.",
      chooseInnkeep:
        "that depth is more than one or two places need, and you want something you understand in ten minutes.",
    },
    hostfully: {
      segment: "Managers, 1–199 listings",
      price: "From $15/property/mo + platform fee (amount not public)",
      free: "Demo only; trial not stated",
      connection: "API (Airbnb, Vrbo, Booking.com partner tiers)",
      inbox: "Yes, with InboxAI",
      automation: "Templates and triggers, AI descriptions",
      site: "Yes",
      license: "No / No",
      drawback: "Real cost unknown without a sales call; 1% gateway and 0.85% direct-booking fees on Growth",
      note: 'Growth is $15 and Pro $25 per property per month, both "+ platform fee" with no figure given. Growth adds a 1% payment gateway fee and a 0.85% direct booking fee. Open API and guidebooks are add-ons. Yearly billing is discounted; the amount is not stated.',
      chooseThem: "you run a growing portfolio and want guidebooks, upsells and a sales team to set you up.",
      chooseInnkeep: "you want to know the full cost before you start, and for it to be zero.",
    },
    uplisting: {
      segment: "Solo hosts to managers",
      price: "£40/mo flat for 1–2 (€47, $51), or £0 + 3% per booking",
      free: "14-day trial",
      connection: "API (Airbnb Preferred+, Booking.com Premier)",
      inbox: "Yes",
      automation: "Automated messaging, 100 AI actions/mo, MCP server",
      site: "Basic included; Plus +£30/mo",
      license: "No / No",
      drawback: "Flat price is high for one listing; pay-as-you-go takes 3% of bookings",
      note: "The Independent Host plan (up to 4 properties) is £40 for 1–2 and £72 for 3–4, read from the page's price table. Smart locks (£4), security deposits (£4) and dynamic pricing (£8) are per-listing monthly add-ons. REST API and MCP server access are in every plan.",
      chooseThem:
        "you want top-tier platform connections, automated messaging and an MCP server on a hosted service.",
      chooseInnkeep: "you want an MCP server over your own data without £40 a month or 3% of every booking.",
    },
    beds24: {
      segment: "Technical hosts, B&Bs, hotels",
      price: "≈€18.55 / €23.50 monthly (base €14.90 + €3/room + €0.65/channel link)",
      free: "Trial; payment needed to go live",
      connection: 'API ("two-way XML", "certified and official")',
      inbox: "Yes (central inbox)",
      automation: "Templates, auto-messages; AI unverified",
      site: "Booking page included",
      license: "No / No",
      drawback: "Usage-based pricing and a configuration-heavy interface",
      note: "Pay-as-you-go in EUR with no contract; totals above are computed from the listed unit rates because the calculator did not load. A handling fee applies to top-ups under €50, and a private-label booking subdomain is €19/mo. AI features are not mentioned on the pages read.",
      chooseThem:
        "you are comfortable with settings screens and want official connections at the lowest paid price.",
      chooseInnkeep:
        "you want a calm interface that needs no configuration beyond pasting two calendar links.",
    },
    hosthub: {
      segment: "Small hosts",
      price: "Standard $39 / $56 monthly; $31.20 / $44.80 billed annually",
      free: "14-day trial",
      connection: "API (vendor guide); partner tier unverified",
      inbox: "Yes",
      automation: "Automated messaging; AI co-host on Pro (+0.7% of bookings)",
      site: "Separate purchase ($799 site, $599 engine)",
      license: "No / No",
      drawback: "First rental is priced high; website is a one-off extra",
      note: "Prices are in USD and come from the pricing arrays in the page ($39 first rental, $17 for each of the next ones, 20% off annually). Pro has the same base price plus 0.7% of net booking value. The Zero Double Booking Guarantee ($150 Standard, $500 Pro) applies to API-connected channels only.",
      chooseThem: "a paid guarantee against double bookings on connected channels matters most to you.",
      chooseInnkeep: "you accept that iCal sync can lag, and prefer free and self-hosted over a guarantee.",
    },
    renttools: {
      segment: "Hosts, 1–3 listings",
      price: "Free",
      free: "Free",
      connection: "iCal only (10-minute polling)",
      inbox: "No (templates copied and pasted)",
      automation: "Cleaning schedules; AI passport OCR",
      site: "No",
      license: "MIT / Yes",
      drawback: "Young project (created April 2026, 31 stars); no messaging or booking engine",
      note: "RentTools.io (MIT, Next.js and SQLite, Docker) is the nearest equivalent to Innkeep: iCal aggregation, cleaning schedules, reports, message templates pasted by hand. Its README recommends it for 1–3 listings and a paid channel manager above about 20.",
      chooseThem:
        "cleaning schedules and guest paperwork are your daily problem, and you deploy with Docker.",
      chooseInnkeep:
        "revenue after costs, prices on both platforms and suggestions matter more to you than cleaning rotas.",
    },
    qloapps: {
      segment: "Hotels",
      price: "Core free; channel manager $30/property/mo",
      free: "—",
      connection: "Paid hosted add-on",
      inbox: "No",
      automation: "—",
      site: "Hotel website",
      license: "OSL-3.0 / Yes",
      drawback: "Built for hotels with room types; OTA sync is not in the free core",
      note: "QloApps (OSL-3.0, about 14,500 stars, active) is a hotel PMS, booking engine and website. Its channel manager is a hosted subscription.",
      chooseThem: "you run a small hotel or B&B with room types and want your own booking website.",
      chooseInnkeep: "you rent whole flats on Airbnb and Booking.com, not hotel rooms.",
    },
  } satisfies Record<AlternativeSlug, Product>,
};

const fr: typeof en = {
  title: "Alternatives",
  heading: "Innkeep et les alternatives",
  description:
    "Innkeep comparé à Hospitable, Guesty, Lodgify, Smoobu et d’autres channel managers, pour les hôtes qui ont un ou deux logements.",
  intro:
    "Tous les produits commerciaux présentés ici se connectent à Airbnb et à Booking.com par les API partenaires des plateformes : disponibilités, tarifs et messagerie y sont quasi instantanés. Aucun n’est open source ni auto-hébergeable. Innkeep est l’autre type d’outil : gratuit, open source, sur votre propre machine, et limité à ce qu’un hôte peut obtenir sans accord de partenariat.",
  checked: (date) =>
    `Vérifié le ${date}. Les prix changent, et plusieurs éditeurs affichaient des promotions Black Friday ce jour-là ; les prix catalogue sont indiqués quand la page les montrait. « Non public » signifie que l’éditeur ne le publie pas ; « non vérifié », que l’information n’a pas pu être confirmée sur le site de l’éditeur.`,
  priceNote: "Prix pour 1 / 2 logements, hors TVA.",
  nav: { alternatives: "Alternatives", all: "Toutes les alternatives" },
  columns: {
    product: "Produit",
    segment: "Conçu pour",
    price: "Prix de départ, 1 / 2 logements",
    free: "Offre gratuite ou essai",
    connection: "Airbnb et Booking.com",
    inbox: "Messagerie unifiée",
    automation: "Automatisation et IA",
    site: "Site de réservation directe",
    license: "Open source / auto-hébergé",
    drawback: "Principal inconvénient pour 1 ou 2 logements",
  },
  kinds: {
    commercial: {
      title: "Produits hébergés",
      intro:
        "Des services payants (l’un a une offre gratuite) avec des connexions officielles aux plateformes.",
    },
    openSource: {
      title: "Open source et auto-hébergé",
      intro:
        "Aucun projet trouvé n’offre de connexion par API partenaire à Airbnb ou à Booking.com : cet accès est réservé aux partenaires de connectivité agréés, ce qu’un outil auto-hébergé n’est pas.",
    },
  },
  compare: (name) => `Innkeep face à ${name}`,
  vs: {
    title: (name) => `Innkeep face à ${name}`,
    description: (name) =>
      `Une comparaison honnête d’Innkeep et de ${name} pour un hôte qui a un ou deux logements : prix, connexion à Airbnb et à Booking.com, et ce que chacun ne sait pas faire.`,
    lead: "Ce qu’est chacun, ce qu’il coûte, et lequel choisir.",
    innkeep: "Innkeep",
    chooseThem: (name) => `Choisissez ${name} si`,
    chooseInnkeep: "Choisissez Innkeep si",
    notes: (name) => `Ce que disaient les pages de ${name}`,
    visit: (name) => `Voir ${name}`,
    tryInnkeep: "Obtenir Innkeep sur GitHub",
    others: "Autres comparaisons",
  },
  sources: {
    title: "Sources",
    intro: (date) => `Consultées le ${date}.`,
    more: [
      "https://www.hoteldruid.com/",
      "https://github.com/pixelcrash/Sync-Rentals-Calendar",
      "Recherche de dépôts GitHub sur les termes channel manager, synchronisation iCal et location courte durée auto-hébergée",
    ],
  },
  fit: {
    title: "La place d’Innkeep",
    stronger: {
      title: "Ses atouts",
      items: [
        "Gratuit et sous licence MIT, sans frais par logement, sans commission sur les réservations, sans option payante.",
        "Auto-hébergé : réservations, noms des voyageurs, avis et revenus restent sur votre propre machine.",
        "Pensé pour 1 ou 2 logements : un seul calendrier, détection des doubles réservations, revenus après frais et abonnements, et le prix de chaque nuit sur les deux plateformes côte à côte.",
        "Un serveur MCP, que seuls Hospitable (offre Host) et Uplisting mentionnent parmi les produits présentés ici.",
      ],
    },
    weaker: {
      title: "Ses limites",
      items: [
        "La synchronisation des calendriers passe par iCal : elle n’est pas instantanée. Airbnb et Booking.com relisent les calendriers importés à leur rythme, et une double réservation peut survenir dans cet intervalle ; Innkeep la détecte mais ne peut pas l’empêcher.",
        "Pas d’API partenaire, donc pas de messagerie intégrée ni d’envoi du contenu des annonces, des tarifs ou des restrictions. Les réponses et les modifications se font sur chaque plateforme.",
        "Les noms des voyageurs, les versements, les prix et les avis viennent d’une extension de navigateur qui lit vos propres pages à votre demande. Elle ne fonctionne que lorsque votre ordinateur est allumé, et les conditions des plateformes restreignent la collecte automatisée de données.",
        "Pas encore d’identification ni de gestion multi-utilisateur : il ne doit pas être exposé tel quel sur Internet.",
        "Pas de site public de réservation directe, pas de paiement, pas de tarification dynamique propre.",
        "Hospitable Essentials est lui aussi gratuit et utilise les API partenaires. L’intérêt d’Innkeep face à lui tient à la maîtrise des données, à l’auto-hébergement et à l’absence de dépendance à un éditeur, pas aux fonctionnalités ni au prix.",
      ],
    },
  },
  otherOpenSource: {
    title: "Autres projets open source examinés",
    items: [
      "HotelDruid (AGPL, version 3.0.8 de décembre 2025) couvre chambres d’hôtes, appartements et hôtels ; le moteur de réservation et le channel manager sont des modules propriétaires hébergés par l’éditeur.",
      "miniCal (OSL-3.0 d’après les résultats de recherche) est un PMS hôtelier avec des extensions de canaux ; non vérifié, la page du dépôt renvoyait une erreur 404 lors de cette vérification.",
      "pixelcrash/Sync-Rentals-Calendar (41 étoiles) fusionne des calendriers iCal ; dernière mise à jour en 2020. Plusieurs autres petits dépôts (stayops, primo, openstay-pms) existent avec 0 étoile et n’ont pas été évalués.",
    ],
  },
  innkeep: {
    segment: "Hôtes, 1 ou 2 logements",
    price: "Gratuit",
    free: "Gratuit",
    connection:
      "iCal dans les deux sens pour les dates ; les autres informations sont lues sur vos propres pages par une extension de navigateur",
    inbox: "Non",
    automation: "Règles, comparaison des prix, conseils de Claude en option, serveur MCP",
    site: "Réservations directes et blocages, pas de site public",
    license: "MIT / Oui",
    drawback:
      "Latence d’iCal ; pas encore d’identification ; dépend d’une extension que vous lancez vous-même",
  },
  products: {
    hospitable: {
      segment: "De l’hôte seul au gestionnaire",
      price:
        "Essentials 0 € ; Host 25,52 €/mois en facturation annuelle (≈ 29 € au mois), 2e logement + 10 €",
      free: "Offre gratuite ; essai de 14 jours",
      connection:
        "API (Booking.com Premier ; Airbnb Preferred+ d’après le centre d’aide de l’éditeur, vu uniquement dans des résultats de recherche)",
      inbox: "Oui",
      automation:
        "Messages programmés gratuits ; automatisation, tarification dynamique, réponses par IA et MCP avec l’offre Host",
      site: "À partir de Professional (51,92 €/mois en annuel, 2 logements inclus)",
      license: "Non / Non",
      drawback:
        "Offre gratuite limitée (assistance par chat IA et communauté uniquement, 10 réponses IA par semaine) ; le site direct exige l’offre la plus chère pour un petit hôte",
      note: "La page des tarifs présente une offre Essentials gratuite avec la synchronisation Airbnb, Vrbo, Booking.com et Agoda, la messagerie unifiée, le calendrier et les messages programmés, pour un nombre illimité de logements. Host couvre 1 logement (2 au maximum), Professional en inclut 2, Mogul 3 (87,12 €/mois en annuel). La page affichait les prix annuels avec « Save 12% » ; le montant mensuel d’environ 29 € en est déduit, il n’est pas affiché. Les ventes additionnelles personnalisées supportent 10 % de frais de traitement avec Essentials.",
      chooseThem:
        "vous voulez une synchronisation instantanée et la messagerie dans une seule application, et qu’un service hébergé détienne vos données ne vous gêne pas. Son offre gratuite en fait déjà plus qu’Innkeep.",
      chooseInnkeep:
        "vous voulez que vos réservations et vos revenus restent sur votre machine, sans compte chez un éditeur ni offre à dépasser.",
    },
    hostaway: {
      segment: "Gestionnaires, 2 logements et plus",
      price: "Non public (questionnaire, puis équipe commerciale)",
      free: "Non précisé",
      connection: "API (« direct, two-way APIs »)",
      inbox: "Oui",
      automation: "Réponses par IA, automatisation",
      site: "Oui",
      license: "Non / Non",
      drawback: "Les hôtes à un seul logement sont renvoyés vers une liste d’attente ; aucun prix public",
      note: "La page des tarifs est un questionnaire qui commence à « 2–14 listings » ; « Only have 1 listing? » mène à une page de liste d’attente indiquant que le produit n’est pas disponible pour cette taille de parc. Aucun prix n’est publié. Un bandeau « Black Friday, up to 50% off » était affiché sans prix de base.",
      chooseThem:
        "vous gérez plusieurs logements, comptez grandir, et êtes prêt à passer par un commercial pour connaître le prix.",
      chooseInnkeep:
        "vous avez un ou deux logements : Hostaway n’accepte pas du tout les hôtes à un seul logement.",
    },
    "guesty-lite": {
      segment: "Hôtes, 1 à 3 logements",
      price:
        "À partir de 9 $/logement/mois + 1 % par réservation ; 20 $ (annuel) ou 29 $ (mensuel) par logement sans ces frais",
      free: "Essai de 14 jours",
      connection: "Annoncé comme « syncs in real time » ; statut API/partenaire non vérifié",
      inbox: "Oui",
      automation: "Brouillons ReplyAI, messages et tâches automatisés",
      site: "Oui (modèles)",
      license: "Non / Non",
      drawback: "Frais par réservation sur l’offre la moins chère ; tarif Pro (4 et plus) sur devis",
      note: "Lite s’adresse aux hôtes de 1 à 3 logements et ne couvre qu’Airbnb, Booking.com et Vrbo. L’offre à 9 $ + 1 % est présentée comme limitée dans le temps sur la page Lite. Pro (4 logements et plus, 60 canaux et plus) et Enterprise (200 et plus) sont sur devis.",
      chooseThem:
        "vous voulez une synchronisation en temps réel, un site de réservation et des réponses rédigées par IA pour un petit montant mensuel.",
      chooseInnkeep:
        "vous préférez ne rien payer, ne céder aucune part de chaque réservation, et garder vos données chez vous.",
    },
    lodgify: {
      segment: "Hôtes qui veulent un site web",
      price: "Basic 16 € au mois / 13 € à l’année (1 logement seulement) ; Starter 28 € / 41 € au mois",
      free: "Essai de 7 jours",
      connection: "API",
      inbox: "Oui",
      automation: "Assistant de rédaction IA ; automatisation personnalisée à partir de Professional",
      site: "À partir de Starter",
      license: "Non / Non",
      drawback: "Basic n’a ni site web ni automatisation personnalisée, et s’arrête à 1 logement",
      note: "Les prix ont été lus dans le calculateur interactif, en euros, pour 1 et 2 logements ; un premier chargement de la page affichait des montants mensuels légèrement différents (Basic 14 €, Starter 26 €) : considérez-les comme approximatifs. Professional était à 48 € (1) / 77 € (2), avec une remise Black Friday de 60 % sur l’annuel. Toutes les offres affichent 0 % de frais de réservation.",
      chooseThem: "ce que vous cherchez, c’est un site qui prend des réservations directes et des paiements.",
      chooseInnkeep:
        "vous ne vendez que par Airbnb et Booking.com et voulez une vue claire des deux, gratuitement.",
    },
    smoobu: {
      segment: "Hôtes et petits gestionnaires, Europe",
      price: "Prépayé 35 € / 47 € au mois ; Flex 29 € / 41 € + 0,9 % par réservation",
      free: "Essai de 14 jours",
      connection: "API (Airbnb Preferred Partner)",
      inbox: "Oui (boîte de réception centrale)",
      automation: "Messages programmés ; IA non vérifiée",
      site: "Oui, inclus",
      license: "Non / Non",
      drawback: "Prix catalogue élevé pour 1 logement, sauf à payer 1 ou 2 ans d’avance",
      note: "Facturé en euros. Les prix Black Friday étaient de 11,90 € (1 logement) / 15,98 € (2 logements) par mois en facturation annuelle, contre les prix catalogue ci-dessus ; la FAQ de la même page indique des remises habituelles de 10 % sur un an et de 20 % sur deux ans. Toutes les fonctions de base, dont le créateur de site et l’accès API, sont dans chaque offre.",
      chooseThem: "vous voulez toutes les fonctions dans une seule offre, facturée en euros, site inclus.",
      chooseInnkeep:
        "35 € par mois, c’est beaucoup pour un appartement, et les dates, les prix et les revenus au même endroit vous suffisent.",
    },
    ownerrez: {
      segment: "Propriétaires et gestionnaires, surtout États-Unis",
      price: "Base 40 $ / 55 $ au mois ; 109 $ / 153 $ avec toutes les options premium",
      free: "Essai de 14 jours",
      connection: "API (incluse dans la base)",
      inbox: "Messagerie ; « unified inbox » non vérifié",
      automation: "Déclencheurs ; Rezzy AI est une option premium",
      site: "Option premium",
      license: "Non / Non",
      drawback:
        "Une profondeur fonctionnelle et des options payantes qui dépassent les besoins de 1 ou 2 logements",
      note: "Les prix proviennent des données du calculateur intégrées à la page des tarifs. Le prix de base comprend les connexions API à Vrbo, Airbnb, Booking.com et Google. Le site hébergé, Rezzy AI et les autres fonctions premium sont des options qui augmentent le prix. Devise affichée « $ », pays non précisé.",
      chooseThem:
        "vous voulez une comptabilité poussée, des relevés propriétaires et un contrôle fin, et le paramétrage ne vous rebute pas.",
      chooseInnkeep:
        "cette profondeur dépasse les besoins d’un ou deux logements, et vous voulez un outil compris en dix minutes.",
    },
    hostfully: {
      segment: "Gestionnaires, 1 à 199 logements",
      price: "À partir de 15 $/logement/mois + frais de plateforme (montant non public)",
      free: "Démonstration seulement ; essai non précisé",
      connection: "API (niveaux partenaires Airbnb, Vrbo, Booking.com)",
      inbox: "Oui, avec InboxAI",
      automation: "Modèles et déclencheurs, descriptions par IA",
      site: "Oui",
      license: "Non / Non",
      drawback:
        "Coût réel inconnu sans appel commercial ; 1 % de frais de paiement et 0,85 % sur les réservations directes avec Growth",
      note: "Growth coûte 15 $ et Pro 25 $ par logement et par mois, tous deux « + platform fee » sans montant indiqué. Growth ajoute 1 % de frais de passerelle de paiement et 0,85 % sur les réservations directes. L’API ouverte et les guides sont des options. La facturation annuelle est remisée ; le montant n’est pas indiqué.",
      chooseThem:
        "vous gérez un parc en croissance et voulez des guides, des ventes additionnelles et une équipe commerciale pour vous installer.",
      chooseInnkeep: "vous voulez connaître le coût total avant de commencer, et qu’il soit nul.",
    },
    uplisting: {
      segment: "De l’hôte seul au gestionnaire",
      price: "40 £/mois forfaitaires pour 1 ou 2 logements (47 €, 51 $), ou 0 £ + 3 % par réservation",
      free: "Essai de 14 jours",
      connection: "API (Airbnb Preferred+, Booking.com Premier)",
      inbox: "Oui",
      automation: "Messagerie automatisée, 100 actions IA par mois, serveur MCP",
      site: "Version de base incluse ; Plus + 30 £/mois",
      license: "Non / Non",
      drawback: "Forfait élevé pour un seul logement ; la formule à l’usage prélève 3 % des réservations",
      note: "L’offre Independent Host (jusqu’à 4 logements) coûte 40 £ pour 1 ou 2 et 72 £ pour 3 ou 4, d’après le tableau de prix de la page. Serrures connectées (4 £), cautions (4 £) et tarification dynamique (8 £) sont des options mensuelles par logement. L’API REST et le serveur MCP sont dans toutes les offres.",
      chooseThem:
        "vous voulez les meilleures connexions aux plateformes, une messagerie automatisée et un serveur MCP sur un service hébergé.",
      chooseInnkeep:
        "vous voulez un serveur MCP sur vos propres données sans 40 £ par mois ni 3 % de chaque réservation.",
    },
    beds24: {
      segment: "Hôtes techniques, chambres d’hôtes, hôtels",
      price: "≈ 18,55 € / 23,50 € au mois (base 14,90 € + 3 €/chambre + 0,65 €/lien de canal)",
      free: "Essai ; paiement nécessaire pour la mise en service",
      connection: "API (« two-way XML », « certified and official »)",
      inbox: "Oui (boîte de réception centrale)",
      automation: "Modèles, messages automatiques ; IA non vérifiée",
      site: "Page de réservation incluse",
      license: "Non / Non",
      drawback: "Tarification à l’usage et interface très chargée en réglages",
      note: "Paiement à l’usage en euros, sans engagement ; les totaux ci-dessus sont calculés à partir des tarifs unitaires affichés, le calculateur ne s’étant pas chargé. Des frais de traitement s’appliquent aux recharges de moins de 50 €, et un sous-domaine de réservation en marque blanche coûte 19 €/mois. Les pages consultées ne mentionnent pas de fonctions d’IA.",
      chooseThem:
        "les écrans de réglages ne vous font pas peur et vous voulez des connexions officielles au prix payant le plus bas.",
      chooseInnkeep:
        "vous voulez une interface calme, sans autre configuration que deux liens de calendrier à coller.",
    },
    hosthub: {
      segment: "Petits hôtes",
      price: "Standard 39 $ / 56 $ au mois ; 31,20 $ / 44,80 $ en facturation annuelle",
      free: "Essai de 14 jours",
      connection: "API (guide de l’éditeur) ; niveau de partenariat non vérifié",
      inbox: "Oui",
      automation: "Messagerie automatisée ; co-hôte IA avec Pro (+ 0,7 % des réservations)",
      site: "Achat séparé (site 799 $, moteur 599 $)",
      license: "Non / Non",
      drawback: "Premier logement facturé cher ; le site web est un supplément ponctuel",
      note: "Les prix sont en dollars et proviennent des tableaux de prix de la page (39 $ pour le premier logement, 17 $ pour chacun des suivants, 20 % de remise en annuel). Pro a le même prix de base, plus 0,7 % de la valeur nette des réservations. La garantie Zero Double Booking (150 $ Standard, 500 $ Pro) ne s’applique qu’aux canaux connectés par API.",
      chooseThem:
        "une garantie payante contre les doubles réservations sur les canaux connectés compte plus que tout pour vous.",
      chooseInnkeep:
        "vous acceptez qu’iCal puisse avoir du retard, et préférez le gratuit et l’auto-hébergé à une garantie.",
    },
    renttools: {
      segment: "Hôtes, 1 à 3 logements",
      price: "Gratuit",
      free: "Gratuit",
      connection: "iCal uniquement (relevé toutes les 10 minutes)",
      inbox: "Non (modèles à copier-coller)",
      automation: "Plannings de ménage ; lecture de passeports par IA",
      site: "Non",
      license: "MIT / Oui",
      drawback: "Projet jeune (créé en avril 2026, 31 étoiles) ; ni messagerie ni moteur de réservation",
      note: "RentTools.io (MIT, Next.js et SQLite, Docker) est l’équivalent le plus proche d’Innkeep : agrégation iCal, plannings de ménage, rapports, modèles de messages à coller à la main. Son README le recommande pour 1 à 3 logements, et un channel manager payant au-delà d’une vingtaine.",
      chooseThem:
        "les plannings de ménage et les formalités voyageurs sont votre souci quotidien, et vous déployez avec Docker.",
      chooseInnkeep:
        "les revenus après charges, les prix sur les deux plateformes et les suggestions comptent plus pour vous que les plannings de ménage.",
    },
    qloapps: {
      segment: "Hôtels",
      price: "Cœur gratuit ; channel manager à 30 $/établissement/mois",
      free: "—",
      connection: "Module hébergé payant",
      inbox: "Non",
      automation: "—",
      site: "Site d’hôtel",
      license: "OSL-3.0 / Oui",
      drawback:
        "Conçu pour des hôtels avec types de chambres ; la synchronisation des plateformes n’est pas dans le cœur gratuit",
      note: "QloApps (OSL-3.0, environ 14 500 étoiles, actif) est un PMS hôtelier, un moteur de réservation et un site web. Son channel manager est un abonnement hébergé.",
      chooseThem:
        "vous tenez un petit hôtel ou des chambres d’hôtes avec des types de chambres et voulez votre propre site de réservation.",
      chooseInnkeep:
        "vous louez des appartements entiers sur Airbnb et Booking.com, pas des chambres d’hôtel.",
    },
  },
};

export const alternatives = { en, fr };
