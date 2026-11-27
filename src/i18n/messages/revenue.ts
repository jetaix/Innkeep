/** The Revenue page: the month chart and table, the month's costs, and the charges list and form. */
const en = {
  title: "Revenue",
  description: "What your bookings should pay out, month by month, after the costs you enter.",
  empty: {
    title: "No properties yet",
    body: "Add a property to start estimating revenue.",
  },
  profit: {
    title: "Is it profitable?",
    yes: "Profitable",
    no: "At a loss",
    /** Follows the figure, written large: "+€312 a month is what it leaves you…". */
    leaves: "a month is what it leaves you",
    costs: "a month is what it costs you",
    /** "On average over the last 8 months, loan and charges included." */
    over: (months: number): string =>
      months === 1
        ? "This month so far, loan and charges included."
        : `On average over the last ${months} months, loan and charges included.`,
    income: "Income",
    charges: "Charges",
    loan: "Loan",
    left: "Left for you",
    short: "You are short by",
    /** A property with no stay recorded yet. */
    unknown: "No stay recorded yet",
    unknownBody:
      "Once a first reservation is in, this says whether the rent covers the charges and the loan.",
    /** Read aloud for the bars: "Income €1,450, charges €320, loan €906". */
    bars: (income: string, charges: string, loan: string): string =>
      `Income ${income}, charges ${charges}, loan ${loan}`,
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
    loss: "Costs above revenue",
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
    loan: "Loan",
  },
  loans: {
    title: "Loans",
    hint: "The monthly payment counts as a cost until the last one.",
    empty: "No loan entered. Add a mortgage or a works loan to see what is left after repaying it.",
    /** Under the name: "€200,000 at 3.85% over 20 years". */
    terms: (amount: string, rate: string, duration: string): string =>
      `${amount} at ${rate} over ${duration}`,
    /** "20 years", "12 years and 6 months", "8 months". */
    duration: (months: number): string => {
      const years = Math.floor(months / 12);
      const rest = months % 12;
      const y = years > 0 ? `${years} year${years === 1 ? "" : "s"}` : "";
      const m = rest > 0 ? `${rest} month${rest === 1 ? "" : "s"}` : "";
      return y && m ? `${y} and ${m}` : y || m;
    },
    perMonth: (amount: string): string => `${amount} a month`,
    insurance: (amount: string): string => `of which ${amount} insurance`,
    remaining: "Still owed",
    paid: "Payments made",
    /** "11 of 240" */
    paidOf: (paid: number, total: number): string => `${paid} of ${total}`,
    thisMonth: "This month’s payment",
    split: (interest: string, capital: string): string => `${interest} interest, ${capital} capital`,
    lastPayment: "Last payment",
    cost: "Cost of the loan",
    costNote: "interest and insurance over its whole life",
    notStarted: (date: string): string => `First payment on ${date}`,
    finished: "Repaid",
    progress: "Share of the capital repaid",
    remove: "Remove",
    confirmRemove: (label: string): string => `Remove "${label}"? Past and future months are recalculated.`,
    table: {
      /** The bank's amortisation table, in place of the computed payments. */
      import: "Import the amortisation table",
      replace: "Replace the table",
      /** "Bank's table: 240 payments, 5 Jan 2026 to 5 Dec 2045" */
      imported: (count: number, from: string, to: string): string =>
        `Bank’s table: ${count} payment${count === 1 ? "" : "s"}, ${from} to ${to}`,
      why: "With the bank’s own table, each month costs exactly what the bank takes: a deferred start, insurance that changes, a renegotiated rate.",
      label: "The table’s lines",
      placeholder: "05/01/2026   1 196,21   641,67   554,54   30,00   199 445,46",
      hint: "Choose the bank’s PDF below, or paste the lines here. Each line needs its date, the interest and the capital; the insurance and what is still owed are read when they are there. The order of the columns does not matter.",
      file: "The bank’s file (PDF, CSV or text)",
      submit: "Import",
      submitting: "Reading…",
      cancel: "Cancel",
      clear: "Go back to computed payments",
      confirmClear: (label: string): string =>
        `Remove the bank’s table of "${label}"? Its payments are computed again from the amount, the rate and the duration.`,
      /** Keyed by what the server could not do. */
      problem: {
        empty: "No line with a date was found. Paste the lines of the table, one payment per line.",
        file: "This file could not be read. Open it, copy the lines of the table and paste them above.",
        columns:
          "The columns could not be told apart. Each line needs at least the interest and the capital, as two separate amounts.",
      },
    },
    form: {
      title: "Add a loan",
      name: "Name",
      namePlaceholder: "Mortgage, works loan…",
      principal: "Amount borrowed",
      rate: "Rate (% a year)",
      rateHint: "Without insurance. 3.85 means 3.85%.",
      years: "Duration (years)",
      yearsHint: "12.5 for 150 months.",
      insurance: "Insurance a month (optional)",
      startsOn: "First payment",
      property: "Property",
      submit: "Add loan",
      submitting: "Adding…",
    },
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
  profit: {
    title: "Est-il rentable ?",
    yes: "Rentable",
    no: "À perte",
    leaves: "par mois, c’est ce qu’il vous laisse",
    costs: "par mois, c’est ce qu’il vous coûte",
    over: (months) =>
      months === 1
        ? "Ce mois-ci à ce jour, crédit et charges compris."
        : `En moyenne sur les ${months} derniers mois, crédit et charges compris.`,
    income: "Revenus",
    charges: "Charges",
    loan: "Crédit",
    left: "Il vous reste",
    short: "Il vous manque",
    unknown: "Aucun séjour enregistré pour l’instant",
    unknownBody:
      "Dès la première réservation, vous saurez ici si les loyers couvrent les charges et le crédit.",
    bars: (income, charges, loan) => `Revenus ${income}, charges ${charges}, crédit ${loan}`,
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
    loss: "Charges supérieures aux revenus",
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
    loan: "Crédit",
  },
  loans: {
    title: "Crédits",
    hint: "La mensualité compte comme une charge jusqu’à la dernière échéance.",
    empty:
      "Aucun crédit saisi. Ajoutez un prêt immobilier ou un prêt travaux pour voir ce qu’il reste une fois la mensualité payée.",
    terms: (amount, rate, duration) => `${amount} à ${rate} sur ${duration}`,
    duration: (months) => {
      const years = Math.floor(months / 12);
      const rest = months % 12;
      const y = years > 0 ? `${years} an${years > 1 ? "s" : ""}` : "";
      const m = rest > 0 ? `${rest} mois` : "";
      return y && m ? `${y} et ${m}` : y || m;
    },
    perMonth: (amount) => `${amount} par mois`,
    insurance: (amount) => `dont ${amount} d’assurance`,
    remaining: "Reste à rembourser",
    paid: "Échéances payées",
    paidOf: (paid, total) => `${paid} sur ${total}`,
    thisMonth: "Mensualité de ce mois",
    split: (interest, capital) => `${interest} d’intérêts, ${capital} de capital`,
    lastPayment: "Dernière échéance",
    cost: "Coût du crédit",
    costNote: "intérêts et assurance sur toute la durée",
    notStarted: (date) => `Première échéance le ${date}`,
    finished: "Remboursé",
    progress: "Part du capital remboursée",
    remove: "Supprimer",
    confirmRemove: (label) => `Supprimer « ${label} » ? Les mois passés et à venir sont recalculés.`,
    table: {
      import: "Importer le tableau d’amortissement",
      replace: "Remplacer le tableau",
      imported: (count, from, to) =>
        `Tableau de la banque : ${count} échéance${count > 1 ? "s" : ""}, du ${from} au ${to}`,
      why: "Avec le tableau de la banque, chaque mois coûte exactement ce que la banque prélève : différé, assurance qui évolue, taux renégocié.",
      label: "Les lignes du tableau",
      placeholder: "05/01/2026   1 196,21   641,67   554,54   30,00   199 445,46",
      hint: "Choisissez le PDF de la banque ci-dessous, ou collez les lignes ici. Chaque ligne doit contenir sa date, les intérêts et le capital ; l’assurance et le capital restant dû sont lus s’ils y figurent. L’ordre des colonnes n’a pas d’importance.",
      file: "Le fichier de la banque (PDF, CSV ou texte)",
      submit: "Importer",
      submitting: "Lecture…",
      cancel: "Annuler",
      clear: "Revenir aux échéances calculées",
      confirmClear: (label) =>
        `Retirer le tableau de la banque de « ${label} » ? Ses échéances sont de nouveau calculées à partir du montant, du taux et de la durée.`,
      problem: {
        empty: "Aucune ligne datée n’a été trouvée. Collez les lignes du tableau, une échéance par ligne.",
        file: "Ce fichier n’a pas pu être lu. Ouvrez-le, copiez les lignes du tableau et collez-les ci-dessus.",
        columns:
          "Les colonnes n’ont pas pu être distinguées. Chaque ligne doit contenir au moins les intérêts et le capital, en deux montants séparés.",
      },
    },
    form: {
      title: "Ajouter un crédit",
      name: "Nom",
      namePlaceholder: "Prêt immobilier, prêt travaux…",
      principal: "Montant emprunté",
      rate: "Taux (% par an)",
      rateHint: "Hors assurance. 3,85 signifie 3,85 %.",
      years: "Durée (années)",
      yearsHint: "12,5 pour 150 mois.",
      insurance: "Assurance par mois (facultatif)",
      startsOn: "Première échéance",
      property: "Logement",
      submit: "Ajouter le crédit",
      submitting: "Ajout…",
    },
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
