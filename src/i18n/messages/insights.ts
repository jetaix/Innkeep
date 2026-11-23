/** The Suggestions page: the wording of every rule-based suggestion, the list, and the AI advice panel. */
const en = {
  title: "Suggestions",
  description: "Things worth fixing or trying, found in your own calendar, listings and numbers.",
  list: {
    nothing: "Nothing to fix",
    count: (n: number) => `${n} suggestion${n > 1 ? "s" : ""}`,
    restore: (n: number) => `Restore ${n} dismissed`,
    allClear:
      "Calendars are syncing, guests are answered and listings are up to date. Innkeep checks again on every visit.",
    dismiss: "Dismiss",
    dismissLabel: (title: string) => `Dismiss: ${title}`,
  },
  severity: { urgent: "Urgent", recommended: "Recommended", idea: "Idea" },
  /** One entry per rule in `features/insights/rules.ts`. */
  rules: {
    /** Stands in for a property that no longer exists. */
    aProperty: "A property",
    openInCalendar: "Open in calendar",
    reviewPrice: "Review the price",
    connectCalendar: "Connect a calendar",
    conflict: {
      title: (property: string) => `Double booking at ${property}`,
      body: (first: string, second: string, from: string, to: string) =>
        `${first} and ${second} both hold nights between ${from} and ${to}. Contact the platform's support now, before either guest travels, to move or cancel one of them.`,
    },
    unnamed: {
      title: (count: number, property: string) =>
        `${count === 1 ? "An arrival" : `${count} arrivals`} this week at ${property} with no guest name`,
      body: "Calendar feeds only carry dates. Add the name from the booking so you and your cleaner know who is coming.",
      action: "Add the name",
    },
    gap: {
      title: (property: string, dates: string[]) =>
        dates.length === 1
          ? `One free night at ${property} on ${dates[0]}`
          : `${dates.length} single free nights at ${property}: ${dates.join(", ")}`,
      body: "A single night between two stays is hard to sell at full price. Lower the minimum stay to one night for that date, discount it, or offer it to the guest before or after as an extension.",
      action: (count: number): string => (count === 1 ? "See the gap" : "See the first gap"),
    },
    turnover: {
      title: (property: string, date: string) => `Same-day turnover at ${property} on ${date}`,
      body: (checkOutTime: string, checkInTime: string) =>
        `One guest leaves by ${checkOutTime} and the next arrives from ${checkInTime}. Confirm the cleaning slot and avoid promising a late check-out or early check-in.`,
    },
    occupancy: {
      title: (property: string, percent: string) => `${property} is ${percent} booked for the next 30 days`,
      /** `rate` is the nightly rate with its currency, "120 EUR". */
      lowBody: (rate: string) =>
        `As a rule of thumb, try 10–15% off the ${rate} rate for the open nights, or shorten the minimum stay.`,
      highBody:
        "Filling this fast can mean the rate is below what guests will pay. As a rule of thumb, raise it 5–10% for the nights still open and for the same period next month.",
    },
    content: {
      title: (property: string) => `Strengthen the listing for ${property}`,
      shortTitle: "the title is under 15 characters, so it says little in search results",
      longTitle:
        "the title is over 32 characters; Airbnb recommends 32 or fewer so it shows in full on phones",
      shortDescription: "the description is under 300 characters",
      noHouseRules: "there are no house rules",
      body: (issues: string[]) =>
        `Right now ${issues.join("; ")}. Lead with what is unique (view, location, a standout amenity) and spell out sleeping arrangements, Wi-Fi and parking: they are the questions guests ask most.`,
      action: "Edit the listing",
    },
    syncError: {
      title: (channel: string, property: string) => `${channel} calendar for ${property} is not syncing`,
      body: (error: string, channel: string) =>
        `The last import failed (${error}). Until it works, new ${channel} bookings will not block your other channel. Copy a fresh calendar link from ${channel}.`,
      action: "Fix the link",
    },
    syncStale: {
      title: (channel: string, property: string, hours: number) =>
        `${channel} calendar for ${property} last synced ${hours} hours ago`,
      body: "Background sync may be turned off or the server was asleep. Sync now, then check SYNC_INTERVAL_MINUTES.",
      action: "Open the property",
    },
    drift: {
      title: (channel: string, property: string) => `${channel} still shows the old details for ${property}`,
      body: (channel: string) =>
        `You changed the listing after last publishing it to ${channel}. Guests comparing platforms notice mismatched prices and rules.`,
      action: "Publish the changes",
    },
    singleChannel: {
      title: (property: string, channel: string) => `${property} is only connected to ${channel}`,
      body: (missing: string) =>
        `If it is also listed on ${missing}, connect that calendar too. Otherwise the two platforms cannot see each other's bookings.`,
    },
    noChannel: {
      title: (property: string) => `Connect a calendar for ${property}`,
      body: "Paste the calendar link from Airbnb or Booking.com and Innkeep starts importing bookings every 15 minutes.",
    },
    noCharges: {
      title: "Add your costs to see what you really earn",
      body: "Revenue is shown before cleaning, platform commission and subscriptions. Add them once and every month shows the net figure.",
      action: "Add charges",
    },
    unpriced: {
      title: (count: number) => `${count} upcoming stays use an estimated payout`,
      body: "Estimates multiply nights by your nightly rate. Enter the payout shown by the platform on each reservation for exact revenue.",
      action: "Review reservations",
    },
  },
  advice: {
    title: "Tailored advice",
    source: "Written by Claude from your listings, payouts, nightly prices and revenue.",
    /** "Written 19 Nov, 14:30 by claude-…." */
    generated: (when: string, model: string) => `Written ${when} by ${model}.`,
    thinking: "Thinking, about a minute…",
    refresh: "Refresh advice",
    get: "Get advice",
    /** The sentence around the name of the setting, which is shown as code. */
    setup: {
      before: "Optional. Set ",
      after: " on the server and restart to turn this on. The suggestions above work without it.",
    },
    impact: { high: "high impact", medium: "medium impact", low: "low impact" },
    privacy:
      "Sends listing text, nightly prices, stay dates and payouts, and revenue totals to Anthropic. Never guest names or messages.",
  },
  errors: {
    notConfigured: "Connect Claude first, lower on this page.",
    noProperty: "Add a property first.",
    refused: "The model declined to answer this request.",
    unreadable: "The model's answer could not be read. Try again.",
    authentication: "Anthropic rejected the API key. Connect Claude again, lower on this page.",
    rateLimit: "The Anthropic API is rate limiting this key. Try again in a minute.",
    connection: "Could not reach the Anthropic API. Check the server's network access.",
    api: (status: number | null) => `The Anthropic API returned an error (${status ?? "unknown"}).`,
  },
};

