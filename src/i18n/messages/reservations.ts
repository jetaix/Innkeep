/** The Reservations page, the stay rows it shares with the Overview, and the "update from" buttons. */
const en = {
  title: "Reservations",
  description: "Every stay across your channels: upcoming first, then the past year.",
  addBooking: "Add a booking",
  empty: {
    title: "No upcoming reservations",
    body: "Bookings appear here once a calendar is connected and synced. You can also add a direct booking yourself.",
  },
  overview: {
    title: "At a glance",
    past: "Last 12 months",
    upcoming: "Booked ahead",
    stays: "Reservations",
    revenue: "Revenue",
    potential: "Potential revenue",
    /** Under a revenue figure: "of which €1,200 estimated". */
    estimated: (amount: string) => `of which ${amount} estimated from the nightly rate`,
    fees: "Platform fees",
    feesNote: "already taken out of the revenue",
    feesUnknown: "Not known yet",
    costs: "Your costs",
    noCosts: "None entered.",
    addCosts: "Add them on Revenue",
    net: "Net",
    profitable: "Profitable",
    loss: "At a loss",
  },
  view: {
    label: "View",
    list: "List",
    months: "By month",
  },
  months: {
    upcoming: "This month and ahead",
    past: "Earlier months",
    /** "67% booked" */
    booked: (percent: string): string => `${percent} booked`,
    full: "Fully booked",
    /** "20 of 30 nights" */
    nights: (booked: number, available: number): string => `${booked} of ${available} nights`,
    occupancy: "Share of nights booked",
    none: "No reservation this month.",
  },
  groups: {
    now: "Staying now",
    week: "Arriving in the next 7 days",
    later: "Later",
    past: "Past 12 months",
  },
  estimateNote:
    "Amounts marked ≈ are estimated from the nightly rate because calendar feeds carry no prices. Open a reservation to enter the real payout.",
  row: {
    ended: "Ended",
    arrivesToday: "Arrives today",
    stayingNow: "Staying now",
    arrivesTomorrow: "Arrives tomorrow",
    inDays: (days: number) => `In ${days} days`,
    guestMissing: "Guest name missing",
    doubleBooking: "Double booking",
    /** "2 Nov to 23 Jan" */
    range: (from: string, to: string) => `${from} to ${to}`,
    estimated: "Estimated from the nightly rate",
    entered: "Payout you entered",
  },
  refresh: {
    label: "Update reservations from the platforms",
    from: "Update reservations from",
    hint: "Opens your reservations page. The Innkeep extension reads it and closes the tab.",
  },
};

const fr: typeof en = {
  title: "Réservations",
  description: "Tous les séjours de vos plateformes : d’abord ceux à venir, puis l’année écoulée.",
  addBooking: "Ajouter une réservation",
  empty: {
    title: "Aucune réservation à venir",
    body: "Les réservations apparaissent ici dès qu’un calendrier est connecté et synchronisé. Vous pouvez aussi ajouter vous-même une réservation directe.",
  },
  overview: {
    title: "En un coup d’œil",
    past: "12 derniers mois",
    upcoming: "À venir",
    stays: "Réservations",
    revenue: "Revenus",
    potential: "Revenu potentiel",
    estimated: (amount) => `dont ${amount} estimés d’après le prix par nuit`,
    fees: "Frais des plateformes",
    feesNote: "déjà déduits des revenus",
    feesUnknown: "Pas encore connus",
    costs: "Vos coûts",
    noCosts: "Aucun saisi.",
    addCosts: "Ajoutez-les dans Revenus",
    net: "Net",
    profitable: "Rentable",
    loss: "À perte",
  },
  view: {
    label: "Vue",
    list: "Liste",
    months: "Par mois",
  },
  months: {
    upcoming: "Ce mois-ci et les suivants",
    past: "Mois précédents",
    booked: (percent) => `Rempli à ${percent}`,
    full: "Complet",
    nights: (booked, available) => `${booked} nuits sur ${available}`,
    occupancy: "Part des nuits réservées",
    none: "Aucune réservation ce mois-ci.",
  },
  groups: {
    now: "En cours",
    week: "Arrivées dans les 7 prochains jours",
    later: "Plus tard",
    past: "12 derniers mois",
  },
  estimateNote:
    "Les montants marqués ≈ sont estimés à partir du tarif par nuit, car les calendriers ne contiennent aucun prix. Ouvrez une réservation pour saisir le versement réel.",
  row: {
    ended: "Terminé",
    arrivesToday: "Arrive aujourd’hui",
    stayingNow: "En cours",
    arrivesTomorrow: "Arrive demain",
    inDays: (days) => `Dans ${days} jours`,
    guestMissing: "Nom du voyageur manquant",
    doubleBooking: "Double réservation",
    range: (from, to) => `${from} au ${to}`,
    estimated: "Estimé à partir du tarif par nuit",
    entered: "Versement que vous avez saisi",
  },
  refresh: {
    label: "Mettre à jour les réservations depuis les plateformes",
    from: "Mettre à jour les réservations depuis",
    hint: "Ouvre votre page de réservations. L’extension Innkeep la lit puis ferme l’onglet.",
  },
};

export const reservations = { en, fr };
