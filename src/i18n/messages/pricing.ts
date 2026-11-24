/** The Pricing page: nightly prices per platform, what each leaves the host, and suggestions. */
const en = {
  title: "Pricing",
  description: "Your nightly prices on Airbnb and Booking.com, side by side, and the nights worth adjusting.",
  noProperty: { title: "No properties yet", body: "Add a property to compare its prices." },
  property: "Property",
  plan: "Booking.com rate",
  period: "Period",
  months: (n: number) => `${n} months`,
  read: {
    label: "Read prices from the platforms",
    from: "Read prices from",
    calendar: (platform: string) => `${platform} calendar`,
    hint: "Opens your calendar. The Innkeep extension reads the prices on screen; scroll or move forward to cover more nights.",
    covered: (platform: string, nights: number, until: string, ago: string) =>
      `${platform}: ${nights} nights ahead, up to ${until}, read ${ago}.`,
    never: (platform: string) => `${platform}: not read yet.`,
  },
  empty: {
    title: "No prices yet",
    body: "Innkeep reads nightly prices from your own calendars on Airbnb and Booking.com, through the browser extension.",
    steps: [
      "Reload the extension at chrome://extensions so it is version 0.6 or later.",
      "Open each calendar with the buttons above.",
      "On Airbnb, scroll down through the months you want. On Booking.com, move the calendar forward.",
    ],
    noLinks:
      "Innkeep does not know this listing's id on the platforms yet. Update your reservations first, then come back.",
  },
  tiles: {
    average: (platform: string) => `Average price on ${platform}`,
    freeNights: (n: number) => `per night, over ${n} free night${n === 1 ? "" : "s"}`,
    noPrices: "No price read yet",
    toAdjust: "Nights to adjust",
    toAdjustHint: (amount: string): string => `About ${amount} more for you if Booking.com matched Airbnb`,
    aligned: "Both platforms leave you the same",
  },
  chart: {
    title: "Price per night",
    subtitle: (months: number): string => `The next ${months} months. Grey nights are already taken.`,
    label: "Nightly price on each platform. Use the arrow keys to move from night to night.",
    explore: "Point at a night, or touch it, to see its prices.",
    noPrice: "no price",
  },
  todo: {
    title: "Prices to adjust",
    subtitle:
      "Only the free nights where something is worth changing. You change the prices yourself on each platform.",
    none: "Nothing to adjust: your prices are consistent on the free nights read so far.",
    more: (n: number): string => `And ${n} more in the full list below.`,
    when: "Nights",
    what: "What to do",
  },
  details: {
    nights: "Every night, one by one",
    notes: "How these numbers are worked out",
  },
  table: {
    night: "Night",
    gap: "Booking.com vs Airbnb, after fees",
    suggestion: "Suggestion",
    noPrice: "No price read",
    taken: {
      airbnb: "Booked on Airbnb",
      booking: "Booked on Booking.com",
      direct: "Direct booking",
      blocked: "Blocked",
    },
    /** "20 Nov to 22 Jan" */
    range: (from: string, to: string) => `${from} to ${to}`,
  },
  suggestion: {
    raise: (target: string) => `Raise Booking.com to ${target}`,
    raiseWhy: (kept: string) => `to keep ${kept}, the same as on Airbnb`,
    lower: (target: string) => `Lower Booking.com to ${target}`,
    lowerWhy: "it is dearer than Airbnb for the same night and will sell less",
    lastMinute: (percent: string) => `Still free within a week: try ${percent} off`,
    orphan: (n: number) =>
      `${n === 1 ? "A single night" : "Two nights"} between bookings: lower the minimum stay or the price`,
    belowHistory: (earned: string) => `Priced well under the ${earned} a night this month earned before`,
  },
  guest: {
    title: "What a guest really pays",
    subtitle:
      "For a few 3-night stays: the total of your calendar prices, next to the total a guest is asked once platform fees, your cleaning fee and discounts are counted.",
    stay: "Stay of 3 nights",
    nightly: "Your Airbnb calendar, 3 nights",
    /** Under a total: "€61 a night". */
    perNight: (amount: string): string => `${amount} a night`,
    shown: (platform: string) => `Guest pays on ${platform}`,
    difference: "Booking.com vs Airbnb",
    check: (platform: string) => `Check ${platform}`,
    hint: "Opens your public listing for these dates. The extension reads the total and closes the tab.",
    noBookingLink:
      "To check Booking.com, paste your public Booking.com page address in the listing page URL field of the property.",
    notChecked: "Not checked yet",
    was: (original: string) => `before discount: ${original}`,
    read: (ago: string) => `read ${ago}`,
    none: "No free stretch of three priced nights in this period. Read more of your Airbnb calendar first.",
  },
  notes: {
    fees: (airbnb: string, booking: string, measured: boolean) =>
      `"You keep" removes each platform's cut: ${airbnb} on Airbnb (the usual host fee; yours may differ) and ${booking} on Booking.com (${measured ? "measured on your own bookings" : "the usual commission; send your reservations to measure yours"}).`,
    market:
      "Innkeep has no market data of its own and does not look at other hosts' listings. Its reference is the price Airbnb shows for each night.",
    smart:
      "Your Airbnb prices change from night to night, which is what Smart Pricing does: Airbnb sets them from demand and similar listings. Bringing Booking.com in line carries that signal over.",
    flat: "Your Airbnb prices barely change from night to night. Turning on Smart Pricing in Airbnb's calendar settings makes them follow demand and similar listings, which is then the reference used here.",
    history:
      "Past earnings per night come from your finished stays and include cleaning fees, so they run a little above the nightly price.",
    rules: "Suggestions are rules of thumb. You change prices on each platform yourself.",
  },
};

