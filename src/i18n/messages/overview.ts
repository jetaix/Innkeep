/** The Overview page: today's line, the four figures, the two lists and the welcome shown before any property exists. */
const en = {
  title: "Overview",
  today: {
    /** "Thursday 19 November. Ana arrives; 2 stays in progress." */
    description: (date: string, events: string[]) =>
      `${date}. ${events.length > 0 ? `${events.join("; ")}.` : "No arrivals or departures today."}`,
    arrive: (names: string, count: number) => `${names} ${count > 1 ? "arrive" : "arrives"}`,
    leave: (names: string, count: number) => `${names} ${count > 1 ? "leave" : "leaves"}`,
    inProgress: (count: number) => `${count} ${count > 1 ? "stays" : "stay"} in progress`,
  },
  stats: {
    netRevenue: (month: string) => `Net revenue, ${month}`,
    beforeCosts: (gross: string, charges: string) => `${gross} before ${charges} of costs`,
    arrivalsBooked: (count: number) => `${count} arrival${count === 1 ? "" : "s"} booked so far`,
    booked: "Booked, next 30 days",
    acrossProperties: (count: number) => `Across ${count} propert${count === 1 ? "y" : "ies"}`,
    needsAttention: "Needs attention",
    moreIdeas: (count: number) => `${count} more ideas to consider`,
  },
  reservations: {
    title: "Next reservations",
    all: "All reservations",
    empty: "Nothing booked yet. New bookings appear here after the next sync.",
  },
  suggestions: {
    title: "Suggestions",
    all: (count: number) => `All ${count}`,
    empty: "Nothing to fix right now.",
  },
  welcome: {
    title: "Welcome to Innkeep",
    addProperty: "Add a property",
    loadSample: "Load sample data",
    body: "Add a property and paste its Airbnb and Booking.com calendar links. Innkeep imports your bookings, keeps both platforms in step and starts estimating revenue. Or load three sample properties to look around first.",
  },
};

const fr: typeof en = {
  title: "Vue d’ensemble",
  today: {
    description: (date, events) =>
      `${date.charAt(0).toUpperCase()}${date.slice(1)}. ${
        events.length > 0 ? `${events.join(" ; ")}.` : "Aucune arrivée ni départ aujourd’hui."
      }`,
    arrive: (names, count) => `${names} ${count > 1 ? "arrivent" : "arrive"}`,
    leave: (names, count) => `${names} ${count > 1 ? "partent" : "part"}`,
    inProgress: (count) => `${count} séjour${count > 1 ? "s" : ""} en cours`,
  },
  stats: {
    netRevenue: (month) => `Revenus nets, ${month}`,
    beforeCosts: (gross, charges) => `${gross} avant ${charges} de charges`,
    arrivalsBooked: (count) =>
      `${count} arrivée${count > 1 ? "s" : ""} réservée${count > 1 ? "s" : ""} à ce jour`,
    booked: "Réservé, 30 prochains jours",
    acrossProperties: (count) => `Sur ${count} logement${count > 1 ? "s" : ""}`,
    needsAttention: "À traiter",
    moreIdeas: (count) => `${count} autre${count > 1 ? "s" : ""} idée${count > 1 ? "s" : ""} à étudier`,
  },
  reservations: {
    title: "Prochaines réservations",
    all: "Toutes les réservations",
    empty:
      "Aucune réservation pour l’instant. Les nouvelles apparaissent ici après la prochaine synchronisation.",
  },
  suggestions: {
    title: "Suggestions",
    all: (count) => `Tout voir (${count})`,
    empty: "Rien à corriger pour l’instant.",
  },
  welcome: {
    title: "Bienvenue dans Innkeep",
    addProperty: "Ajouter un logement",
    loadSample: "Charger des données d’exemple",
    body: "Ajoutez un logement et collez ses liens de calendrier Airbnb et Booking.com. Innkeep importe vos réservations, garde les deux plateformes à jour et commence à estimer vos revenus. Ou chargez trois logements d’exemple pour découvrir l’outil.",
  },
};

export const overview = { en, fr };
