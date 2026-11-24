/** The Reviews page: what guests wrote on each platform, their ratings and the host's replies. */
const en = {
  title: "Reviews",
  description: "What guests wrote about your place on each platform, with your replies.",
  read: {
    label: "Read reviews from the platforms",
    from: "Read reviews from",
    hint: "Opens your public listing on its reviews. The extension reads them; on Booking.com, go through the pages of the list.",
    readAt: (platform: string, ago: string) => `${platform}: read ${ago}.`,
    never: (platform: string) => `${platform}: not read yet.`,
  },
  empty: {
    title: "No reviews yet",
    body: "Press a button above: your public listing opens on its reviews, the extension reads them and they appear here.",
    noProperty: "Add a property first.",
    noLinks:
      "Innkeep does not know your public pages yet. Update your reservations, and paste your Booking.com page address on the property.",
    noExtension: "Connect the browser extension first.",
  },
  stats: {
    average: (value: string, scale: number) => `${value} out of ${scale}`,
    reviews: (n: number) => `${n} review${n === 1 ? "" : "s"}`,
    unanswered: (n: number) => `${n} without a reply`,
    low: (n: number) => `${n} lower rating${n === 1 ? "" : "s"}`,
    none: "None read yet",
  },
  filters: {
    label: "Show",
    all: "All",
    unanswered: "Without a reply",
    low: "Lower ratings",
    platform: "Platform",
    both: "Both",
    stars: "Stars",
    anyStars: "Any",
    /** Read aloud for the "4 ★" choice. */
    starsLabel: (n: number): string => `${n} star${n === 1 ? "" : "s"}`,
  },
  count: (shown: number, total: number) =>
    shown === total ? `${total} review${total === 1 ? "" : "s"}` : `${shown} of ${total} reviews`,
  nothing: "No review matches these filters.",
  card: {
    rating: (value: string, scale: number) => `${value} out of ${scale}`,
    noRating: "No rating",
    liked: "Liked",
    disliked: "Disliked",
    reply: "Your reply",
    noReply: "No reply yet",
    replyOn: (platform: string) => `See it on ${platform}`,
  },
  note: "Reviews are read from your public listing pages. Replies are written on each platform; Innkeep cannot post them. Reviewer names are the ones shown publicly and are never sent to Claude.",
};

const fr: typeof en = {
  title: "Avis",
  description: "Ce que les voyageurs ont écrit sur votre logement sur chaque plateforme, avec vos réponses.",
  read: {
    label: "Lire les avis sur les plateformes",
    from: "Lire les avis depuis",
    hint: "Ouvre votre annonce publique sur ses avis. L’extension les lit ; sur Booking.com, parcourez les pages de la liste.",
    readAt: (platform, ago) => `${platform} : lu ${ago}.`,
    never: (platform) => `${platform} : pas encore lu.`,
  },
  empty: {
    title: "Aucun avis pour l’instant",
    body: "Appuyez sur un bouton ci-dessus : votre annonce publique s’ouvre sur ses avis, l’extension les lit et ils apparaissent ici.",
    noProperty: "Ajoutez d’abord un logement.",
    noLinks:
      "Innkeep ne connaît pas encore vos pages publiques. Mettez à jour vos réservations, et collez l’adresse de votre page Booking.com sur le logement.",
    noExtension: "Connectez d’abord l’extension de navigateur.",
  },
  stats: {
    average: (value, scale) => `${value} sur ${scale}`,
    reviews: (n) => `${n} avis`,
    unanswered: (n) => `${n} sans réponse`,
    low: (n) => `${n} note${n > 1 ? "s" : ""} plus basse${n > 1 ? "s" : ""}`,
    none: "Aucun avis lu",
  },
  filters: {
    label: "Afficher",
    all: "Tous",
    unanswered: "Sans réponse",
    low: "Notes plus basses",
    platform: "Plateforme",
    both: "Les deux",
    stars: "Étoiles",
    anyStars: "Toutes",
    starsLabel: (n) => `${n} étoile${n > 1 ? "s" : ""}`,
  },
  count: (shown, total) => (shown === total ? `${total} avis` : `${shown} avis sur ${total}`),
  nothing: "Aucun avis ne correspond à ces filtres.",
  card: {
    rating: (value, scale) => `${value} sur ${scale}`,
    noRating: "Sans note",
    liked: "A aimé",
    disliked: "N’a pas aimé",
    reply: "Votre réponse",
    noReply: "Pas encore de réponse",
    replyOn: (platform) => `Voir sur ${platform}`,
  },
  note: "Les avis sont lus sur vos pages d’annonce publiques. Les réponses s’écrivent sur chaque plateforme ; Innkeep ne peut pas les publier. Les noms sont ceux affichés publiquement et ne sont jamais envoyés à Claude.",
};

export const reviews = { en, fr };
