/** The Data page: every outside source of data, how old it is and how to refresh it. */
const en = {
  title: "Data",
  description:
    "Everything Innkeep holds from Airbnb, Booking.com and Claude, how old it is, and the button that refreshes it.",
  summary: {
    allFresh: "Everything is up to date.",
    toRefresh: (n: number) => `${n} source${n === 1 ? "" : "s"} to refresh.`,
    how: "Each button opens your own page on the platform; the extension reads it and Innkeep updates when you come back.",
    popup: {
      title: "Or let the extension do the rounds",
      body: "Use the two buttons below, or the same two in the Innkeep Companion icon of your browser's toolbar:",
      reservations: {
        name: "Update reservations",
        text: "opens your two reservations pages, reads them and comes back. Under a minute.",
      },
      everything: {
        name: "Read everything",
        text: "also goes through your calendars, the listing editor, the extranet, your public listings and reviews, one page at a time in a single tab, with a Stop button. A few minutes.",
      },
      signIn: "Sign in to Airbnb and Booking.com first: a page that asks you to sign in is skipped.",
    },
  },
  account: "Whole account",
  columns: { source: "Data", from: "From", read: "Last read", state: "State", action: "Refresh" },
  kinds: {
    calendar: { name: "Calendar", feeds: "Booked and blocked dates" },
    reservations: { name: "Reservations", feeds: "Guest names, payouts, past and cancelled stays" },
    prices: { name: "Nightly prices", feeds: "Price of each free night" },
    guestPrices: { name: "Guest prices", feeds: "What a guest pays for sample stays" },
    preview: { name: "Listing preview", feeds: "Title, photos, rating and description as guests see them" },
    reviews: { name: "Reviews", feeds: "What guests wrote, their rating and your replies" },
    adminPages: {
      name: "Admin pages",
      feeds: "Every amenity, photo and policy, as the platform's admin shows them",
    },
    listingDetails: { name: "Listing settings", feeds: "Address, times, rules, discounts, minimum stay" },
    advice: { name: "Advice", feeds: "Written by Claude from all of the above" },
  },
  claude: "Claude",
  never: "Never",
  state: { fresh: "Up to date", stale: "To refresh", never: "Not read yet", failed: "Last try failed" },
  automatic: "Refreshes by itself every 15 minutes and when you open Innkeep.",
  progress: (done: number, total: number) => `${done} of ${total} stays checked`,
  actions: {
    open: (platform: string) => `Open ${platform}`,
    sync: "Sync now",
    syncing: "Syncing…",
    pricing: "Go to Pricing",
    assistant: "Go to Assistant",
    popup: "Use “Read everything” in the extension",
    pages: (n: number) => `${n} page${n === 1 ? "" : "s"} kept`,
    hint: "Opens your own page. The extension reads it; this tab updates when you come back.",
  },
  blocked: {
    extension: { text: "Needs the browser extension.", link: "Set it up" },
    listingId: {
      text: "Innkeep does not know this listing's id yet. Reading your reservations tells it.",
      link: "",
    },
    listingUrl: { text: "Needs your public page address.", link: "Add it on the property" },
    calendarLink: { text: "No calendar link yet.", link: "Add it on the property" },
    claude: { text: "Claude is not connected.", link: "Connect it" },
  },
  limits: {
    title: "How long data stays current",
    rows: [
      "Calendar: 30 minutes. Refreshed automatically.",
      "Reservations: 12 hours.",
      "Nightly prices: 1 day.",
      "Guest prices, listing preview and reviews: 7 days.",
      "Listing settings and admin pages: 30 days.",
      "Advice: 7 days.",
    ],
    why: "Airbnb and Booking.com only let partner software fetch data for you. Innkeep is not one, so their data is read from pages you open. Innkeep cannot refresh it while you are away, and tells you here when it has grown old.",
  },
  /** Under the "update your reservations" prompt. */
  more: (n: number) => `${n} other source${n === 1 ? "" : "s"} to refresh`,
  seeAll: "See all data",
};

