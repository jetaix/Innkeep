/** The Reservations page, the stay rows it shares with the Overview, and the "update from" buttons. */
const en = {
  title: "Reservations",
  description: "Every stay across your channels: upcoming first, then the past year.",
  addBooking: "Add a booking",
  empty: {
    title: "No upcoming reservations",
    body: "Bookings appear here once a calendar is connected and synced. You can also add a direct booking yourself.",
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
