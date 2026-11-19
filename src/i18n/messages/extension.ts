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
    subtitle: "Chrome, Edge, Brave or Arc, on a computer. About five minutes, once.",
    copyAddress: "Copy address",
    copyPath: "Copy path",
    copyToken: "Copy token",
    /** "Add a line `EXTENSION_TOKEN=` followed by a long random string to `.env.local`, then restart…" */
    switchOn: {
      title: "Switch it on in Innkeep",
      before: "Add a line",
      middle: "followed by a long random string to",
      after:
        ", then restart Innkeep. The token is the password the extension uses to reach this app. If you start Innkeep by double-clicking its start file, this is already done.",
    },
    openPage: {
      title: "Open the extensions page of your browser",
      before: "Browsers do not let a web page link to it, so paste this address in a new tab. Then turn on",
      strong: "Developer mode",
      after:
        "(the switch at the top right). It is needed because the extension comes from this folder, not from the Chrome Web Store.",
    },
    load: {
      title: "Load the extension",
      before: "Click",
      strong: "Load unpacked",
      after:
        "(top left) and choose the folder below. On a Mac, press Command + Shift + G in the window that opens and paste the path. A card named Innkeep Companion appears.",
    },
    pin: {
      title: "Keep its icon in view",
      body: "Click the puzzle-piece icon to the right of the address bar, then the pin next to Innkeep Companion. Its icon now stays in the toolbar.",
    },
    connect: {
      title: "Connect it to this Innkeep",
      before: "Click the Innkeep Companion icon, then",
      settings: "Settings",
      middle: "at the bottom of the small window. Paste the address and the token below, then click",
      strong: "Save and test",
      after:
        ". Chrome asks whether the extension may reach that address: allow it. You should read “Connected”.",
      tokenMissing: "The token appears here once it is set.",
    },
    read: {
      title: "Read your data",
      body: "Sign in to Airbnb and to Booking.com in this same browser. Then press the button: one tab goes through your own pages by itself, shows a Stop button on each, and comes back here. The same two buttons are in the Innkeep Companion icon.",
      manual: "Or open one page at a time:",
    },
  },
  after: {
    title: "Later on",
    items: [
      "After updating Innkeep: open the extensions page again and press the round arrow on the Innkeep Companion card, then refresh any Airbnb or Booking.com tab that was already open.",
      "Chrome may show “Disable developer mode extensions” when it starts. Close that message; choosing to disable would switch Innkeep Companion off.",
      "If the corner button of Innkeep says “Update the browser extension”, do the first point above.",
      "To remove it: on the extensions page, click Remove on the Innkeep Companion card. Nothing stays behind.",
    ],
  },
  reads: {
    title: "What it reads",
    items: [
      "Reservations: guest name, party size, dates, confirmation code, status, date booked and payout. On Booking.com also the price and the commission.",
      "Finished and cancelled stays, so the Revenue page has a past.",
      "Nightly prices from both calendars, and what a guest is shown for a stay on your public listings.",
      "Your listing as you set it and as guests see it: description, address, times, house rules, amenities, photos, rating.",
      "Reviews and your replies, from your public listings.",
      "Never phone numbers, messages, door codes, wifi details, or any page about money, invoices, bank details or your account. It calls none of the platforms' APIs and takes no cookies or passwords.",
    ],
    terms:
      "Both platforms restrict automated data collection in their terms. The extension reads your own pages, in your own browser, when you open them or start a run. It never runs in the background. Using it on your account is your decision.",
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
    subtitle: "Chrome, Edge, Brave ou Arc, sur un ordinateur. Environ cinq minutes, une seule fois.",
    copyAddress: "Copier l’adresse",
    copyPath: "Copier le chemin",
    copyToken: "Copier le jeton",
    switchOn: {
      title: "Activez-la dans Innkeep",
      before: "Ajoutez une ligne",
      middle: "suivie d’une longue chaîne aléatoire dans",
      after:
        ", puis redémarrez Innkeep. Le jeton est le mot de passe que l’extension utilise pour joindre cette application. Si vous démarrez Innkeep en double-cliquant sur son fichier de démarrage, c’est déjà fait.",
    },
    openPage: {
      title: "Ouvrez la page des extensions de votre navigateur",
      before:
        "Les navigateurs ne permettent pas à une page web d’y renvoyer : collez cette adresse dans un nouvel onglet. Activez ensuite le",
      strong: "Mode développeur",
      after:
        "(l’interrupteur en haut à droite). Il est nécessaire parce que l’extension vient de ce dossier, et non du Chrome Web Store.",
    },
    load: {
      title: "Chargez l’extension",
      before: "Cliquez sur",
      strong: "Charger l’extension non empaquetée",
      after:
        "(en haut à gauche) et choisissez le dossier ci-dessous. Sur Mac, appuyez sur Commande + Maj + G dans la fenêtre qui s’ouvre et collez le chemin. Une carte nommée Innkeep Companion apparaît.",
    },
    pin: {
      title: "Gardez son icône visible",
      body: "Cliquez sur l’icône en forme de pièce de puzzle, à droite de la barre d’adresse, puis sur l’épingle à côté d’Innkeep Companion. Son icône reste alors dans la barre d’outils.",
    },
    connect: {
      title: "Reliez-la à cet Innkeep",
      before: "Cliquez sur l’icône Innkeep Companion, puis sur",
      settings: "Settings",
      middle: "en bas de la petite fenêtre. Collez l’adresse et le jeton ci-dessous, puis cliquez sur",
      strong: "Save and test",
      after:
        ". Chrome demande si l’extension peut accéder à cette adresse : acceptez. Vous devez lire « Connected ».",
      tokenMissing: "Le jeton apparaît ici une fois défini.",
    },
    read: {
      title: "Lisez vos données",
      body: "Connectez-vous à Airbnb et à Booking.com dans ce même navigateur. Appuyez ensuite sur le bouton : un onglet parcourt vos propres pages tout seul, affiche un bouton Stop sur chacune, puis revient ici. Les deux mêmes boutons se trouvent dans l’icône Innkeep Companion.",
      manual: "Ou ouvrez une page à la fois :",
    },
  },
  after: {
    title: "Par la suite",
    items: [
      "Après une mise à jour d’Innkeep : rouvrez la page des extensions et appuyez sur la flèche ronde de la carte Innkeep Companion, puis actualisez les onglets Airbnb ou Booking.com déjà ouverts.",
      "Chrome peut afficher « Désactiver les extensions en mode développeur » au démarrage. Fermez ce message ; choisir de désactiver éteindrait Innkeep Companion.",
      "Si le bouton en bas à droite d’Innkeep indique « Mettre à jour l’extension de navigateur », suivez le premier point ci-dessus.",
      "Pour la retirer : sur la page des extensions, cliquez sur Supprimer sur la carte Innkeep Companion. Rien ne reste derrière.",
    ],
  },
  reads: {
    title: "Ce qu’elle lit",
    items: [
      "Les réservations : nom du voyageur, nombre de personnes, dates, code de confirmation, statut, date de réservation et versement. Sur Booking.com, aussi le prix et la commission.",
      "Les séjours terminés et annulés, pour que la page Revenus ait un historique.",
      "Les prix par nuit des deux calendriers, et ce qu’un voyageur voit pour un séjour sur vos annonces publiques.",
      "Votre annonce telle que vous l’avez réglée et telle que les voyageurs la voient : description, adresse, horaires, règlement, équipements, photos, note.",
      "Les avis et vos réponses, sur vos annonces publiques.",
      "Jamais les numéros de téléphone, les messages, les codes d’accès, le wifi, ni aucune page concernant l’argent, les factures, les coordonnées bancaires ou votre compte. Elle n’appelle aucune API des plateformes et ne prend ni cookie ni mot de passe.",
    ],
    terms:
      "Les conditions des deux plateformes restreignent la collecte automatisée de données. L’extension lit vos propres pages, dans votre navigateur, quand vous les ouvrez ou lancez une tournée. Elle ne tourne jamais en arrière-plan. L’utiliser sur votre compte relève de votre décision.",
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