const fr: typeof en = {
  title: "Données",
  description:
    "Tout ce qu’Innkeep détient venant d’Airbnb, de Booking.com et de Claude, son ancienneté, et le bouton qui le met à jour.",
  summary: {
    allFresh: "Tout est à jour.",
    toRefresh: (n) => `${n} source${n > 1 ? "s" : ""} à mettre à jour.`,
    how: "Chaque bouton ouvre votre propre page sur la plateforme ; l’extension la lit et Innkeep se met à jour à votre retour.",
    popup: {
      title: "Ou laissez l’extension faire la tournée",
      body: "Utilisez les deux boutons ci-dessous, ou les mêmes dans l’icône Innkeep Companion de la barre d’outils du navigateur :",
      reservations: {
        name: "Update reservations",
        text: "ouvre vos deux pages de réservations, les lit et revient. Moins d’une minute.",
      },
      everything: {
        name: "Read everything",
        text: "parcourt aussi vos calendriers, l’éditeur d’annonce, l’extranet, vos annonces publiques et les avis, une page à la fois dans un seul onglet, avec un bouton Stop. Quelques minutes.",
      },
      signIn:
        "Connectez-vous d’abord à Airbnb et à Booking.com : une page qui demande de se connecter est ignorée.",
    },
  },
  account: "Tout le compte",
  columns: {
    source: "Donnée",
    from: "Source",
    read: "Dernière lecture",
    state: "État",
    action: "Mettre à jour",
  },
  kinds: {
    calendar: { name: "Calendrier", feeds: "Dates réservées et bloquées" },
    reservations: {
      name: "Réservations",
      feeds: "Noms des voyageurs, versements, séjours passés et annulés",
    },
    prices: { name: "Prix par nuit", feeds: "Prix de chaque nuit libre" },
    guestPrices: { name: "Prix voyageur", feeds: "Ce que paie un voyageur pour des séjours types" },
    preview: {
      name: "Aperçu de l’annonce",
      feeds: "Titre, photos, note et description vus par les voyageurs",
    },
    reviews: { name: "Avis", feeds: "Ce que les voyageurs ont écrit, leur note et vos réponses" },
    adminPages: {
      name: "Pages d’administration",
      feeds: "Chaque équipement, photo et règle, tels que l’administration de la plateforme les affiche",
    },
    listingDetails: {
      name: "Réglages de l’annonce",
      feeds: "Adresse, horaires, règlement, remises, séjour minimum",
    },
    advice: { name: "Conseils", feeds: "Rédigés par Claude à partir de tout ce qui précède" },
  },
  claude: "Claude",
  never: "Jamais",
  state: {
    fresh: "À jour",
    stale: "À mettre à jour",
    never: "Pas encore lu",
    failed: "Dernier essai en échec",
  },
  automatic: "Se met à jour tout seul toutes les 15 minutes et à l’ouverture d’Innkeep.",
  progress: (done, total) =>
    `${done} séjour${done > 1 ? "s" : ""} vérifié${done > 1 ? "s" : ""} sur ${total}`,
  actions: {
    open: (platform) => `Ouvrir ${platform}`,
    sync: "Synchroniser",
    syncing: "Synchronisation…",
    pricing: "Aller aux Tarifs",
    assistant: "Aller à l’Assistant",
    popup: "Utilisez « Read everything » dans l’extension",
    pages: (n) => `${n} page${n > 1 ? "s" : ""} conservée${n > 1 ? "s" : ""}`,
    hint: "Ouvre votre propre page. L’extension la lit ; cet onglet se met à jour à votre retour.",
  },
  blocked: {
    extension: { text: "Nécessite l’extension de navigateur.", link: "L’installer" },
    listingId: {
      text: "Innkeep ne connaît pas encore l’identifiant de cette annonce. La lecture de vos réservations le lui apprend.",
      link: "",
    },
    listingUrl: { text: "Nécessite l’adresse de votre page publique.", link: "L’ajouter sur le logement" },
    calendarLink: { text: "Pas encore de lien de calendrier.", link: "L’ajouter sur le logement" },
    claude: { text: "Claude n’est pas connecté.", link: "Le connecter" },
  },
  limits: {
    title: "Combien de temps une donnée reste à jour",
    rows: [
      "Calendrier : 30 minutes. Mis à jour automatiquement.",
      "Réservations : 12 heures.",
      "Prix par nuit : 1 jour.",
      "Prix voyageur, aperçu de l’annonce et avis : 7 jours.",
      "Réglages de l’annonce et pages d’administration : 30 jours.",
      "Conseils : 7 jours.",
    ],
    why: "Airbnb et Booking.com ne laissent que les logiciels partenaires récupérer les données à votre place. Innkeep n’en est pas un : leurs données sont donc lues sur les pages que vous ouvrez. Innkeep ne peut pas les mettre à jour en votre absence, et vous indique ici quand elles ont vieilli.",
  },
  more: (n) => `${n} autre${n > 1 ? "s" : ""} source${n > 1 ? "s" : ""} à mettre à jour`,
  seeAll: "Voir toutes les données",
};

export const data = { en, fr };
