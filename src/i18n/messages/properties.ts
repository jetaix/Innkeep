/** The Properties list and a property's page: listing details, channel connections and calendar links. */
const en = {
  title: "Properties",
  description: "Listing details and channel connections.",
  list: {
    noAddress: "No address",
    /** "12 Canal St, sleeps 4, 120 EUR a night" */
    summary: (address: string, guests: number, price: number, currency: string) =>
      `${address}, sleeps ${guests}, ${price} ${currency} a night`,
    /** "Airbnb: connected" */
    badge: (channel: string, status: string) => `${channel}: ${status}`,
    status: {
      notConnected: "not connected",
      notSyncing: "not syncing",
      detailsChanged: "details changed",
      connected: "connected",
    },
  },
  create: {
    label: "New property",
    placeholder: "A name only you see, e.g. Canal Loft",
    submit: "Add property",
    pending: "Adding…",
  },
  property: {
    title: "Property",
    saving: "Saving…",
    delete: "Delete property",
    confirmDelete: (name: string) =>
      `Delete ${name} with its reservations and conversations? This cannot be undone.`,
  },
  details: {
    heading: "Listing details",
    intro: "The master copy. Each channel uses it unless you override a field for that channel.",
    name: "Internal name",
    address: "Address",
    listingTitle: "Listing title",
    listingTitleHint: "Airbnb recommends 32 characters or fewer so the title shows in full.",
    description: "Description",
    guests: "Guests",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    nightlyRate: "Nightly rate",
    currency: "Currency",
    checkInFrom: "Check-in from",
    checkOutBy: "Check-out by",
    houseRules: "House rules",
    save: "Save details",
  },
  fullCalendar: {
    heading: "Full calendar link",
    body: "Every stay from every channel, for Google Calendar or your cleaner. Anyone with the link sees booked dates, never guest names.",
  },
  channel: {
    openListing: "Open listing",
    importLabel: (channel: string) => `Import: the calendar link ${channel} gives you`,
    /** Where calendar sync lives on each platform, in the platform's own menu words. */
    calendarHelp: {
      airbnb: "Airbnb → Calendar → Availability → Connect calendars",
      booking: "Booking.com extranet → Rates & Availability → Sync calendars",
    },
    exportHint: (where: string) => `Export: add this link in ${where}`,
    exportLabel: (channel: string) => `Export link for ${channel}`,
    /** Shown instead of the export link when Innkeep runs where the platforms cannot reach it. */
    local: {
      title: (platform: string) => `${platform} cannot use a link from this Innkeep`,
      why: (platform: string) =>
        `Innkeep is running on your own computer. ${platform} reads calendar links from its own servers, which cannot reach your computer, so it rejects the link.`,
      instead: (other: string, where: string) =>
        `To stop double bookings, give it your ${other} calendar link instead. Add it in ${where}:`,
      copyLabel: (other: string) => `${other} calendar link`,
      missing: (other: string) =>
        `To stop double bookings, save your ${other} calendar link on this page first; it will appear here, ready to paste.`,
    },
    shownOn: (channel: string) => `Details shown on ${channel}`,
    listingUrl: "Listing page URL",
    titleOverride: "Title override",
    titleOverridePlaceholder: "Same as the master title",
    descriptionOverride: "Description override",
    descriptionOverridePlaceholder: "Same as the master description",
    save: (channel: string) => `Save ${channel} settings`,
    syncNow: "Sync calendar now",
    syncing: "Syncing…",
    published: (ago: string) => `Details published ${ago}`,
    outdated: "Details changed since last publish",
    neverPublished: "Details not published yet",
    copyTitle: "Copy title",
    copyDescription: "Copy description",
    publishTo: (channel: string) => `Publish to ${channel}`,
    markPublished: "Mark as published",
    manualNote: (channel: string) =>
      `${channel} only lets approved partners edit listings through its API. Copy the fields into the listing editor, then mark them as published so Innkeep can tell you when they drift.`,
  },
  sync: {
    paste: "Paste the link and save; the first import runs straight away.",
    failed: (error: string) => `Last sync failed: ${error}`,
    lastSuccess: (ago: string) => ` (last success ${ago})`,
    lastSynced: (ago: string) => `Last synced ${ago}`,
    never: "Not synced yet",
  },
  facts: {
    heading: (channel: string) => `Set on ${channel}`,
    readAgain: "Read again",
    readWithExtension: "Read with the extension",
    opensEditor: (channel: string) => `(opens the ${channel} listing editor in a new tab)`,
    empty:
      "Prices, minimum stay, amenities and policies appear here once the extension has read your listing editor.",
    readAt: (ago: string) => `Read ${ago}.`,
  },
  adminPages: {
    title: (platform: string) => `Read from the ${platform} admin`,
    hint: "Kept as the platform shows them. Use “Read everything” in the extension to refresh.",
    photos: (n: number) => `${n} photo${n === 1 ? "" : "s"}`,
    read: (ago: string) => `read ${ago}`,
  },
};

