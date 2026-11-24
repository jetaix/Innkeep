/** The public landing page: hero, feature cards with their sample figures, limits, install block, footer and the calendar preview. */
const en = {
  /** Translated twins of `site.tagline` and `site.description`, for the landing page's metadata. */
  tagline: "The open-source channel manager for hosts with one or two places",
  description:
    "Innkeep keeps your Airbnb and Booking.com calendars in sync, shows what you will earn after costs and tells you what to fix. Hosted in early access, or free and self-hosted.",
  nav: {
    label: "Site",
    features: "Features",
    limits: "Limits",
    install: "Install",
    access: "Request early access",
    dashboard: "Open dashboard",
  },
  hero: {
    title: "One calendar for every place you rent.",
    body: "Innkeep keeps Airbnb and Booking.com in step, shows what each month pays after costs, and points out what to fix. Hosted for you, or free and self-hosted.",
    selfHosted: "Prefer to run it yourself? The self-hosted version is free and on GitHub today.",
    watch: "Watch the demo",
    install: "Install Innkeep",
    github: "Get Innkeep on GitHub",
    dashboard: "Open the dashboard",
    extension:
      "Works with a Chrome extension, included. Calendar links only carry dates; the extension reads the rest (guests, payouts, prices, reviews) from your own Airbnb and Booking.com pages.",
  },
  access: {
    label: "Your email address",
    placeholder: "you@example.com",
    submit: "Request early access",
    pending: "Sending…",
    sent: "Thank you. We will write when your access opens.",
    invalid: "That does not look like an email address. Check it and try again.",
    failed: "The request could not be sent. Try again in a moment.",
    note: "Used only to tell you when early access opens.",
  },
  ways: {
    title: "Two ways to use Innkeep.",
    hosted: {
      title: "Hosted",
      state: "Early access",
      body: "We run Innkeep for you. Nothing to install, nothing to keep running. It opens to a first group of hosts before everyone else; leave your address to be one of them.",
    },
    self: {
      title: "Self-hosted",
      state: "Available today",
      body: "The same app on your own computer. Free, open source, and your bookings stay in a file you own. You install it and keep it running.",
      github: "Get it on GitHub",
      guide: "How to install it",
    },
  },
  demo: {
    label: "Product demo, with example data",
    play: "Play the demo",
    pause: "Pause the demo",
    scenes: "Scenes",
    net: "Net for November",
    scenesList: [
      {
        title: "Two calendars, one view",
        caption: "Airbnb and Booking.com are imported every 15 minutes and laid on the same timeline.",
      },
      {
        title: "A clash shows itself",
        caption: "Two bookings land on the same nights. Where they overlap, Innkeep flags it at once.",
      },
      {
        title: "What the month pays",
        caption: "Cleaning, commission and bills come off the revenue. What is left is yours.",
      },
      {
        title: "What to fix next",
        caption: "A short list drawn from your own data, most urgent first.",
      },
    ],
  },
  works: {
    label: "Works with",
    airbnb: "Calendar link, plus your own pages through the extension",
    booking: "Calendar link, plus your own pages through the extension",
    chrome: "Innkeep Companion extension, included",
    note: "Innkeep is not affiliated with Airbnb, Booking.com or Google. Their names and marks belong to them.",
  },
  trust: {
    title: "Self-hosted, your bookings stay yours.",
    intro:
      "The self-hosted version is a program you run, not a service you sign up for. That changes what it can know about you.",
    items: [
      {
        term: "Nothing to sign up for",
        body: "No account, no subscription, no card. The code is MIT licensed and free to use.",
      },
      {
        term: "Your data stays on your computer",
        body: "Reservations, prices and revenue live in one file in a folder you choose. The self-hosted app sends them to no one.",
      },
      {
        term: "Your passwords stay with you",
        body: "You sign in to Airbnb and Booking.com yourself, in your own browser. The extension only reads pages of your own host accounts.",
      },
      {
        term: "Claude only when you ask",
        body: "AI advice is optional. When you press Get advice, a summary goes to Anthropic; guest names, messages and phone numbers are never sent.",
      },
      {
        term: "Every line can be read",
        body: "The app and the extension are public on GitHub, including the list of what the extension reads and the risk you take by using it.",
      },
      {
        term: "Leaving takes two minutes",
        body: "Remove the two calendar links and each platform carries on as before. Your file stays with you.",
      },
    ],
    privacy: "What the extension reads",
  },
  features: {
    title: "Made for hosts with one or two places, not two hundred.",
    intro:
      "Property-management suites are priced and built for agencies. Innkeep does the few things a small host does every week, and does them carefully.",
    sync: {
      title: "Calendars that agree with each other",
      body: "Paste each listing's calendar link. Innkeep imports both every 15 minutes and hands each platform a link that blocks what the other one sold. If two bookings ever land on the same night, you hear about it first.",
      direct: "Direct bookings",
      /** "Synced 4 min ago" */
      synced: (ago: string) => `Synced ${ago}`,
      shared: "Shared with both",
    },
    money: {
      title: "Know what a month is really worth",
      body: "Enter cleaning, commission, subscriptions and one-off bills once. Every month then shows revenue, costs and what is left, including bookings that have not been paid out yet.",
      revenue: (nights: string) => `Revenue, ${nights}`,
      cleaning: (stays: string) => `Cleaning, ${stays}`,
      commission: "Platform commission",
      bills: "Subscriptions and bills",
      net: "Net for November",
    },
    suggestions: {
      title: "It tells you what to fix",
      body: "Suggestions come from your own data: a calendar that stopped syncing, a single unsold night between two stays. Add an Anthropic API key and Claude writes advice for your listings.",
      rows: [
        { tone: "critical", label: "Urgent", text: "Double booking at Harbour Studio" },
        { tone: "warn", label: "Recommended", text: "Canal Loft’s Booking.com calendar stopped syncing" },
        { tone: "neutral", label: "Idea", text: "One free night on 24 November" },
      ] as { tone: "critical" | "warn" | "neutral"; label: string; text: string }[],
    },
    keyboard: {
      title: "Fast with a keyboard, open to your assistant",
      body: "Every screen is reachable without a mouse, with a command menu for the rest. A built-in MCP server lets Claude or any other assistant read your calendar and revenue, and block dates when you ask.",
      commandMenu: "command menu",
      calendar: "calendar",
      newBooking: "new booking",
      you: "You:",
      request: "Block the loft from 3 to 5 December for the plumber.",
      assistant: "Assistant:",
      answer: "Blocked. Both platforms close those nights at the next sync.",
    },
    note: "Names and figures on this page are examples.",
  },
  limits: {
    title: "What it does not do.",
    intro:
      "Airbnb and Booking.com reserve their APIs for approved partners. Innkeep works with what every host is given, and says so.",
    items: [
      {
        term: "Sync takes minutes, not seconds",
        body: "Calendar links are re-read on each platform's own schedule. A double booking in that window is rare but possible; Innkeep flags it, it cannot prevent it.",
      },
      {
        term: "No guest messaging",
        body: "Innkeep does not read or send guest messages. You talk to your guests on each platform.",
      },
      {
        term: "Listing changes are copied across",
        body: "You edit details once and Innkeep tracks which platform is out of date. It cannot push the change for you.",
      },
      {
        term: "No login yet",
        body: "Run it on your own computer or behind a proxy that asks for a password.",
      },
    ],
  },
  open: {
    title: "Self-hosted: yours to run, read and change.",
    body: (license: string) =>
      `${license} licensed. Your bookings live in a single SQLite file on your machine, with no account and no subscription.`,
    source: "Read the source",
    install: "Install commands",
    ready: "Innkeep then opens at http://localhost:3000",
    /** A prompt a non-technical host pastes into an AI assistant, which then installs Innkeep or guides them. */
    ai: {
      title: "Not technical? Let an AI assistant install it with you.",
      body: "Copy this request and paste it into Claude, ChatGPT, Gemini or any other assistant. One that can act on your computer (Claude Code, Claude in its desktop app, Codex and similar) does the installation itself. A chat-only assistant guides you one step at a time.",
      copy: "Copy the request",
      label: "Request to paste into an AI assistant",
      guide: "Prefer to follow written steps? Read the install guide",
      caution:
        "The request tells the assistant never to ask for your passwords. If it does anyway, do not give them.",
      prompt:
        'I want to install and run Innkeep on my own computer. It is a free, open-source app for people who rent out one or two places on Airbnb and Booking.com. It has two parts: the app itself, and a Chrome extension included in the project that reads my own Airbnb and Booking.com pages. Both must be installed. I am not technical. Please help me from start to finish.\n\nABOUT THE PROJECT\n- Code: https://github.com/jetaix/Innkeep\n- It needs Node.js version 22 or later. Nothing else: no database to install, no account to create.\n- It starts with one file in the project folder: "start.command" on a Mac, "start.bat" on Windows, or the command "npm run app" in a terminal. That file installs what is missing, creates the settings, prepares the app and opens http://localhost:3000 in my browser.\n- The full guide is in the project: docs/INSTALL.md (docs/INSTALLATION.fr.md in French). Read it if you can.\n\nHOW TO HELP ME\n- First ask me whether I use a Mac or Windows, unless you can see it yourself.\n- If you can run commands on my computer, do the work yourself: check Node.js (install the current LTS version if it is missing or older than 22), download the project into my Documents folder, run "npm run app" inside it, wait until it says Innkeep is running, and check that http://localhost:3000/overview answers. Then tell me in plain words what you did.\n- If you cannot run commands, guide me one step at a time. Give me a single step, say exactly where to click or what to type, and wait until I tell you it is done before giving the next one.\n- Explain any word I might not know. Do not skip steps, and do not give me several options to choose from: pick the simplest one.\n\nTHEN HELP ME FINISH THE SETUP INSIDE INNKEEP\n1. Add my place: "Properties", then "Add property", then paste the calendar links that Airbnb and Booking.com give me. Tell me where to find those links on each site.\n2. Add the browser extension: Innkeep shows a button "Add the browser extension" that opens a guide with everything to copy. In short: open chrome://extensions, switch on "Developer mode", click "Load unpacked", choose the "extension" folder of the project, pin the Innkeep Companion icon, click it, open "Settings", paste the address and the token that Innkeep shows, and click "Save and test".\n3. I sign in to Airbnb and Booking.com myself, then press "Refresh everything" in Innkeep.\n\nRULES\n- Never ask me for my Airbnb, Booking.com or other passwords, and never type them for me. I sign in myself.\n- Do not show, copy or send anywhere the content of the ".env.local" file or of the "data" folder. They hold my private settings and my reservations.\n- Do not change the project\'s code. If something fails, show me the exact error message and explain the fix in plain words.\n- Innkeep only runs while its window is open. At the end, tell me how to stop it and how to start it again tomorrow.',
    },
  },
  close: {
    title: "Two calendars in. One you can trust.",
    body: "Ask for early access to the hosted version, or run the free, open-source one today.",
    self: "Self-host from GitHub",
  },
  footer: {
    label: "Footer",
    disclaimer: "Not affiliated with Airbnb, Booking.com or Hospitable.",
    alternatives: "Alternatives",
    license: "License",
  },
  preview: {
    clash: "Double booking at Harbour Studio",
    plumber: "Plumber",
    blocked: "Blocked",
    example: "Example data",
  },
};

