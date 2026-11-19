/** The public landing page: hero, feature cards with their sample figures, limits, install block, footer and the calendar preview. */
const en = {
  /** Translated twins of `site.tagline` and `site.description`, for the landing page's metadata. */
  tagline: "The open-source channel manager for hosts with one or two places",
  description:
    "Innkeep keeps your Airbnb and Booking.com calendars in sync, shows what you will earn after costs and tells you what to fix. Free, open source and self-hosted.",
  nav: {
    label: "Site",
    features: "Features",
    limits: "Limits",
    dashboard: "Open dashboard",
  },
  hero: {
    title: "One calendar for every place you rent.",
    body: "Innkeep keeps Airbnb and Booking.com in step, shows what each month pays after costs, and points out what to fix. It is free, open source, and runs on your own machine.",
    github: "Get Innkeep on GitHub",
    dashboard: "Open the dashboard",
  },
  features: {
    title: "Made for hosts with one or two places, not two hundred.",
    intro:
      "Property-management suites are priced and built for agencies. Innkeep does the few things a small host does every week, and does them carefully.",
    sync: {
      title: "Calendars that agree with each other",
      body: "Paste each listing's calendar link. Innkeep imports both every 15 minutes and hands each platform a link that blocks what the other one sold. If two bookings ever land on the same night, you hear about it first.",
      direct: "Direct bookings",
      /** "Synced 4 min ago" */
      synced: (ago: string) => `Synced ${ago}`,
      shared: "Shared with both",
    },
    money: {
      title: "Know what a month is really worth",
      body: "Enter cleaning, commission, subscriptions and one-off bills once. Every month then shows revenue, costs and what is left, including bookings that have not been paid out yet.",
      revenue: (nights: string) => `Revenue, ${nights}`,
      cleaning: (stays: string) => `Cleaning, ${stays}`,
      commission: "Platform commission",
      bills: "Subscriptions and bills",
      net: "Net for November",
    },
    suggestions: {
      title: "It tells you what to fix",
      body: "Suggestions come from your own data: a calendar that stopped syncing, a guest waiting for an answer, a single unsold night between two stays. Add an Anthropic API key and Claude writes advice for your listings.",
      rows: [
        { tone: "critical", label: "Urgent", text: "Double booking at Harbour Studio" },
        { tone: "warn", label: "Recommended", text: "Hugo has waited 2 h for a reply" },
        { tone: "neutral", label: "Idea", text: "One free night on 24 November" },
      ] as { tone: "critical" | "warn" | "neutral"; label: string; text: string }[],
    },
    keyboard: {
      title: "Fast with a keyboard, open to your assistant",
      body: "Every screen is reachable without a mouse, with a command menu for the rest. A built-in MCP server lets Claude or any other assistant read your calendar and revenue, and block dates when you ask.",
      commandMenu: "command menu",
      calendar: "calendar",
      newBooking: "new booking",
      you: "You:",
      request: "Block the loft from 3 to 5 December for the plumber.",
      assistant: "Assistant:",
      answer: "Blocked. Both platforms close those nights at the next sync.",
    },
    note: "Names and figures on this page are examples.",
  },
  limits: {
    title: "What it does not do.",
    intro:
      "Airbnb and Booking.com reserve their APIs for approved partners. Innkeep works with what every host is given, and says so.",
    items: [
      {
        term: "Sync takes minutes, not seconds",
        body: "Calendar links are re-read on each platform's own schedule. A double booking in that window is rare but possible; Innkeep flags it, it cannot prevent it.",
      },
      {
        term: "You send replies yourself",
        body: "Guest messages arrive through a webhook and are drafted in one inbox. You paste the reply into the platform.",
      },
      {
        term: "Listing changes are copied across",
        body: "You edit details once and Innkeep tracks which platform is out of date. It cannot push the change for you.",
      },
      {
        term: "No login yet",
        body: "Run it on your own computer or behind a proxy that asks for a password.",
      },
    ],
  },
  open: {
    title: "Yours to run, read and change.",
    body: (license: string) =>
      `${license} licensed. Your bookings live in a single SQLite file on your machine, with no account and no subscription.`,
    source: "Read the source",
    install: "Install commands",
  },
  footer: {
    label: "Footer",
    disclaimer: "Not affiliated with Airbnb, Booking.com or Hospitable.",
    alternatives: "Alternatives",
    license: "License",
  },
  preview: {
    clash: "Double booking at Harbour Studio",
    plumber: "Plumber",
    blocked: "Blocked",
    example: "Example data",
  },
};

