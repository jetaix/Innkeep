/** The Revenue page: the month chart and table, the month's costs, and the charges list and form. */
const en = {
  title: "Revenue",
  description: "What your bookings should pay out, month by month, after the costs you enter.",
  empty: {
    title: "No properties yet",
    body: "Add a property to start estimating revenue.",
  },
  months: {
    title: "Net revenue by month",
    /** "November 2026: €1,200 revenue, €300 costs, of which €400 is estimated from nightly rates." */
    summary: (month: string, revenue: string, costs: string, estimated: string | null) =>
      `${month}: ${revenue} revenue, ${costs} costs${
        estimated ? `, of which ${estimated} is estimated from nightly rates` : ""
      }.`,
    /** A month name standing on its own: a table row, a chart label. */
    label: (month: string) => month,
    /** Read aloud for one bar of the chart. */
    bar: (month: string, net: string, revenue: string, costs: string) =>
      `${month}: net ${net}, from ${revenue} revenue and ${costs} costs`,
    /** Follows the net figure, written large: "€1,871 is what November 2026 leaves: …". */
    leaves: (period: string, revenue: string, costs: string, estimated: string | null): string =>
      `is what ${period} leaves: ${revenue} of revenue minus ${costs} of costs${
        estimated ? `. ${estimated} of that revenue is estimated from nightly rates` : ""
      }.`,
    /** Legend of the chart. */
    upcoming: "Not over yet",
    loss: "Costs revenue did not cover",
    /** Under the name of the month we are in. */
    now: "this month",
    month: "Month",
    revenue: "Revenue",
    costs: "Costs",
    net: "Net",
    nights: "Nights",
    occupancy: "Occupancy",
  },
  view: { label: "View", months: "By month", years: "By year" },
  years: {
    title: "Net revenue by year",
    /** "2026: €12,000 revenue, €3,000 costs, of which €400 is estimated from nightly rates." */
    summary: (year: string, revenue: string, costs: string, estimated: string | null): string =>
      `${year}: ${revenue} revenue, ${costs} costs${
        estimated ? `, of which ${estimated} is estimated from nightly rates` : ""
      }.`,
    year: "Year",
    stays: "Stays",
    inProgress: "so far and booked",
  },
  costsIn: (month: string) => `Costs in ${month}`,
  charges: {
    title: "Charges, fees and subscriptions",
    hint: "Entered once, applied to every month they cover.",
    empty: "No costs yet, so net equals revenue. Start with cleaning per stay and the platform commission.",
    allProperties: "All properties",
    /** "Airbnb only" */
    only: (source: string) => `${source} only`,
    until: (date: string) => `until ${date}`,
    remove: "Remove",
    confirmRemove: (label: string) => `Remove "${label}"? Past and future months are recalculated.`,
  },
  /** Keyed by the stored value. */
  frequency: {
    once: "One-off",
    monthly: "Every month",
    yearly: "Every year",
    per_stay: "Per stay",
    per_night: "Per night",
    percent: "% of payout",
  },
  /** Keyed by the stored value. */
  category: {
    cleaning: "Cleaning",
    commission: "Commission",
    utilities: "Utilities",
    subscription: "Subscription",
    maintenance: "Maintenance",
    tax: "Tax",
    other: "Other",
  },
  form: {
    title: "Add a charge",
    name: "Name",
    namePlaceholder: "Cleaning, Wi-Fi, insurance…",
    frequency: "How it is charged",
    amount: "Amount",
    amountHint: "For % of payout, 15 means 15%.",
    category: "Category",
    appliesTo: "Bookings from",
    everyChannel: "Every channel",
    property: "Property",
    startsOn: "Starts on (or bill date)",
    endsOn: "Ends on (optional)",
    submit: "Add charge",
    submitting: "Adding…",
  },
};

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const fr: typeof en = {
  title: "Revenus",
  description:
    "Ce que vos réservations devraient rapporter, mois par mois, après les charges que vous saisissez.",
  empty: {
    title: "Aucun logement pour l’instant",
    body: "Ajoutez un logement pour commencer à estimer vos revenus.",
  },
  months: {
    title: "Revenus nets par mois",
    summary: (month, revenue, costs, estimated) =>
      `${capitalise(month)} : ${revenue} de revenus, ${costs} de charges${
        estimated ? `, dont ${estimated} estimés à partir des tarifs par nuit` : ""
      }.`,
    label: capitalise,
    bar: (month, net, revenue, costs) =>
      `${capitalise(month)} : ${net} net, pour ${revenue} de revenus et ${costs} de charges`,
    leaves: (period, revenue, costs, estimated) =>
      `c’est ce que laisse ${period} : ${revenue} de revenus moins ${costs} de charges${
        estimated ? `. ${estimated} de ces revenus sont estimés d’après les tarifs par nuit` : ""
      }.`,
    upcoming: "Pas encore terminé",
    loss: "Charges que les revenus n’ont pas couvertes",
    now: "ce mois-ci",
    month: "Mois",
    revenue: "Revenus",
    costs: "Charges",
    net: "Net",
    nights: "Nuits",
    occupancy: "Taux d’occupation",
  },
  view: { label: "Vue", months: "Par mois", years: "Par an" },
  years: {
    title: "Revenu net par an",
    summary: (year, revenue, costs, estimated) =>
      `${year} : ${revenue} de revenus, ${costs} de coûts${
        estimated ? `, dont ${estimated} estimés d’après le prix par nuit` : ""
      }.`,
    year: "Année",
    stays: "Séjours",
    inProgress: "réalisé et réservé à ce jour",
  },
  costsIn: (month) => `Charges de ${month}`,
  charges: {
    title: "Charges, frais et abonnements",
    hint: "Saisis une seule fois, appliqués à chaque mois concerné.",
    empty:
      "Aucune charge pour l’instant : le net est donc égal aux revenus. Commencez par le ménage par séjour et la commission de la plateforme.",
    allProperties: "Tous les logements",
    only: (source) => `${source} uniquement`,
    until: (date) => `jusqu’au ${date}`,
    remove: "Supprimer",
    confirmRemove: (label) => `Supprimer « ${label} » ? Les mois passés et à venir sont recalculés.`,
  },
  frequency: {
    once: "Ponctuel",
    monthly: "Chaque mois",
    yearly: "Chaque année",
    per_stay: "Par séjour",
    per_night: "Par nuit",
    percent: "% du versement",
  },
  category: {
    cleaning: "Ménage",
    commission: "Commission",
    utilities: "Eau et énergie",
    subscription: "Abonnement",
    maintenance: "Entretien",
    tax: "Taxes",
    other: "Autre",
  },
  form: {
    title: "Ajouter une charge",
    name: "Nom",
    namePlaceholder: "Ménage, Wi-Fi, assurance…",
    frequency: "Mode de facturation",
    amount: "Montant",
    amountHint: "Pour un % du versement, 15 signifie 15 %.",
    category: "Catégorie",
    appliesTo: "Réservations venant de",
    everyChannel: "Toutes les plateformes",
    property: "Logement",
    startsOn: "Début (ou date de facture)",
    endsOn: "Fin (facultatif)",
    submit: "Ajouter la charge",
    submitting: "Ajout…",
  },
};

export const revenue = { en, fr };
