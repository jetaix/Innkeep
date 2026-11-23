/** The Calendar page: its header and grid, and the side panels that open a stay or add a booking or block. */
const en = {
  title: "Calendar",
  empty: {
    title: "No properties yet",
    body: "The calendar shows one row per property. Add your first one to get started.",
    addProperty: "Add a property",
  },
  header: {
    /** "16 Nov to 20 Dec 2026." */
    range: (from: string, to: string) => `${from} to ${to}.`,
    noCalendars: "No calendars connected yet.",
    synced: (ago: string) => `Synced ${ago}.`,
    notSynced: "Not synced yet.",
    failing: (count: number) => `${count} calendar${count > 1 ? "s are" : " is"} not syncing`,
    previous: { weeks: "Previous 4 weeks", month: "Previous month", year: "Previous year" },
    next: { weeks: "Next 4 weeks", month: "Next month", year: "Next year" },
    view: "View",
    views: { weeks: "Weeks", month: "Month", year: "Year" },
    today: "Today",
    /** A button's tooltip with its key: "Today (T)". */
    withKey: (label: string, key: string) => `${label} (${key})`,
    syncNow: "Sync now",
    syncing: "Syncing…",
    add: "Add booking or block",
  },
  conflict: {
    title: "Double booking.",
    body: (count: number) => `${count} stays overlap on the same property. They are marked below.`,
  },
  grid: {
    addTo: (property: string, date: string) => `Add to ${property} on ${date}`,
    closedOnBooking: "Closed on Booking.com",
    blocked: "Blocked",
    /** "2 Nov to 5 Nov", inside a bar's label and tooltip. */
    range: (from: string, to: string) => `${from} to ${to}`,
    doubleBooking: "double booking",
  },
  year: {
    /** "142 nights booked" */
    booked: (n: number) => `${n} night${n === 1 ? "" : "s"} booked`,
  },
  legend: {
    blocked: "Blocked",
    move: "move",
    today: "today",
    new: "new",
  },
  panel: {
    reservation: "Reservation",
    blockedDates: "Blocked dates",
    /** "Mon 2 Nov to Thu 5 Nov" */
    range: (from: string, to: string) => `${from} to ${to}`,
    confirmationCode: "Confirmation code",
    overlap: "Overlaps another stay on this property.",
    statusOn: (source: string) => `Status on ${source}`,
    bookedOn: "Booked on",
    guestPaid: "Guest paid",
    fees: "Commission and fees",
    guestName: "Guest name",
    guestNamePlaceholder: "Not included in calendar feeds",
    payoutIn: (currency: string) => `Payout (${currency})`,
    payoutHint: (estimate: string) => `Leave empty to estimate ${estimate} from the nightly rate.`,
    checkIn: "Check-in",
    checkOut: "Check-out",
    notes: "Notes",
    save: "Save",
    saving: "Saving…",
    delete: "Delete",
    deleteConfirm: "Delete this entry? The dates open up again on the next sync.",
    datesFrom: (source: string) =>
      `Dates come from ${source} and update on every sync. Change or cancel the booking there.`,
  },
  create: {
    title: "Add booking or block",
    property: "Property",
    type: "Type",
    directBooking: "Direct booking",
    blockDates: "Block dates",
    bookingsOnly: "Bookings only.",
    payout: "Payout",
    payoutHint: "Bookings only. Empty uses the nightly rate.",
    submit: "Add to calendar",
    adding: "Adding…",
    note: "Airbnb and Booking.com close these dates the next time they read your export link.",
  },
};

const fr: typeof en = {
  title: "Calendrier",
  empty: {
    title: "Aucun logement pour l’instant",
    body: "Le calendrier affiche une ligne par logement. Ajoutez le premier pour commencer.",
    addProperty: "Ajouter un logement",
  },
  header: {
    range: (from, to) => `Du ${from} au ${to}.`,
    noCalendars: "Aucun calendrier connecté pour l’instant.",
    synced: (ago) => `Synchronisé ${ago}.`,
    notSynced: "Pas encore synchronisé.",
    failing: (count) =>
      count > 1
        ? `${count} calendriers ne se synchronisent pas`
        : `${count} calendrier ne se synchronise pas`,
    previous: { weeks: "4 semaines précédentes", month: "Mois précédent", year: "Année précédente" },
    next: { weeks: "4 semaines suivantes", month: "Mois suivant", year: "Année suivante" },
    view: "Vue",
    views: { weeks: "Semaines", month: "Mois", year: "Année" },
    today: "Aujourd’hui",
    withKey: (label, key) => `${label} (${key})`,
    syncNow: "Synchroniser",
    syncing: "Synchronisation…",
    add: "Ajouter une réservation ou un blocage",
  },
  conflict: {
    title: "Double réservation.",
    body: (count) => `${count} séjours se chevauchent dans le même logement. Ils sont signalés ci-dessous.`,
  },
  grid: {
    addTo: (property, date) => `Ajouter à ${property} le ${date}`,
    closedOnBooking: "Fermé sur Booking.com",
    blocked: "Bloqué",
    range: (from, to) => `${from} au ${to}`,
    doubleBooking: "double réservation",
  },
  year: {
    booked: (n) => `${n} nuit${n > 1 ? "s réservées" : " réservée"}`,
  },
  legend: {
    blocked: "Bloqué",
    move: "naviguer",
    today: "aujourd’hui",
    new: "nouveau",
  },
  panel: {
    reservation: "Réservation",
    blockedDates: "Dates bloquées",
    range: (from, to) => `${from} au ${to}`,
    confirmationCode: "Code de confirmation",
    overlap: "Chevauche un autre séjour dans ce logement.",
    statusOn: (source) => `Statut sur ${source}`,
    bookedOn: "Réservé le",
    guestPaid: "Payé par le voyageur",
    fees: "Commission et frais",
    guestName: "Nom du voyageur",
    guestNamePlaceholder: "Absent des calendriers",
    payoutIn: (currency) => `Versement (${currency})`,
    payoutHint: (estimate) => `Laissez vide pour estimer ${estimate} à partir du tarif par nuit.`,
    checkIn: "Arrivée",
    checkOut: "Départ",
    notes: "Notes",
    save: "Enregistrer",
    saving: "Enregistrement…",
    delete: "Supprimer",
    deleteConfirm: "Supprimer cette entrée ? Les dates se libèrent à la prochaine synchronisation.",
    datesFrom: (source) =>
      `Les dates sont fournies par ${source} et mises à jour à chaque synchronisation. Modifiez ou annulez la réservation sur la plateforme.`,
  },
  create: {
    title: "Ajouter une réservation ou un blocage",
    property: "Logement",
    type: "Type",
    directBooking: "Réservation directe",
    blockDates: "Bloquer des dates",
    bookingsOnly: "Réservations uniquement.",
    payout: "Versement",
    payoutHint: "Réservations uniquement. Vide : le tarif par nuit s’applique.",
    submit: "Ajouter au calendrier",
    adding: "Ajout…",
    note: "Airbnb et Booking.com ferment ces dates à leur prochaine lecture de votre lien d’export.",
  },
};

export const calendar = { en, fr };
