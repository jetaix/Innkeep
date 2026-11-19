/** The browser extension: its setup guide, the corner button that leads to it and the "update your reservations" prompt. */
const en = {
  title: "Browser extension",
  description:
    "Calendar links only carry dates. The extension reads guest names, payouts, past stays and listing details from your own Airbnb and Booking.com pages.",
  connected: {
    badge: "Connected",
    detail: (version: string, ago: string) => `Version ${version}, last heard from ${ago}.`,
  },
  /** Followed by `chrome://extensions`, then `after`. */
  outdated: {
    before: (version: string | null, required: string) =>
      `Your extension is ${version ? `version ${version}` : "an older version"}; Innkeep now needs ${required} to store statuses, booking dates and cancelled stays. Open`,
    after:
      ", press the reload arrow on Innkeep Companion, then open your reservations pages again (last step below).",
  },
  setup: {
    title: "Set it up",
    subtitle: "Chrome, Edge, Brave or Arc. About two minutes, once.",
    copyAddress: "Copy address",
    copyPath: "Copy path",
    copyToken: "Copy token",
    /** "Add a line `EXTENSION_TOKEN=` followed by a long random string to `.env.local`, then restart…" */
    switchOn: {
      title: "Switch it on in Innkeep",
      before: "Add a line",
      middle: "followed by a long random string to",
      after: ", then restart Innkeep. The token is the password the extension uses to reach this app.",
    },
    openPage: {
      title: "Open the extensions page of your browser",
      before: "Browsers do not let a web page link to it, so paste this address in a new tab. Then turn on",
      strong: "Developer mode",
      after: "(top right).",
    },
    load: {
      title: "Load the extension",
      before: "Click",
      strong: "Load unpacked",
      after: "and choose this folder.",
    },
    connect: {
      title: "Connect it to this Innkeep",
      before:
        "Click the Innkeep Companion icon in the toolbar (under the puzzle piece), paste the address and the token, then",
      strong: "Save and test",
      after: ".",
      tokenMissing: "The token appears here once it is set.",
    },
    read: {
      title: "Open your reservations pages",
      before:
        "Each button opens your own reservations page. The extension reads what it shows, sends it here and closes the tab. Sign in to the platform first if it asks. On Booking.com, choose",
      strong: "Show 100",
      after: "under the table if you have more than 25 reservations: only the rows on screen are read.",
    },
  },
  reads: {
    title: "What it reads",
    items: [
      "Reservations: guest name, party size, dates, confirmation code, status, date booked and payout. On Booking.com also the price and the commission.",
      "Finished and cancelled stays, so the Revenue page has a past.",
      "Your Airbnb listing: description, address, times, house rules, prices and amenities.",
      "Never phone numbers, messages, door codes or wifi details. It makes no requests to Airbnb or Booking.com and takes no cookies or passwords.",
    ],
    terms:
      "Both platforms restrict automated data collection in their terms. The extension only reads pages you open, but using it on your account is your decision.",
  },
  button: {
    add: "Add the browser extension",
    update: "Update the browser extension",
  },
  prompt: {
    title: "Update your reservations",
    body: "Open each page below. It opens in a new tab, the extension reads your reservations, and the tab closes by itself. Come back here and the line is ticked.",
    /** "Your extension is out of date, so some details will be missing. Reload it first." */
    outdated: {
      before: "Your extension is out of date, so some details will be missing.",
      link: "Reload it first",
      after: ".",
    },
    done: "Done:",
    todo: "To do:",
    /** "Read 5 min ago, 12 stays" */
    read: (ago: string, stays: string) => `Read ${ago}, ${stays}`,
    never: "Never read",
    again: "Read again",
    open: (platform: string) => `Open ${platform}`,
    footnote:
      "Sign in to the platform first if it asks. Nothing happens if you skip this: dates still sync from your calendar links, but new guest names and payouts will be missing.",
    refresh: {
      title: "Your data is more than a day old",
      /** "Last read: Airbnb reservations 2 d ago, Booking.com reservations never." */
      body: (n: number) =>
        `${n} source${n === 1 ? " has" : "s have"} not been read for over a day. The extension can go through your pages for you, in one tab.`,
      everything: "Refresh everything",
      everythingHint: "A few minutes",
      reservations: "Reservations only",
      reservationsHint: "Under a minute",
      what: "What is old:",
      lastRead: (ago: string) => `Read ${ago}`,
      neverRead: "Never read",
      byRun: "Read by “Refresh everything”",
      signIn: "Sign in to Airbnb and Booking.com first.",
    },
  },
  run: {
    title: "Refreshing your data",
    description: "The extension takes this tab through your own Airbnb and Booking.com pages.",
    starting: "Starting…",
    keepOpen:
      "Keep this tab open. It moves from page to page by itself, shows a Stop button on each, and comes back to Innkeep when it is done.",
    stuck: {
      title: "Still on this page after ten seconds?",
      reload: (version: string) =>
        `The extension is missing or older than ${version}. Open chrome://extensions and press the reload arrow on Innkeep Companion, then press the button again.`,
      popup: "Or click the Innkeep Companion icon in the browser's toolbar and choose a button there.",
      guide: "Extension setup",
      data: "Back to Data",
    },
  },
};

