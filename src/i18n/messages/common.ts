/**
 * Words shared by the whole interface: navigation, the command menu, buttons
 * and the names of things that appear on several pages.
 */
const en = {
  nav: {
    main: "Main",
    overview: "Overview",
    calendar: "Calendar",
    reservations: "Reservations",
    cleaning: "Cleaning",
    reviews: "Reviews",
    revenue: "Revenue",
    pricing: "Pricing",
    suggestions: "Suggestions",
    properties: "Properties",
    settings: "Settings",
    shortcut: (label: string, key: string) => `${label} (G then ${key})`,
    needAttention: "need attention",
    skipToContent: "Skip to content",
  },
  command: {
    open: "Search or jump to…",
    label: "Command menu",
    placeholder: "Type a command or search…",
    empty: "Nothing matches.",
    goTo: "Go to",
    actions: "Actions",
    addBooking: "Add a booking or block dates",
    syncAll: "Sync all calendars now",
    toMove: "to move",
    toOpen: "to open",
    toClose: "to close",
  },
  sources: { airbnb: "Airbnb", booking: "Booking.com", direct: "Direct" },
  actions: {
    copy: "Copy",
    copied: "Copied",
    close: "Close",
    later: "Later",
    newTab: "(opens a new tab)",
  },
  loading: "Loading…",
  /** What a member may do. Keyed by the stored value. */
  roles: { admin: "Admin", visitor: "Visitor" },
  account: {
    signOut: "Sign out",
    /** Said when someone with the visitor role tries to change something. */
    readOnly: "Your access is read-only: ask an admin to make this change.",
  },
  notFound: {
    title: "This page does not exist",
    body: "The address may be mistyped, or the page may have been moved.",
    home: "Go to the home page",
  },
  preferences: {
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    language: "Language",
  },
  sample: {
    title: "Sample data.",
    body: "These properties, guests and amounts are invented. Nothing here comes from Airbnb or Booking.com.",
    remove: "Remove sample data",
    confirm: "Remove the sample properties, bookings, messages and charges?",
  },
  /** "3 nights", "1 stay": counted nouns used across pages. */
  count: {
    nights: (n: number) => `${n} night${n === 1 ? "" : "s"}`,
    stays: (n: number) => `${n} stay${n === 1 ? "" : "s"}`,
    guests: (n: number) => `${n} guest${n === 1 ? "" : "s"}`,
  },
};

const fr: typeof en = {
  nav: {
    main: "Principal",
    overview: "Vue d’ensemble",
    calendar: "Calendrier",
    reservations: "Réservations",
    cleaning: "Ménage",
    reviews: "Avis",
    revenue: "Revenus",
    pricing: "Tarifs",
    suggestions: "Suggestions",
    properties: "Logements",
    settings: "Réglages",
    shortcut: (label, key) => `${label} (G puis ${key})`,
    needAttention: "à traiter",
    skipToContent: "Aller au contenu",
  },
  command: {
    open: "Rechercher…",
    label: "Menu de commandes",
    placeholder: "Tapez une commande ou une recherche…",
    empty: "Aucun résultat.",
    goTo: "Aller à",
    actions: "Actions",
    addBooking: "Ajouter une réservation ou bloquer des dates",
    syncAll: "Synchroniser tous les calendriers",
    toMove: "pour naviguer",
    toOpen: "pour ouvrir",
    toClose: "pour fermer",
  },
  sources: { airbnb: "Airbnb", booking: "Booking.com", direct: "Direct" },
  actions: {
    copy: "Copier",
    copied: "Copié",
    close: "Fermer",
    later: "Plus tard",
    newTab: "(ouvre un nouvel onglet)",
  },
  loading: "Chargement…",
  roles: { admin: "Administrateur", visitor: "Visiteur" },
  account: {
    signOut: "Se déconnecter",
    readOnly: "Votre accès est en lecture seule : demandez à un administrateur de faire ce changement.",
  },
  notFound: {
    title: "Cette page n’existe pas",
    body: "L’adresse est peut-être mal saisie, ou la page a été déplacée.",
    home: "Aller à l’accueil",
  },
  preferences: {
    theme: "Thème",
    system: "Système",
    light: "Clair",
    dark: "Sombre",
    language: "Langue",
  },
  sample: {
    title: "Données d’exemple.",
    body: "Ces logements, voyageurs et montants sont inventés. Rien ici ne vient d’Airbnb ou de Booking.com.",
    remove: "Supprimer les données d’exemple",
    confirm: "Supprimer les logements, réservations, messages et charges d’exemple ?",
  },
  count: {
    nights: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
    stays: (n) => `${n} séjour${n > 1 ? "s" : ""}`,
    guests: (n) => `${n} voyageur${n > 1 ? "s" : ""}`,
  },
};

export const common = { en, fr };
