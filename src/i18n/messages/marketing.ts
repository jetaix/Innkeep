/** The public landing page: hero, feature cards with their sample figures, limits, install block, footer and the calendar preview. */
const en = {
  /** Translated twins of `site.tagline` and `site.description`, for the landing page's metadata. */
  tagline: "The open-source channel manager for hosts with one or two places",
  description:
    "Innkeep keeps your Airbnb and Booking.com calendars in sync, shows what you will earn after costs and tells you what to fix. Free, open source and self-hosted.",
  nav: {
    label: "Site",
    features: "Features",
    limits: "Limits",
    dashboard: "Open dashboard",
  },
  hero: {
    title: "One calendar for every place you rent.",
    body: "Innkeep keeps Airbnb and Booking.com in step, shows what each month pays after costs, and points out what to fix. It is free, open source, and runs on your own machine.",
    github: "Get Innkeep on GitHub",
    dashboard: "Open the dashboard",
    extension:
      "Works with a Chrome extension, included. Calendar links only carry dates; the extension reads the rest (guests, payouts, prices, reviews) from your own Airbnb and Booking.com pages.",
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
      body: "Suggestions come from your own data: a calendar that stopped syncing, a guest waiting for an answer, a single unsold night between two stays. Add an Anthropic API key and Claude writes advice for your listings.",
      rows: [
        { tone: "critical", label: "Urgent", text: "Double booking at Harbour Studio" },
        { tone: "warn", label: "Recommended", text: "Hugo has waited 2 h for a reply" },
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
        term: "You send replies yourself",
        body: "Guest messages arrive through a webhook and are drafted in one inbox. You paste the reply into the platform.",
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
    title: "Yours to run, read and change.",
    body: (license: string) =>
      `${license} licensed. Your bookings live in a single SQLite file on your machine, with no account and no subscription.`,
    source: "Read the source",
    install: "Install commands",
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
    "Innkeep synchronise vos calendriers Airbnb et Booking.com, montre ce que vous gagnerez une fois les charges déduites et vous dit quoi corriger. Gratuit, open source et auto-hébergé.",
  nav: {
    label: "Site",
    features: "Fonctionnalités",
    limits: "Limites",
    dashboard: "Tableau de bord",
  },
  hero: {
    title: "Un seul calendrier pour tous vos logements.",
    body: "Innkeep garde Airbnb et Booking.com synchronisés, montre ce que chaque mois rapporte une fois les charges déduites et vous signale ce qu’il faut corriger. Gratuit et open source, il tourne sur votre propre machine.",
    github: "Obtenir Innkeep sur GitHub",
    dashboard: "Ouvrir le tableau de bord",
    extension:
      "Fonctionne avec une extension Chrome, fournie. Les liens de calendrier ne contiennent que des dates ; l’extension lit le reste (voyageurs, versements, prix, avis) sur vos propres pages Airbnb et Booking.com.",
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
      body: "Les suggestions viennent de vos propres données : un calendrier qui ne se synchronise plus, un voyageur qui attend une réponse, une nuit isolée invendue entre deux séjours. Ajoutez une clé d’API Anthropic et Claude rédige des conseils pour vos annonces.",
      rows: [
        { tone: "critical", label: "Urgent", text: "Double réservation à Harbour Studio" },
        { tone: "warn", label: "Recommandé", text: "Hugo attend une réponse depuis 2 h" },
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
        term: "Vous envoyez les réponses vous-même",
        body: "Les messages des voyageurs arrivent par un webhook et les réponses se rédigent dans une boîte unique. Vous collez la réponse sur la plateforme.",
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
    title: "Il est à vous : lancez-le, lisez-le, modifiez-le.",
    body: (license) =>
      `Sous licence ${license}. Vos réservations sont stockées dans un seul fichier SQLite sur votre machine, sans compte ni abonnement.`,
    source: "Lire le code source",
    install: "Commandes d’installation",
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