const fr: typeof en = {
  tagline: "Le channel manager open source pour les hôtes qui ont un ou deux logements",
  description:
    "Innkeep synchronise vos calendriers Airbnb et Booking.com, montre ce que vous gagnerez une fois les charges déduites et vous dit quoi corriger. Gratuit, open source et auto-hébergé.",
  nav: {
    label: "Site",
    features: "Fonctionnalités",
    limits: "Limites",
    dashboard: "Tableau de bord",
  },
  hero: {
    title: "Un seul calendrier pour tous vos logements.",
    body: "Innkeep garde Airbnb et Booking.com synchronisés, montre ce que chaque mois rapporte une fois les charges déduites et vous signale ce qu’il faut corriger. Gratuit et open source, il tourne sur votre propre machine.",
    github: "Obtenir Innkeep sur GitHub",
    dashboard: "Ouvrir le tableau de bord",
  },
  features: {
    title: "Pensé pour les hôtes qui ont un ou deux logements, pas deux cents.",
    intro:
      "Les logiciels de gestion locative sont conçus et tarifés pour les agences. Innkeep se charge des quelques tâches qu’un petit hôte répète chaque semaine, et le fait avec soin.",
    sync: {
      title: "Des calendriers qui s’accordent entre eux",
      body: "Collez le lien de calendrier de chaque annonce. Innkeep importe les deux toutes les 15 minutes et fournit à chaque plateforme un lien qui bloque les nuits vendues par l’autre. Si deux réservations tombent un jour sur la même nuit, vous êtes le premier à le savoir.",
      direct: "Réservations directes",
      synced: (ago) => `Synchronisé ${ago}`,
      shared: "Partagées avec les deux",
    },
    money: {
      title: "Sachez ce qu’un mois rapporte vraiment",
      body: "Saisissez une seule fois le ménage, la commission, les abonnements et les factures ponctuelles. Chaque mois affiche ensuite les revenus, les charges et ce qu’il reste, y compris les réservations qui ne vous ont pas encore été versées.",
      revenue: (nights) => `Revenus, ${nights}`,
      cleaning: (stays) => `Ménage, ${stays}`,
      commission: "Commission des plateformes",
      bills: "Abonnements et factures",
      net: "Net de novembre",
    },
    suggestions: {
      title: "Il vous dit quoi corriger",
      body: "Les suggestions viennent de vos propres données : un calendrier qui ne se synchronise plus, un voyageur qui attend une réponse, une nuit isolée invendue entre deux séjours. Ajoutez une clé d’API Anthropic et Claude rédige des conseils pour vos annonces.",
      rows: [
        { tone: "critical", label: "Urgent", text: "Double réservation à Harbour Studio" },
        { tone: "warn", label: "Recommandé", text: "Hugo attend une réponse depuis 2 h" },
        { tone: "neutral", label: "Idée", text: "Une nuit libre le 24 novembre" },
      ],
    },
    keyboard: {
      title: "Rapide au clavier, ouvert à votre assistant",
      body: "Chaque écran est accessible sans souris, et un menu de commandes s’occupe du reste. Un serveur MCP intégré permet à Claude, ou à tout autre assistant, de lire votre calendrier et vos revenus, et de bloquer des dates quand vous le demandez.",
      commandMenu: "menu de commandes",
      calendar: "calendrier",
      newBooking: "nouvelle réservation",
      you: "Vous :",
      request: "Bloque le loft du 3 au 5 décembre pour le plombier.",
      assistant: "Assistant :",
      answer: "C’est bloqué. Les deux plateformes ferment ces nuits à la prochaine synchronisation.",
    },
    note: "Les noms et les chiffres de cette page sont des exemples.",
  },
  limits: {
    title: "Ce qu’il ne fait pas.",
    intro:
      "Airbnb et Booking.com réservent leurs API aux partenaires agréés. Innkeep travaille avec ce dont dispose tout hôte, et ne s’en cache pas.",
    items: [
      {
        term: "La synchronisation prend des minutes, pas des secondes",
        body: "Chaque plateforme relit les liens de calendrier à son propre rythme. Dans cet intervalle, une double réservation est rare mais possible ; Innkeep la signale, il ne peut pas l’empêcher.",
      },
      {
        term: "Vous envoyez les réponses vous-même",
        body: "Les messages des voyageurs arrivent par un webhook et les réponses se rédigent dans une boîte unique. Vous collez la réponse sur la plateforme.",
      },
      {
        term: "Les modifications d’annonce sont à recopier",
        body: "Vous modifiez les informations une seule fois et Innkeep suit quelle plateforme n’est plus à jour. Il ne peut pas publier la modification à votre place.",
      },
      {
        term: "Pas encore d’identification",
        body: "Faites-le tourner sur votre propre ordinateur ou derrière un proxy qui demande un mot de passe.",
      },
    ],
  },
  open: {
    title: "Il est à vous : lancez-le, lisez-le, modifiez-le.",
    body: (license) =>
      `Sous licence ${license}. Vos réservations sont stockées dans un seul fichier SQLite sur votre machine, sans compte ni abonnement.`,
    source: "Lire le code source",
    install: "Commandes d’installation",
  },
  footer: {
    label: "Pied de page",
    disclaimer: "Sans lien avec Airbnb, Booking.com ou Hospitable.",
    alternatives: "Alternatives",
    license: "Licence",
  },
  preview: {
    clash: "Double réservation à Harbour Studio",
    plumber: "Plombier",
    blocked: "Bloqué",
    example: "Données d’exemple",
  },
};

export const marketing = { en, fr };