const fr: typeof en = {
  title: "Logements",
  description: "Détails des annonces et connexions aux plateformes.",
  list: {
    noAddress: "Sans adresse",
    summary: (address, guests, price, currency) =>
      `${address}, ${guests} voyageur${guests > 1 ? "s" : ""}, ${price} ${currency} par nuit`,
    badge: (channel, status) => `${channel} : ${status}`,
    status: {
      notConnected: "non connecté",
      notSyncing: "synchronisation en échec",
      detailsChanged: "détails modifiés",
      connected: "connecté",
    },
  },
  create: {
    label: "Nouveau logement",
    placeholder: "Un nom que vous seul voyez, par ex. Loft du canal",
    submit: "Ajouter le logement",
    pending: "Ajout…",
  },
  property: {
    title: "Logement",
    saving: "Enregistrement…",
    delete: "Supprimer le logement",
    confirmDelete: (name) =>
      `Supprimer ${name} avec ses réservations et ses conversations ? Cette action est irréversible.`,
  },
  details: {
    heading: "Détails de l’annonce",
    intro:
      "La version de référence. Chaque plateforme l’utilise, sauf si vous remplacez un champ pour cette plateforme.",
    name: "Nom interne",
    address: "Adresse",
    listingTitle: "Titre de l’annonce",
    listingTitleHint: "Airbnb recommande 32 caractères au maximum pour que le titre s’affiche en entier.",
    description: "Description",
    guests: "Voyageurs",
    bedrooms: "Chambres",
    bathrooms: "Salles de bain",
    nightlyRate: "Tarif par nuit",
    currency: "Devise",
    checkInFrom: "Arrivée à partir de",
    checkOutBy: "Départ avant",
    houseRules: "Règlement intérieur",
    save: "Enregistrer les détails",
  },
  fullCalendar: {
    heading: "Lien du calendrier complet",
    body: "Tous les séjours de toutes les plateformes, pour Google Agenda ou votre équipe de ménage. Toute personne disposant du lien voit les dates réservées, jamais le nom des voyageurs.",
  },
  channel: {
    openListing: "Ouvrir l’annonce",
    importLabel: (channel) => `Importer : le lien de calendrier fourni par ${channel}`,
    calendarHelp: {
      airbnb: "Airbnb → Calendrier → Disponibilités → Connecter les calendriers",
      booking: "Extranet Booking.com → Tarifs et disponibilités → Synchroniser les calendriers",
    },
    exportHint: (where) => `Exporter : ajoutez ce lien dans ${where}`,
    exportLabel: (channel) => `Lien d’export pour ${channel}`,
    local: {
      title: (platform) => `${platform} ne peut pas utiliser un lien de cet Innkeep`,
      why: (platform) =>
        `Innkeep tourne sur votre propre ordinateur. ${platform} lit les liens de calendrier depuis ses serveurs, qui ne peuvent pas joindre votre ordinateur : il refuse donc le lien.`,
      instead: (other, where) =>
        `Pour éviter les doubles réservations, donnez-lui plutôt votre lien de calendrier ${other}. Ajoutez-le dans ${where} :`,
      copyLabel: (other) => `Lien de calendrier ${other}`,
      missing: (other) =>
        `Pour éviter les doubles réservations, enregistrez d’abord votre lien de calendrier ${other} sur cette page ; il apparaîtra ici, prêt à coller.`,
    },
    shownOn: (channel) => `Détails affichés sur ${channel}`,
    listingUrl: "URL de la page de l’annonce",
    titleOverride: "Titre spécifique",
    titleOverridePlaceholder: "Identique au titre de référence",
    descriptionOverride: "Description spécifique",
    descriptionOverridePlaceholder: "Identique à la description de référence",
    save: (channel) => `Enregistrer les réglages ${channel}`,
    syncNow: "Synchroniser le calendrier",
    syncing: "Synchronisation…",
    published: (ago) => `Détails publiés ${ago}`,
    outdated: "Détails modifiés depuis la dernière publication",
    neverPublished: "Détails pas encore publiés",
    copyTitle: "Copier le titre",
    copyDescription: "Copier la description",
    publishTo: (channel) => `Publier sur ${channel}`,
    markPublished: "Marquer comme publié",
    manualNote: (channel) =>
      `${channel} réserve la modification des annonces par API à ses partenaires agréés. Copiez les champs dans l’éditeur d’annonce, puis marquez-les comme publiés pour qu’Innkeep vous signale tout écart.`,
  },
  sync: {
    paste: "Collez le lien et enregistrez ; le premier import démarre aussitôt.",
    failed: (error) => `Échec de la dernière synchronisation : ${error}`,
    lastSuccess: (ago) => ` (dernière réussite ${ago})`,
    lastSynced: (ago) => `Dernière synchronisation ${ago}`,
    never: "Pas encore synchronisé",
  },
  facts: {
    heading: (channel) => `Défini sur ${channel}`,
    readAgain: "Relire",
    readWithExtension: "Lire avec l’extension",
    opensEditor: (channel) => `(ouvre l’éditeur d’annonce ${channel} dans un nouvel onglet)`,
    empty:
      "Les prix, la durée minimale de séjour, les équipements et les conditions apparaissent ici une fois que l’extension a lu votre éditeur d’annonce.",
    readAt: (ago) => `Lu ${ago}.`,
  },
  adminPages: {
    title: (platform) => `Lu dans l’administration ${platform}`,
    hint: "Conservé tel que la plateforme l’affiche. Utilisez « Read everything » dans l’extension pour mettre à jour.",
    photos: (n) => `${n} photo${n > 1 ? "s" : ""}`,
    read: (ago) => `lu ${ago}`,
  },
};

export const properties = { en, fr };