const fr: typeof en = {
  tagline: "Le channel manager open source pour les hôtes qui ont un ou deux logements",
  description:
    "Innkeep synchronise vos calendriers Airbnb et Booking.com, montre ce que vous gagnerez une fois les charges déduites et vous dit quoi corriger. Hébergé en accès anticipé, ou gratuit et auto-hébergé.",
  nav: {
    label: "Site",
    features: "Fonctionnalités",
    limits: "Limites",
    install: "Installer",
    access: "Demander un accès anticipé",
    dashboard: "Tableau de bord",
  },
  hero: {
    title: "Un seul calendrier pour tous vos logements.",
    body: "Innkeep garde Airbnb et Booking.com synchronisés, montre ce que chaque mois rapporte une fois les charges déduites et vous signale ce qu’il faut corriger. Hébergé pour vous, ou gratuit et auto-hébergé.",
    selfHosted:
      "Vous préférez le faire tourner vous-même ? La version auto-hébergée est gratuite et déjà sur GitHub.",
    watch: "Voir la démo",
    install: "Installer Innkeep",
    github: "Obtenir Innkeep sur GitHub",
    dashboard: "Ouvrir le tableau de bord",
    extension:
      "Fonctionne avec une extension Chrome, fournie. Les liens de calendrier ne contiennent que des dates ; l’extension lit le reste (voyageurs, versements, prix, avis) sur vos propres pages Airbnb et Booking.com.",
  },
  access: {
    label: "Votre adresse e-mail",
    placeholder: "vous@exemple.fr",
    submit: "Demander un accès anticipé",
    pending: "Envoi…",
    sent: "Merci. Nous vous écrirons à l’ouverture de votre accès.",
    invalid: "Cela ne ressemble pas à une adresse e-mail. Vérifiez-la et réessayez.",
    failed: "La demande n’a pas pu être envoyée. Réessayez dans un instant.",
    note: "Utilisée uniquement pour vous prévenir de l’ouverture de l’accès anticipé.",
  },
  ways: {
    title: "Deux façons d’utiliser Innkeep.",
    hosted: {
      title: "Hébergé",
      state: "Accès anticipé",
      body: "Nous faisons tourner Innkeep pour vous. Rien à installer, rien à laisser allumé. Il s’ouvre d’abord à un premier groupe d’hôtes ; laissez votre adresse pour en faire partie.",
    },
    self: {
      title: "Auto-hébergé",
      state: "Disponible aujourd’hui",
      body: "La même application sur votre propre ordinateur. Gratuite, open source, et vos réservations restent dans un fichier qui vous appartient. Vous l’installez et la laissez tourner.",
      github: "L’obtenir sur GitHub",
      guide: "Comment l’installer",
    },
  },
  demo: {
    label: "Démo du produit, avec des données d’exemple",
    play: "Lancer la démo",
    pause: "Mettre la démo en pause",
    scenes: "Scènes",
    net: "Net de novembre",
    scenesList: [
      {
        title: "Deux calendriers, une seule vue",
        caption: "Airbnb et Booking.com sont importés toutes les 15 minutes et posés sur la même frise.",
      },
      {
        title: "Un conflit se voit tout de suite",
        caption:
          "Deux réservations tombent sur les mêmes nuits. Là où elles se chevauchent, Innkeep le signale aussitôt.",
      },
      {
        title: "Ce que le mois rapporte",
        caption: "Le ménage, la commission et les factures sont déduits des revenus. Le reste est à vous.",
      },
      {
        title: "Ce qu’il faut corriger ensuite",
        caption: "Une courte liste tirée de vos propres données, le plus urgent en premier.",
      },
    ],
  },
  works: {
    label: "Fonctionne avec",
    airbnb: "Lien de calendrier, et vos propres pages grâce à l’extension",
    booking: "Lien de calendrier, et vos propres pages grâce à l’extension",
    chrome: "Extension Innkeep Companion, fournie",
    note: "Innkeep n’a aucun lien avec Airbnb, Booking.com ou Google. Leurs noms et logos leur appartiennent.",
  },
  trust: {
    title: "En auto-hébergé, vos réservations restent à vous.",
    intro:
      "La version auto-hébergée est un programme que vous lancez, pas un service auquel vous vous inscrivez. Cela change ce qu’il peut savoir de vous.",
    items: [
      {
        term: "Aucune inscription",
        body: "Pas de compte, pas d’abonnement, pas de carte. Le code est sous licence MIT et libre d’usage.",
      },
      {
        term: "Vos données restent sur votre ordinateur",
        body: "Réservations, prix et revenus sont stockés dans un seul fichier, dans un dossier que vous choisissez. L’application auto-hébergée ne les envoie à personne.",
      },
      {
        term: "Vos mots de passe restent chez vous",
        body: "Vous vous connectez vous-même à Airbnb et à Booking.com, dans votre navigateur. L’extension ne lit que les pages de vos propres comptes d’hôte.",
      },
      {
        term: "Claude seulement si vous le demandez",
        body: "Les conseils par IA sont facultatifs. Quand vous demandez des conseils, un résumé part chez Anthropic ; les noms des voyageurs, les messages et les numéros de téléphone ne sont jamais envoyés.",
      },
      {
        term: "Chaque ligne peut être lue",
        body: "L’application et l’extension sont publiques sur GitHub, y compris la liste de ce que lit l’extension et le risque que vous prenez en l’utilisant.",
      },
      {
        term: "Partir prend deux minutes",
        body: "Retirez les deux liens de calendrier et chaque plateforme continue comme avant. Votre fichier reste chez vous.",
      },
    ],
    privacy: "Ce que lit l’extension",
  },
  features: {
    title: "Pensé pour les hôtes qui ont un ou deux logements, pas deux cents.",
    intro:
      "Les logiciels de gestion locative sont conçus et tarifés pour les agences. Innkeep se charge des quelques tâches qu’un petit hôte répète chaque semaine, et le fait avec soin.",
    sync: {
      title: "Des calendriers qui s’accordent entre eux",
      body: "Collez le lien de calendrier de chaque annonce. Innkeep importe les deux toutes les 15 minutes et fournit à chaque plateforme un lien qui bloque les nuits vendues par l’autre. Si deux réservations tombent un jour sur la même nuit, vous êtes le premier à le savoir.",
      direct: "Réservations directes",
      synced: (ago) => `Synchronisé ${ago}`,
      shared: "Partagées avec les deux",
    },
    money: {
      title: "Sachez ce qu’un mois rapporte vraiment",
      body: "Saisissez une seule fois le ménage, la commission, les abonnements et les factures ponctuelles. Chaque mois affiche ensuite les revenus, les charges et ce qu’il reste, y compris les réservations qui ne vous ont pas encore été versées.",
      revenue: (nights) => `Revenus, ${nights}`,
      cleaning: (stays) => `Ménage, ${stays}`,
      commission: "Commission des plateformes",
      bills: "Abonnements et factures",
      net: "Net de novembre",
    },
    suggestions: {
      title: "Il vous dit quoi corriger",
      body: "Les suggestions viennent de vos propres données : un calendrier qui ne se synchronise plus, une nuit isolée invendue entre deux séjours. Ajoutez une clé d’API Anthropic et Claude rédige des conseils pour vos annonces.",
      rows: [
        { tone: "critical", label: "Urgent", text: "Double réservation à Harbour Studio" },
        {
          tone: "warn",
          label: "Recommandé",
          text: "Le calendrier Booking.com de Canal Loft ne se synchronise plus",
        },
        { tone: "neutral", label: "Idée", text: "Une nuit libre le 24 novembre" },
      ],
    },
    keyboard: {
      title: "Rapide au clavier, ouvert à votre assistant",
      body: "Chaque écran est accessible sans souris, et un menu de commandes s’occupe du reste. Un serveur MCP intégré permet à Claude, ou à tout autre assistant, de lire votre calendrier et vos revenus, et de bloquer des dates quand vous le demandez.",
      commandMenu: "menu de commandes",
      calendar: "calendrier",
      newBooking: "nouvelle réservation",
      you: "Vous :",
      request: "Bloque le loft du 3 au 5 décembre pour le plombier.",
      assistant: "Assistant :",
      answer: "C’est bloqué. Les deux plateformes ferment ces nuits à la prochaine synchronisation.",
    },
    note: "Les noms et les chiffres de cette page sont des exemples.",
  },
  limits: {
    title: "Ce qu’il ne fait pas.",
    intro:
      "Airbnb et Booking.com réservent leurs API aux partenaires agréés. Innkeep travaille avec ce dont dispose tout hôte, et ne s’en cache pas.",
    items: [
      {
        term: "La synchronisation prend des minutes, pas des secondes",
        body: "Chaque plateforme relit les liens de calendrier à son propre rythme. Dans cet intervalle, une double réservation est rare mais possible ; Innkeep la signale, il ne peut pas l’empêcher.",
      },
      {
        term: "Pas de messagerie",
        body: "Innkeep ne lit et n’envoie aucun message de voyageur. Vous échangez avec vos voyageurs sur chaque plateforme.",
      },
      {
        term: "Les modifications d’annonce sont à recopier",
        body: "Vous modifiez les informations une seule fois et Innkeep suit quelle plateforme n’est plus à jour. Il ne peut pas publier la modification à votre place.",
      },
      {
        term: "Pas encore d’identification",
        body: "Faites-le tourner sur votre propre ordinateur ou derrière un proxy qui demande un mot de passe.",
      },
    ],
  },
  open: {
    title: "Auto-hébergé : lancez-le, lisez-le, modifiez-le.",
    body: (license) =>
      `Sous licence ${license}. Vos réservations sont stockées dans un seul fichier SQLite sur votre machine, sans compte ni abonnement.`,
    source: "Lire le code source",
    install: "Commandes d’installation",
    ready: "Innkeep s’ouvre ensuite sur http://localhost:3000",
    ai: {
      title: "Pas technicien ? Laissez un assistant IA l’installer avec vous.",
      body: "Copiez cette demande et collez-la dans Claude, ChatGPT, Gemini ou un autre assistant. Un assistant capable d’agir sur votre ordinateur (Claude Code, Claude dans son application de bureau, Codex et équivalents) fait l’installation lui-même. Un assistant limité à la conversation vous guide une étape à la fois.",
      copy: "Copier la demande",
      label: "Demande à coller dans un assistant IA",
      guide: "Vous préférez suivre des étapes écrites ? Lisez le guide d’installation",
      caution:
        "La demande précise à l’assistant de ne jamais vous réclamer vos mots de passe. S’il le fait quand même, ne les donnez pas.",
      prompt:
        "Je veux installer et lancer Innkeep sur mon propre ordinateur. C’est une application gratuite et open source pour les personnes qui louent un ou deux logements sur Airbnb et Booking.com. Elle comprend deux parties : l’application elle-même, et une extension Chrome fournie avec le projet, qui lit mes propres pages Airbnb et Booking.com. Les deux doivent être installées. Je ne suis pas technicien. Aide-moi du début à la fin, en français.\n\nÀ PROPOS DU PROJET\n- Code : https://github.com/jetaix/Innkeep\n- Il a besoin de Node.js en version 22 ou plus. Rien d’autre : aucune base de données à installer, aucun compte à créer.\n- Il démarre avec un seul fichier du dossier du projet : « start.command » sur Mac, « start.bat » sur Windows, ou la commande « npm run app » dans un terminal. Ce fichier installe ce qui manque, crée les réglages, prépare l’application et ouvre http://localhost:3000 dans mon navigateur.\n- Le guide complet est dans le projet : docs/INSTALLATION.fr.md (docs/INSTALL.md en anglais). Lis-le si tu le peux.\n\nCOMMENT M’AIDER\n- Demande-moi d’abord si j’utilise un Mac ou Windows, sauf si tu peux le voir toi-même.\n- Si tu peux exécuter des commandes sur mon ordinateur, fais le travail toi-même : vérifie Node.js (installe la version LTS actuelle s’il manque ou s’il est antérieur à la version 22), télécharge le projet dans mon dossier Documents, lance « npm run app » dans ce dossier, attends qu’il indique qu’Innkeep est démarré, et vérifie que http://localhost:3000/overview répond. Explique-moi ensuite simplement ce que tu as fait.\n- Si tu ne peux pas exécuter de commandes, guide-moi une étape à la fois. Donne-moi une seule étape, dis-moi exactement où cliquer ou quoi taper, et attends que je te dise que c’est fait avant de passer à la suivante.\n- Explique chaque mot que je pourrais ne pas connaître. Ne saute aucune étape, et ne me propose pas plusieurs options : choisis la plus simple.\n\nAIDE-MOI ENSUITE À TERMINER L’INSTALLATION DANS INNKEEP\n1. Ajouter mon logement : « Logements », puis « Ajouter le logement », puis coller les liens de calendrier fournis par Airbnb et Booking.com. Dis-moi où trouver ces liens sur chaque site.\n2. Ajouter l’extension de navigateur : Innkeep affiche un bouton « Ajouter l’extension de navigateur » qui ouvre un guide avec tout ce qu’il faut copier. En résumé : ouvrir chrome://extensions, activer le « Mode développeur », cliquer sur « Charger l’extension non empaquetée », choisir le dossier « extension » du projet, épingler l’icône Innkeep Companion, cliquer dessus, ouvrir « Settings », coller l’adresse et le jeton affichés par Innkeep, puis cliquer sur « Save and test ».\n3. Je me connecte moi-même à Airbnb et à Booking.com, puis j’appuie sur « Tout mettre à jour » dans Innkeep.\n\nRÈGLES\n- Ne me demande jamais mes mots de passe Airbnb, Booking.com ou autres, et ne les saisis jamais à ma place. Je me connecte moi-même.\n- N’affiche pas, ne copie pas et n’envoie nulle part le contenu du fichier « .env.local » ni du dossier « data ». Ils contiennent mes réglages privés et mes réservations.\n- Ne modifie pas le code du projet. Si quelque chose échoue, montre-moi le message d’erreur exact et explique simplement la solution.\n- Innkeep ne fonctionne que lorsque sa fenêtre est ouverte. À la fin, dis-moi comment l’arrêter et comment le relancer demain.",
    },
  },
  close: {
    title: "Deux calendriers en entrée. Un seul, fiable, en sortie.",
    body: "Demandez un accès anticipé à la version hébergée, ou lancez dès aujourd’hui la version gratuite et open source.",
    self: "Auto-héberger depuis GitHub",
  },
  footer: {
    label: "Pied de page",
    disclaimer: "Sans lien avec Airbnb, Booking.com ou Hospitable.",
    alternatives: "Alternatives",
    license: "Licence",
  },
  preview: {
    clash: "Double réservation à Harbour Studio",
    plumber: "Plombier",
    blocked: "Bloqué",
    example: "Données d’exemple",
  },
};

export const marketing = { en, fr };