const fr: typeof en = {
  title: "Extension de navigateur",
  description:
    "Les liens de calendrier ne contiennent que des dates. L’extension lit les noms des voyageurs, les versements, les séjours passés et les détails des annonces sur vos propres pages Airbnb et Booking.com.",
  connected: {
    badge: "Connectée",
    detail: (version, ago) => `Version ${version}, dernier signe de vie ${ago}.`,
  },
  outdated: {
    before: (version, required) =>
      `Votre extension est ${version ? `en version ${version}` : "dans une ancienne version"} ; Innkeep a désormais besoin de la version ${required} pour enregistrer les statuts, les dates de réservation et les séjours annulés. Ouvrez`,
    after:
      ", cliquez sur la flèche de rechargement d’Innkeep Companion, puis ouvrez à nouveau vos pages de réservations (dernière étape ci-dessous).",
  },
  setup: {
    title: "Installation",
    subtitle: "Chrome, Edge, Brave ou Arc. Environ deux minutes, une seule fois.",
    copyAddress: "Copier l’adresse",
    copyPath: "Copier le chemin",
    copyToken: "Copier le jeton",
    switchOn: {
      title: "Activez-la dans Innkeep",
      before: "Ajoutez une ligne",
      middle: "suivie d’une longue chaîne aléatoire dans",
      after:
        ", puis redémarrez Innkeep. Le jeton est le mot de passe que l’extension utilise pour joindre cette application.",
    },
    openPage: {
      title: "Ouvrez la page des extensions de votre navigateur",
      before:
        "Les navigateurs ne permettent pas à une page web d’y renvoyer : collez donc cette adresse dans un nouvel onglet. Activez ensuite le",
      strong: "Mode développeur",
      after: "(en haut à droite).",
    },
    load: {
      title: "Chargez l’extension",
      before: "Cliquez sur",
      strong: "Charger l’extension non empaquetée",
      after: "et choisissez ce dossier.",
    },
    connect: {
      title: "Connectez-la à cet Innkeep",
      before:
        "Cliquez sur l’icône Innkeep Companion dans la barre d’outils (sous la pièce de puzzle), collez l’adresse et le jeton, puis cliquez sur",
      strong: "Save and test",
      after: ".",
      tokenMissing: "Le jeton apparaît ici une fois défini.",
    },
    read: {
      title: "Ouvrez vos pages de réservations",
      before:
        "Chaque bouton ouvre votre propre page de réservations. L’extension lit ce qui s’y affiche, l’envoie ici et ferme l’onglet. Connectez-vous d’abord à la plateforme si elle le demande. Sur Booking.com, choisissez d’afficher",
      strong: "100 réservations",
      after: "sous le tableau si vous en avez plus de 25 : seules les lignes à l’écran sont lues.",
    },
  },
  reads: {
    title: "Ce qu’elle lit",
    items: [
      "Réservations : nom du voyageur, nombre de personnes, dates, code de confirmation, statut, date de réservation et versement. Sur Booking.com, également le prix et la commission.",
      "Les séjours terminés et annulés, pour que la page Revenus ait un historique.",
      "Votre annonce Airbnb : description, adresse, horaires, règlement intérieur, prix et équipements.",
      "Jamais de numéros de téléphone, de messages, de codes de porte ni d’identifiants wifi. Elle n’envoie aucune requête à Airbnb ou à Booking.com et ne prend ni cookies ni mots de passe.",
    ],
    terms:
      "Les conditions des deux plateformes limitent la collecte automatisée de données. L’extension ne lit que les pages que vous ouvrez, mais l’utiliser sur votre compte relève de votre décision.",
  },
  button: {
    add: "Ajouter l’extension de navigateur",
    update: "Mettre à jour l’extension de navigateur",
  },
  prompt: {
    title: "Mettez à jour vos réservations",
    body: "Ouvrez chaque page ci-dessous. Elle s’ouvre dans un nouvel onglet, l’extension lit vos réservations, puis l’onglet se ferme tout seul. Revenez ici : la ligne est cochée.",
    outdated: {
      before: "Votre extension n’est pas à jour : certains détails manqueront.",
      link: "Rechargez-la d’abord",
      after: ".",
    },
    done: "Fait :",
    todo: "À faire :",
    read: (ago, stays) => `Lu ${ago}, ${stays}`,
    never: "Jamais lu",
    again: "Relire",
    open: (platform) => `Ouvrir ${platform}`,
    footnote:
      "Connectez-vous d’abord à la plateforme si elle le demande. Rien de grave si vous passez cette étape : les dates se synchronisent toujours grâce à vos liens de calendrier, mais les nouveaux noms de voyageurs et les nouveaux versements manqueront.",
    refresh: {
      title: "Vos données ont plus d’un jour",
      body: (n) =>
        `${n} source${n > 1 ? "s n’ont" : " n’a"} pas été lue${n > 1 ? "s" : ""} depuis plus d’un jour. L’extension peut parcourir vos pages pour vous, dans un seul onglet.`,
      everything: "Tout mettre à jour",
      everythingHint: "Quelques minutes",
      reservations: "Réservations seulement",
      reservationsHint: "Moins d’une minute",
      what: "Ce qui a vieilli :",
      lastRead: (ago) => `Lu ${ago}`,
      neverRead: "Jamais lu",
      byRun: "Lu par « Tout mettre à jour »",
      signIn: "Connectez-vous d’abord à Airbnb et à Booking.com.",
    },
  },
  run: {
    title: "Mise à jour de vos données",
    description: "L’extension fait parcourir à cet onglet vos propres pages Airbnb et Booking.com.",
    starting: "Démarrage…",
    keepOpen:
      "Gardez cet onglet ouvert. Il passe de page en page tout seul, affiche un bouton Stop sur chacune, puis revient sur Innkeep une fois terminé.",
    stuck: {
      title: "Toujours sur cette page après dix secondes ?",
      reload: (version) =>
        `L’extension est absente ou antérieure à la version ${version}. Ouvrez chrome://extensions, appuyez sur la flèche de rechargement d’Innkeep Companion, puis appuyez de nouveau sur le bouton.`,
      popup:
        "Ou cliquez sur l’icône Innkeep Companion dans la barre d’outils du navigateur et choisissez un bouton.",
      guide: "Installer l’extension",
      data: "Retour aux Données",
    },
  },
};

export const extension = { en, fr };