const fr: typeof en = {
  title: "Suggestions",
  description:
    "Ce qui mérite d’être corrigé ou essayé, d’après votre propre calendrier, vos annonces et vos chiffres.",
  list: {
    nothing: "Rien à corriger",
    count: (n) => `${n} suggestion${n > 1 ? "s" : ""}`,
    restore: (n) => `Rétablir ${n} suggestion${n > 1 ? "s" : ""} ignorée${n > 1 ? "s" : ""}`,
    allClear:
      "Les calendriers se synchronisent, les voyageurs ont reçu une réponse et les annonces sont à jour. Innkeep vérifie de nouveau à chaque visite.",
    dismiss: "Ignorer",
    dismissLabel: (title) => `Ignorer : ${title}`,
  },
  severity: { urgent: "Urgent", recommended: "Recommandé", idea: "Idée" },
  rules: {
    aProperty: "Un logement",
    openInCalendar: "Ouvrir dans le calendrier",
    reviewPrice: "Revoir le tarif",
    connectCalendar: "Connecter un calendrier",
    conflict: {
      title: (property) => `Double réservation pour ${property}`,
      body: (first, second, from, to) =>
        `${first} et ${second} occupent tous deux des nuits entre le ${from} et le ${to}. Contactez dès maintenant l’assistance de la plateforme, avant que l’un des voyageurs ne se mette en route, pour déplacer ou annuler l’une des réservations.`,
    },
    unnamed: {
      title: (count, property) =>
        `${count === 1 ? "Une arrivée" : `${count} arrivées`} cette semaine pour ${property} sans nom de voyageur`,
      body: "Les calendriers ne contiennent que des dates. Ajoutez le nom figurant sur la réservation pour que vous et la personne chargée du ménage sachiez qui arrive.",
      action: "Ajouter le nom",
    },
    gap: {
      title: (property, dates) =>
        dates.length === 1
          ? `Une nuit libre pour ${property} le ${dates[0]}`
          : `${dates.length} nuits libres isolées pour ${property} : ${dates.join(", ")}`,
      body: "Une nuit seule entre deux séjours se vend difficilement au plein tarif. Ramenez le séjour minimum à une nuit pour cette date, baissez son prix, ou proposez-la au voyageur précédent ou suivant pour prolonger son séjour.",
      action: (count) => (count === 1 ? "Voir la nuit libre" : "Voir la première nuit libre"),
    },
    turnover: {
      title: (property, date) => `Départ et arrivée le même jour pour ${property} le ${date}`,
      body: (checkOutTime, checkInTime) =>
        `Un voyageur part avant ${checkOutTime} et le suivant arrive à partir de ${checkInTime}. Confirmez le créneau de ménage et évitez de promettre un départ tardif ou une arrivée anticipée.`,
    },
    occupancy: {
      title: (property, percent) => `${property} est réservé à ${percent} pour les 30 prochains jours`,
      lowBody: (rate) =>
        `Selon une règle empirique, essayez une réduction de 10 à 15 % sur le tarif de ${rate} pour les nuits libres, ou raccourcissez le séjour minimum.`,
      highBody:
        "Un remplissage aussi rapide peut indiquer que le tarif est inférieur à ce que les voyageurs sont prêts à payer. Selon une règle empirique, augmentez-le de 5 à 10 % pour les nuits encore libres et pour la même période le mois prochain.",
    },
    content: {
      title: (property) => `Améliorez l’annonce de ${property}`,
      shortTitle: "le titre fait moins de 15 caractères et en dit donc peu dans les résultats de recherche",
      longTitle:
        "le titre dépasse 32 caractères, alors qu’Airbnb en recommande 32 au plus pour qu’il s’affiche en entier sur téléphone",
      shortDescription: "la description fait moins de 300 caractères",
      noHouseRules: "il n’y a pas de règlement intérieur",
      body: (issues) =>
        `Actuellement, ${issues.join(" ; ")}. Commencez par ce qui est unique (vue, emplacement, équipement remarquable) et précisez le couchage, le Wi-Fi et le stationnement : ce sont les questions que les voyageurs posent le plus.`,
      action: "Modifier l’annonce",
    },
    syncError: {
      title: (channel, property) => `Le calendrier ${channel} de ${property} ne se synchronise plus`,
      body: (error, channel) =>
        `Le dernier import a échoué (${error}). Tant qu’il ne fonctionne pas, les nouvelles réservations ${channel} ne bloqueront pas votre autre plateforme. Copiez un nouveau lien de calendrier depuis ${channel}.`,
      action: "Corriger le lien",
    },
    syncStale: {
      title: (channel, property, hours) =>
        `Le calendrier ${channel} de ${property} a été synchronisé il y a ${hours} heures`,
      body: "La synchronisation en arrière-plan est peut-être désactivée, ou le serveur était en veille. Synchronisez maintenant, puis vérifiez SYNC_INTERVAL_MINUTES.",
      action: "Ouvrir le logement",
    },
    drift: {
      title: (channel, property) => `${channel} affiche encore les anciennes informations de ${property}`,
      body: (channel) =>
        `Vous avez modifié l’annonce depuis sa dernière publication sur ${channel}. Les voyageurs qui comparent les plateformes remarquent les écarts de prix et de règles.`,
      action: "Publier les modifications",
    },
    singleChannel: {
      title: (property, channel) => `${property} n’est connecté qu’à ${channel}`,
      body: (missing) =>
        `Si ce logement est aussi proposé sur ${missing}, connectez également ce calendrier. Sinon, les deux plateformes ne voient pas les réservations l’une de l’autre.`,
    },
    noChannel: {
      title: (property) => `Connectez un calendrier pour ${property}`,
      body: "Collez le lien de calendrier d’Airbnb ou de Booking.com et Innkeep importe les réservations toutes les 15 minutes.",
    },
    noCharges: {
      title: "Ajoutez vos charges pour voir ce que vous gagnez vraiment",
      body: "Les revenus sont affichés avant le ménage, la commission des plateformes et les abonnements. Ajoutez-les une fois et chaque mois affiche le montant net.",
      action: "Ajouter des charges",
    },
    unpriced: {
      title: (count) => `${count} séjours à venir utilisent un versement estimé`,
      body: "Les estimations multiplient les nuits par votre tarif par nuit. Saisissez sur chaque réservation le versement indiqué par la plateforme pour obtenir des revenus exacts.",
      action: "Revoir les réservations",
    },
  },
  advice: {
    title: "Conseils personnalisés",
    source: "Rédigés par Claude à partir de vos annonces, versements, prix par nuit et revenus.",
    generated: (when, model) => `Rédigés le ${when} par ${model}.`,
    thinking: "Réflexion en cours, environ une minute…",
    refresh: "Actualiser les conseils",
    get: "Obtenir des conseils",
    setup: {
      before: "Facultatif. Définissez ",
      after:
        " sur le serveur et redémarrez pour activer ces conseils. Les suggestions ci-dessus fonctionnent sans.",
    },
    impact: { high: "impact élevé", medium: "impact moyen", low: "impact faible" },
    privacy:
      "Envoie à Anthropic le texte des annonces, les prix par nuit, les dates et versements des séjours et les totaux de revenus. Jamais les noms ni les messages des voyageurs.",
  },
  errors: {
    notConfigured: "Connectez d’abord Claude, plus bas sur cette page.",
    noProperty: "Ajoutez d’abord un logement.",
    refused: "Le modèle a refusé de répondre à cette demande.",
    unreadable: "La réponse du modèle n’a pas pu être lue. Réessayez.",
    authentication: "Anthropic a refusé la clé d’API. Reconnectez Claude, plus bas sur cette page.",
    rateLimit: "L’API Anthropic limite le débit de cette clé. Réessayez dans une minute.",
    connection: "Impossible de joindre l’API Anthropic. Vérifiez l’accès réseau du serveur.",
    api: (status) => `L’API Anthropic a renvoyé une erreur (${status ?? "inconnue"}).`,
  },
};

export const insights = { en, fr };