const fr: typeof en = {
  title: "Tarifs",
  description: "Vos prix par nuit sur Airbnb et Booking.com, côte à côte, et les nuits à ajuster.",
  noProperty: { title: "Aucun logement", body: "Ajoutez un logement pour comparer ses tarifs." },
  property: "Logement",
  plan: "Tarif Booking.com",
  period: "Période",
  months: (n) => `${n} mois`,
  read: {
    label: "Lire les tarifs sur les plateformes",
    from: "Lire les tarifs depuis",
    calendar: (platform) => `Calendrier ${platform}`,
    hint: "Ouvre votre calendrier. L’extension Innkeep lit les prix affichés ; faites défiler ou avancez pour couvrir plus de nuits.",
    covered: (platform, nights, until, ago) =>
      `${platform} : ${nights} nuits à venir, jusqu’au ${until}, lu ${ago}.`,
    never: (platform) => `${platform} : pas encore lu.`,
  },
  empty: {
    title: "Aucun tarif pour l’instant",
    body: "Innkeep lit les prix par nuit dans vos propres calendriers Airbnb et Booking.com, grâce à l’extension de navigateur.",
    steps: [
      "Rechargez l’extension dans chrome://extensions pour passer en version 0.6 ou plus.",
      "Ouvrez chaque calendrier avec les boutons ci-dessus.",
      "Sur Airbnb, faites défiler les mois voulus. Sur Booking.com, avancez dans le calendrier.",
    ],
    noLinks:
      "Innkeep ne connaît pas encore l’identifiant de cette annonce sur les plateformes. Mettez d’abord à jour vos réservations, puis revenez.",
  },
  tiles: {
    average: (platform) => `Prix moyen sur ${platform}`,
    freeNights: (n) => `par nuit, sur ${n} nuit${n > 1 ? "s" : ""} libre${n > 1 ? "s" : ""}`,
    noPrices: "Aucun prix lu pour l’instant",
    toAdjust: "Nuits à ajuster",
    toAdjustHint: (amount) => `Environ ${amount} de plus pour vous si Booking.com était aligné sur Airbnb`,
    aligned: "Les deux plateformes vous laissent autant",
  },
  chart: {
    title: "Prix par nuit",
    subtitle: (months) => `Les ${months} prochains mois. Les nuits grisées sont déjà prises.`,
    label: "Prix par nuit sur chaque plateforme. Utilisez les flèches pour passer d’une nuit à l’autre.",
    explore: "Survolez ou touchez une nuit pour voir ses prix.",
    noPrice: "pas de prix",
  },
  todo: {
    title: "Prix à ajuster",
    subtitle:
      "Seulement les nuits libres où un changement vaut la peine. Vous modifiez les prix vous-même sur chaque plateforme.",
    none: "Rien à ajuster : vos prix sont cohérents sur les nuits libres lues jusqu’ici.",
    more: (n) => `Et ${n} de plus dans la liste complète ci-dessous.`,
    when: "Nuits",
    what: "Que faire",
  },
  details: {
    nights: "Toutes les nuits, une par une",
    notes: "Comment ces chiffres sont calculés",
  },
  table: {
    night: "Nuit",
    gap: "Booking.com par rapport à Airbnb, frais déduits",
    suggestion: "Suggestion",
    noPrice: "Aucun prix lu",
    taken: {
      airbnb: "Réservé sur Airbnb",
      booking: "Réservé sur Booking.com",
      direct: "Réservation directe",
      blocked: "Bloqué",
    },
    range: (from, to) => `${from} au ${to}`,
  },
  suggestion: {
    raise: (target) => `Montez Booking.com à ${target}`,
    raiseWhy: (kept) => `pour garder ${kept}, comme sur Airbnb`,
    lower: (target) => `Baissez Booking.com à ${target}`,
    lowerWhy: "il est plus cher qu’Airbnb pour la même nuit et se vendra moins",
    lastMinute: (percent) => `Encore libre à moins d’une semaine : essayez ${percent} de remise`,
    orphan: (n) =>
      `${n === 1 ? "Une nuit isolée" : "Deux nuits"} entre deux réservations : baissez le séjour minimum ou le prix`,
    belowHistory: (earned) => `Bien en dessous des ${earned} par nuit que ce mois a déjà rapportés`,
  },
  guest: {
    title: "Ce que paie réellement un voyageur",
    subtitle:
      "Pour quelques séjours de 3 nuits : le total des prix de votre calendrier, à côté du total demandé au voyageur une fois comptés les frais de la plateforme, vos frais de ménage et les remises.",
    stay: "Séjour de 3 nuits",
    nightly: "Votre calendrier Airbnb, 3 nuits",
    perNight: (amount) => `soit ${amount} par nuit`,
    shown: (platform) => `Le voyageur paie sur ${platform}`,
    difference: "Booking.com par rapport à Airbnb",
    check: (platform) => `Vérifier ${platform}`,
    hint: "Ouvre votre annonce publique pour ces dates. L’extension lit le total puis ferme l’onglet.",
    noBookingLink:
      "Pour vérifier Booking.com, collez l’adresse de votre page Booking.com publique dans le champ URL de l’annonce, sur la page du logement.",
    notChecked: "Pas encore vérifié",
    was: (original) => `avant remise : ${original}`,
    read: (ago) => `lu ${ago}`,
    none: "Aucune période libre de trois nuits avec un prix sur cette durée. Lisez d’abord davantage votre calendrier Airbnb.",
  },
  notes: {
    fees: (airbnb, booking, measured) =>
      `« Vous gardez » retire la part de chaque plateforme : ${airbnb} sur Airbnb (frais d’hôte habituels ; les vôtres peuvent différer) et ${booking} sur Booking.com (${measured ? "mesurée sur vos propres réservations" : "commission habituelle ; envoyez vos réservations pour mesurer la vôtre"}).`,
    market:
      "Innkeep n’a aucune donnée de marché propre et ne regarde pas les annonces des autres hôtes. Sa référence est le prix qu’Airbnb affiche pour chaque nuit.",
    smart:
      "Vos prix Airbnb changent d’une nuit à l’autre : c’est le fonctionnement de la tarification intelligente, où Airbnb les fixe selon la demande et les logements similaires. Aligner Booking.com dessus reprend ce signal.",
    flat: "Vos prix Airbnb changent très peu d’une nuit à l’autre. Activer la tarification intelligente dans les paramètres du calendrier Airbnb les fait suivre la demande et les logements similaires ; c’est alors la référence utilisée ici.",
    history:
      "Les gains passés par nuit viennent de vos séjours terminés et incluent les frais de ménage : ils sont donc un peu au-dessus du prix par nuit.",
    rules:
      "Les suggestions sont des règles empiriques. Vous modifiez les prix vous-même sur chaque plateforme.",
  },
};

export const pricing = { en, fr };
