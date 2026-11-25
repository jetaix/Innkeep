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
    after: ", press the reload arrow on Innkeep, then open your reservations pages again (last step below).",
  },
  setup: {
    title: "Set it up",
    subtitle: "Chrome, Edge, Brave or Arc, on a computer. About five minutes, once.",
    copyAddress: "Copy address",
    copyPath: "Copy path",
    copyToken: "Copy token",
    /** The download button: "Download the extension (version 0.15.1)". */
    download: (version: string): string => `Download the extension (version ${version})`,
    downloadHint: "A ZIP file. Unzip it and keep the folder: the browser loads the extension from it.",
    /** In the "outdated" notice, before the download button. */
    update:
      "To update: download it again, unzip it in place of the old folder, then press the reload arrow on Innkeep.",
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
        "(top left) and choose the folder below. On a Mac, press Command + Shift + G in the window that opens and paste the path. A card named Innkeep appears.",
      /** When Innkeep runs on a server: the folder comes from the download. */
      afterHosted:
        "(top left) and choose the innkeep-extension folder you get by unzipping the download below. A card named Innkeep appears.",
      elsewhere: "On another computer, download the extension instead:",
    },
    /** In place of the two steps above, once the extension is on the Chrome Web Store. */
    store: {
      title: "Install the extension",
      body: "Press the button: the Chrome Web Store opens in a new tab. Click “Add to Chrome”, then “Add extension”. This works in Chrome, Edge, Brave and Arc.",
      button: "Install from the Chrome Web Store",
    },
    pin: {
      title: "Keep its icon in view",
      body: "Click the puzzle-piece icon to the right of the address bar, then the pin next to Innkeep. Its icon now stays in the toolbar.",
    },
    connect: {
      title: "Connect it to this Innkeep",
      before: "Click the Innkeep icon, then",
      settings: "Settings",
      middle: "at the bottom of the small window. Paste the address and the token below, then click",
      strong: "Save and test",
      after:
        ". Chrome asks whether the extension may reach that address: allow it. You should read “Connected”.",
      tokenMissing: "The token appears here once it is set.",
    },
    read: {
      title: "Read your data",
      body: "Sign in to Airbnb and to Booking.com in this same browser. Then press the button: one tab goes through your own pages by itself, shows a Stop button on each, and comes back here. The same two buttons are in the Innkeep icon.",
      manual: "Or open one page at a time:",
    },
  },
  /** The guide for Safari on a Mac, shown when Innkeep runs from its folder on this computer. */
  safari: {
    title: "Safari on a Mac",
    subtitle: "About twenty minutes, most of it waiting for a download. Once.",
    copyCommand: "Copy command",
    xcode: {
      title: "Install Xcode",
      body: "Xcode is Apple's free tool for making apps. Safari only accepts an extension that comes inside an app, and Xcode makes that app. Open the App Store, search for Xcode and click Get. It is a large download. Then open Xcode once, accept what it asks and wait until it has finished installing. You can close it afterwards.",
    },
    build: {
      title: "Make the app",
      body: "Open Terminal: press Command + Space, type Terminal and press Return. Paste the line below and press Return. After about a minute it ends with a line that names Innkeep.app. Nothing else on your Mac is changed.",
    },
    allow: {
      title: "Let Safari accept it",
      body: "In Safari, click Safari in the menu bar at the top of the screen, then Settings. Open the Advanced tab and tick “Show features for web developers”. A new Developer tab appears: open it and tick “Allow unsigned extensions”. Safari asks for the password of your Mac. Safari forgets this choice each time it quits, so tick the box again after you restart Safari.",
    },
    open: {
      title: "Open the app once",
      body: "In Finder, press Command + Shift + G, paste the path below and press Return. Double-click Innkeep. A small window opens: you can close it. Opening the app once is what shows the extension to Safari.",
    },
    enable: {
      title: "Turn it on",
      body: "Back in Safari's Settings, open the Extensions tab and tick Innkeep in the list on the left. Its icon appears next to the address bar.",
    },
    sites: {
      title: "Allow it on Airbnb and Booking.com",
      body: "Open airbnb.com and sign in. Click the Innkeep icon next to the address bar and choose “Always Allow on This Website”. Do the same on admin.booking.com. Until then Safari keeps the extension away from those pages and nothing is read.",
    },
    /** Ends the "Connect it to this Innkeep" step, in place of the sentence about Chrome. */
    connectAfter:
      ". Safari asks whether the extension may reach that address: allow it. You should read “Connected”.",
    later: "After updating Innkeep, do “Make the app” again, then quit Safari and open it again.",
  },
  /** The guide for Safari on an iPhone or iPad. */
  ios: {
    title: "Safari on an iPhone or iPad",
    subtitle: "Needs a Mac with Xcode and the cable of the phone. About half an hour, once.",
    limits:
      "Tried so far on a phone: connecting to Innkeep and reading your Airbnb reservations page. Booking.com and “Refresh everything” have not been tried there yet.",
    need: {
      title: "Get what you need",
      body: "A Mac with Xcode (see “Install Xcode” in the guide for Safari on a Mac), your iPhone or iPad with its cable, and your Apple account. With a free Apple account the app stops working after seven days: press the ▶ button of step 5 again to renew it.",
    },
    project: {
      title: "Open the project in Xcode",
      body: "In Finder, press Command + Shift + G, paste the path below and press Return. Double-click the file named Innkeep.xcodeproj. Xcode opens.",
    },
    sign: {
      title: "Sign it with your Apple account",
      body: "In the left column of Xcode, click the blue Innkeep line at the very top. In the middle, under Targets, click “Innkeep (iOS)”, then the tab “Signing & Capabilities”. In the Team menu choose “Add an Account…”, sign in, then choose your name. Do the same for the target “Innkeep Extension (iOS)”.",
      taken:
        "If Xcode says the identifier is not available, type a few letters of your own at the end of “Bundle Identifier” on the first target, and the same letters just before “.Extension” on the second.",
    },
    phone: {
      title: "Prepare the phone",
      body: "Plug the phone into the Mac and tap Trust on the phone. Then, on the phone, open Settings, Privacy & Security, Developer Mode, switch it on and restart when asked. This lets the phone run an app that does not come from the App Store.",
    },
    run: {
      title: "Put the app on the phone",
      body: "At the top of the Xcode window, click the name that starts with Innkeep and choose “Innkeep (iOS)”, then click the device next to it and choose your phone. Press the ▶ button. The first time takes a few minutes. If the phone says the developer is not trusted, open Settings, General, VPN & Device Management, tap your Apple account, then Trust, and press ▶ again. The Innkeep app opens on the phone; you can close it.",
    },
    enable: {
      title: "Turn it on in Safari",
      body: "On the phone, open Settings, Apps, Safari, Extensions, tap Innkeep and switch on “Allow Extension”. On older versions of iOS, Safari is directly in Settings.",
    },
    sites: {
      title: "Allow it on Airbnb and Booking.com",
      body: "In Safari on the phone, open airbnb.com and sign in. Tap the icon at the left end of the address bar, then Innkeep, and choose “Always Allow”, then “Always Allow on This Website”. Do the same on admin.booking.com.",
    },
    connect: {
      title: "Connect it to this Innkeep",
      body: "Open this page on the phone, so that you can copy the address and the token there. Then tap the icon at the left end of the address bar, Innkeep, and Settings. Paste the address and the token, tap “Save and test” and allow when Safari asks. You should read “Connected”.",
      local:
        "This Innkeep runs on this computer only: its address starts with localhost, which on a phone means the phone itself. The extension on a phone needs an Innkeep that has an address on the internet.",
    },
    read: {
      title: "Read your reservations",
      body: "Still in Safari on the phone, open your reservations page on Airbnb. A small Innkeep box appears at the bottom of the page and sends what the page shows; if it shows a “Send to Innkeep” button, tap it. Then open Innkeep: the reservations are there.",
    },
  },
  /** How to use the extension once it is set up, in any browser. */
  use: {
    title: "Use it day to day",
    subtitle: "The extension only works when you ask. Nothing runs while the browser is closed.",
    steps: [
      {
        title: "Stay signed in to Airbnb and Booking.com",
        body: "Use the browser where you added the extension, and sign in to both sites as you always do. The extension never sees your passwords.",
      },
      {
        title: "Press “Refresh everything”",
        body: "The button is on this page, on the Data page of Innkeep and in the Innkeep icon of the browser. It takes a few minutes. “Reservations only” takes under a minute.",
      },
      {
        title: "Let the tab work",
        body: "One tab goes through your own pages by itself. A band at the top says which page it is on and has a Stop button. You can use other tabs meanwhile, but keep that one open. A page that asks you to sign in is skipped.",
      },
      {
        title: "Look at the result",
        body: "The tab comes back to the Data page of Innkeep, which says what was read and when. Guest names, payouts and prices are now up to date everywhere in Innkeep.",
      },
      {
        title: "Do it again when Innkeep asks",
        body: "After a day, Innkeep shows “Your data is more than a day old” with the same button. You can also open a single Airbnb or Booking.com page yourself: the Innkeep box at the bottom of that page sends what it shows.",
      },
      {
        title: "Turn on notifications",
        body: "In Chrome, Edge, Brave or Arc: click the Innkeep icon, then Settings, and tick “Notify me about new, changed and cancelled reservations”. The browser asks once: allow it. While the browser is open, the extension asks Innkeep every five minutes and shows a notification for each change. Innkeep learns of a change from your calendar links, so it can come up to twenty minutes after the booking, and without the guest's name. Safari does not offer notifications to extensions.",
      },
    ],
  },
  after: {
    title: "Later on",
    items: [
      "After updating Innkeep: open the extensions page again and press the round arrow on the Innkeep card, then refresh any Airbnb or Booking.com tab that was already open.",
      "Chrome may show “Disable developer mode extensions” when it starts. Close that message; choosing to disable would switch Innkeep off.",
      "If the corner button of Innkeep says “Update the browser extension”, do the first point above.",
      "To remove it: on the extensions page, click Remove on the Innkeep card. Nothing stays behind.",
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
  cta: {
    /** Shown on a phone in place of the button that starts a run. */
    computer: "To read it, open Innkeep on a computer.",
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
        `The extension is missing or older than ${version}. Open chrome://extensions and press the reload arrow on Innkeep, then press the button again.`,
      popup: "Or click the Innkeep icon in the browser's toolbar and choose a button there.",
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
      ", cliquez sur la flèche de rechargement d’Innkeep, puis ouvrez à nouveau vos pages de réservations (dernière étape ci-dessous).",
  },
  setup: {
    title: "Installation",
    subtitle: "Chrome, Edge, Brave ou Arc, sur un ordinateur. Environ cinq minutes, une seule fois.",
    copyAddress: "Copier l’adresse",
    copyPath: "Copier le chemin",
    download: (version) => `Télécharger l’extension (version ${version})`,
    downloadHint:
      "Un fichier ZIP. Décompressez-le et conservez le dossier : le navigateur charge l’extension depuis celui-ci.",
    update:
      "Pour mettre à jour : téléchargez-la de nouveau, décompressez-la à la place de l’ancien dossier, puis appuyez sur la flèche de rechargement d’Innkeep.",
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
        "(en haut à gauche) et choisissez le dossier ci-dessous. Sur Mac, appuyez sur Commande + Maj + G dans la fenêtre qui s’ouvre et collez le chemin. Une carte nommée Innkeep apparaît.",
      afterHosted:
        "(en haut à gauche) et choisissez le dossier innkeep-extension obtenu en décompressant le téléchargement ci-dessous. Une carte nommée Innkeep apparaît.",
      elsewhere: "Sur un autre ordinateur, téléchargez plutôt l’extension :",
    },
    store: {
      title: "Installez l’extension",
      body: "Appuyez sur le bouton : le Chrome Web Store s’ouvre dans un nouvel onglet. Cliquez sur « Ajouter à Chrome », puis sur « Ajouter l’extension ». Cela fonctionne dans Chrome, Edge, Brave et Arc.",
      button: "Installer depuis le Chrome Web Store",
    },
    pin: {
      title: "Gardez son icône visible",
      body: "Cliquez sur l’icône en forme de pièce de puzzle, à droite de la barre d’adresse, puis sur l’épingle à côté d’Innkeep. Son icône reste alors dans la barre d’outils.",
    },
    connect: {
      title: "Reliez-la à cet Innkeep",
      before: "Cliquez sur l’icône Innkeep, puis sur",
      settings: "Settings",
      middle: "en bas de la petite fenêtre. Collez l’adresse et le jeton ci-dessous, puis cliquez sur",
      strong: "Save and test",
      after:
        ". Chrome demande si l’extension peut accéder à cette adresse : acceptez. Vous devez lire « Connected ».",
      tokenMissing: "Le jeton apparaît ici une fois défini.",
    },
    read: {
      title: "Lisez vos données",
      body: "Connectez-vous à Airbnb et à Booking.com dans ce même navigateur. Appuyez ensuite sur le bouton : un onglet parcourt vos propres pages tout seul, affiche un bouton Stop sur chacune, puis revient ici. Les deux mêmes boutons se trouvent dans l’icône Innkeep.",
      manual: "Ou ouvrez une page à la fois :",
    },
  },
  safari: {
    title: "Safari sur un Mac",
    subtitle: "Environ vingt minutes, surtout le temps d’un téléchargement. Une seule fois.",
    copyCommand: "Copier la commande",
    xcode: {
      title: "Installez Xcode",
      body: "Xcode est l’outil gratuit d’Apple pour créer des applications. Safari n’accepte une extension que dans une application, et c’est Xcode qui la fabrique. Ouvrez l’App Store, cherchez Xcode et cliquez sur Obtenir. Le téléchargement est volumineux. Ouvrez ensuite Xcode une fois, acceptez ce qu’il demande et attendez la fin de l’installation. Vous pouvez le fermer ensuite.",
    },
    build: {
      title: "Fabriquez l’application",
      body: "Ouvrez le Terminal : appuyez sur Commande + Espace, tapez Terminal et appuyez sur Entrée. Collez la ligne ci-dessous et appuyez sur Entrée. Au bout d’une minute environ, la dernière ligne nomme Innkeep.app. Rien d’autre n’est modifié sur votre Mac.",
    },
    allow: {
      title: "Autorisez-la dans Safari",
      body: "Dans Safari, cliquez sur Safari dans la barre des menus en haut de l’écran, puis sur Réglages. Ouvrez l’onglet Avancées et cochez « Afficher les fonctionnalités pour les développeurs web ». Un onglet Développeurs apparaît : ouvrez-le et cochez « Autoriser les extensions non signées ». Safari demande le mot de passe de votre Mac. Safari oublie ce choix chaque fois qu’il se ferme : cochez de nouveau la case après l’avoir relancé.",
    },
    open: {
      title: "Ouvrez l’application une fois",
      body: "Dans le Finder, appuyez sur Commande + Maj + G, collez le chemin ci-dessous et appuyez sur Entrée. Double-cliquez sur Innkeep. Une petite fenêtre s’ouvre : vous pouvez la fermer. C’est cette ouverture qui fait connaître l’extension à Safari.",
    },
    enable: {
      title: "Activez-la",
      body: "De retour dans les Réglages de Safari, ouvrez l’onglet Extensions et cochez Innkeep dans la liste de gauche. Son icône apparaît à côté de la barre d’adresse.",
    },
    sites: {
      title: "Autorisez-la sur Airbnb et Booking.com",
      body: "Ouvrez airbnb.com et connectez-vous. Cliquez sur l’icône Innkeep à côté de la barre d’adresse et choisissez « Toujours autoriser sur ce site web ». Faites de même sur admin.booking.com. D’ici là, Safari tient l’extension à l’écart de ces pages et rien n’est lu.",
    },
    connectAfter:
      ". Safari demande si l’extension peut accéder à cette adresse : acceptez. Vous devez lire « Connected ».",
    later:
      "Après une mise à jour d’Innkeep, refaites « Fabriquez l’application », puis quittez Safari et rouvrez-le.",
  },
  ios: {
    title: "Safari sur un iPhone ou un iPad",
    subtitle: "Il faut un Mac avec Xcode et le câble du téléphone. Environ une demi-heure, une seule fois.",
    limits:
      "Essayé jusqu’ici sur un téléphone : la connexion à Innkeep et la lecture de votre page de réservations Airbnb. Booking.com et « Tout mettre à jour » n’y ont pas encore été essayés.",
    need: {
      title: "Réunissez ce qu’il faut",
      body: "Un Mac avec Xcode (voir « Installez Xcode » dans le guide Safari sur un Mac), votre iPhone ou iPad avec son câble, et votre compte Apple. Avec un compte Apple gratuit, l’application cesse de fonctionner au bout de sept jours : appuyez de nouveau sur le bouton ▶ de l’étape 5 pour la renouveler.",
    },
    project: {
      title: "Ouvrez le projet dans Xcode",
      body: "Dans le Finder, appuyez sur Commande + Maj + G, collez le chemin ci-dessous et appuyez sur Entrée. Double-cliquez sur le fichier Innkeep.xcodeproj. Xcode s’ouvre.",
    },
    sign: {
      title: "Signez-la avec votre compte Apple",
      body: "Dans la colonne de gauche de Xcode, cliquez sur la ligne bleue Innkeep tout en haut. Au milieu, sous Targets, cliquez sur « Innkeep (iOS) », puis sur l’onglet « Signing & Capabilities ». Dans le menu Team, choisissez « Add an Account… », connectez-vous, puis choisissez votre nom. Faites de même pour la cible « Innkeep Extension (iOS) ».",
      taken:
        "Si Xcode indique que l’identifiant n’est pas disponible, ajoutez quelques lettres de votre choix à la fin de « Bundle Identifier » sur la première cible, et les mêmes lettres juste avant « .Extension » sur la seconde.",
    },
    phone: {
      title: "Préparez le téléphone",
      body: "Branchez le téléphone au Mac et touchez Se fier sur le téléphone. Puis, sur le téléphone, ouvrez Réglages, Confidentialité et sécurité, Mode développeur, activez-le et redémarrez quand il le demande. Le téléphone peut alors lancer une application qui ne vient pas de l’App Store.",
    },
    run: {
      title: "Installez l’application sur le téléphone",
      body: "En haut de la fenêtre de Xcode, cliquez sur le nom qui commence par Innkeep et choisissez « Innkeep (iOS) », puis cliquez sur l’appareil à côté et choisissez votre téléphone. Appuyez sur le bouton ▶. La première fois prend quelques minutes. Si le téléphone indique que le développeur n’est pas approuvé, ouvrez Réglages, Général, VPN et gestion de l’appareil, touchez votre compte Apple, puis Faire confiance, et appuyez de nouveau sur ▶. L’application Innkeep s’ouvre sur le téléphone ; vous pouvez la fermer.",
    },
    enable: {
      title: "Activez-la dans Safari",
      body: "Sur le téléphone, ouvrez Réglages, Apps, Safari, Extensions, touchez Innkeep et activez « Autoriser l’extension ». Sur les versions plus anciennes d’iOS, Safari se trouve directement dans Réglages.",
    },
    sites: {
      title: "Autorisez-la sur Airbnb et Booking.com",
      body: "Dans Safari sur le téléphone, ouvrez airbnb.com et connectez-vous. Touchez l’icône à gauche de la barre d’adresse, puis Innkeep, et choisissez « Toujours autoriser », puis « Toujours autoriser sur ce site web ». Faites de même sur admin.booking.com.",
    },
    connect: {
      title: "Reliez-la à cet Innkeep",
      body: "Ouvrez cette page sur le téléphone, pour y copier l’adresse et le jeton. Touchez ensuite l’icône à gauche de la barre d’adresse, Innkeep, puis Settings. Collez l’adresse et le jeton, touchez « Save and test » et acceptez quand Safari le demande. Vous devez lire « Connected ».",
      local:
        "Cet Innkeep ne fonctionne que sur cet ordinateur : son adresse commence par localhost, ce qui, sur un téléphone, désigne le téléphone lui-même. L’extension sur téléphone a besoin d’un Innkeep qui a une adresse sur Internet.",
    },
    read: {
      title: "Lisez vos réservations",
      body: "Toujours dans Safari sur le téléphone, ouvrez votre page de réservations sur Airbnb. Un petit cadre Innkeep apparaît en bas de la page et envoie ce qu’elle affiche ; s’il montre un bouton « Send to Innkeep », touchez-le. Ouvrez ensuite Innkeep : les réservations y sont.",
    },
  },
  use: {
    title: "L’utiliser au quotidien",
    subtitle:
      "L’extension ne travaille que lorsque vous le demandez. Rien ne tourne quand le navigateur est fermé.",
    steps: [
      {
        title: "Restez connecté à Airbnb et à Booking.com",
        body: "Utilisez le navigateur où vous avez ajouté l’extension, et connectez-vous aux deux sites comme d’habitude. L’extension ne voit jamais vos mots de passe.",
      },
      {
        title: "Appuyez sur « Tout mettre à jour »",
        body: "Le bouton se trouve sur cette page, sur la page Données d’Innkeep et dans l’icône Innkeep du navigateur. Comptez quelques minutes. « Réservations seulement » prend moins d’une minute.",
      },
      {
        title: "Laissez l’onglet travailler",
        body: "Un onglet parcourt vos propres pages tout seul. Un bandeau en haut indique la page en cours et propose un bouton Stop. Vous pouvez utiliser d’autres onglets pendant ce temps, mais gardez celui-ci ouvert. Une page qui demande de vous connecter est ignorée.",
      },
      {
        title: "Regardez le résultat",
        body: "L’onglet revient sur la page Données d’Innkeep, qui indique ce qui a été lu et quand. Les noms des voyageurs, les versements et les prix sont alors à jour partout dans Innkeep.",
      },
      {
        title: "Recommencez quand Innkeep le demande",
        body: "Au bout d’un jour, Innkeep affiche « Vos données ont plus d’un jour » avec le même bouton. Vous pouvez aussi ouvrir vous-même une seule page Airbnb ou Booking.com : le cadre Innkeep en bas de cette page envoie ce qu’elle affiche.",
      },
      {
        title: "Activez les notifications",
        body: "Dans Chrome, Edge, Brave ou Arc : cliquez sur l’icône Innkeep, puis sur Settings, et cochez « Notify me about new, changed and cancelled reservations ». Le navigateur pose la question une fois : acceptez. Tant que le navigateur est ouvert, l’extension interroge Innkeep toutes les cinq minutes et affiche une notification pour chaque changement. Innkeep apprend un changement par vos liens de calendrier : la notification peut donc arriver jusqu’à vingt minutes après la réservation, et sans le nom du voyageur. Safari ne propose pas de notifications aux extensions.",
      },
    ],
  },
  after: {
    title: "Par la suite",
    items: [
      "Après une mise à jour d’Innkeep : rouvrez la page des extensions et appuyez sur la flèche ronde de la carte Innkeep, puis actualisez les onglets Airbnb ou Booking.com déjà ouverts.",
      "Chrome peut afficher « Désactiver les extensions en mode développeur » au démarrage. Fermez ce message ; choisir de désactiver éteindrait Innkeep.",
      "Si le bouton en bas à droite d’Innkeep indique « Mettre à jour l’extension de navigateur », suivez le premier point ci-dessus.",
      "Pour la retirer : sur la page des extensions, cliquez sur Supprimer sur la carte Innkeep. Rien ne reste derrière.",
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
  cta: {
    computer: "Pour le lire, ouvrez Innkeep sur un ordinateur.",
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
        `L’extension est absente ou antérieure à la version ${version}. Ouvrez chrome://extensions, appuyez sur la flèche de rechargement d’Innkeep, puis appuyez de nouveau sur le bouton.`,
      popup: "Ou cliquez sur l’icône Innkeep dans la barre d’outils du navigateur et choisissez un bouton.",
      guide: "Installer l’extension",
      data: "Retour aux Données",
    },
  },
};

export const extension = { en, fr };
