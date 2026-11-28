/** The Settings page: appearance, the integrations switched on by environment variables, and keyboard shortcuts. */
const en = {
  title: "Settings",
  description: "Innkeep is configured with environment variables on the server. This page shows what is on.",
  tabs: {
    label: "Settings sections",
    general: "General",
    connections: "Connections",
    assistant: "AI assistant (MCP)",
    data: "Data",
  },
  appearance: {
    title: "Appearance",
    themeHelp: "Remembered in this browser.",
    languageHelp: "Remembered for this browser. Also changes how dates and amounts are written.",
  },
  integrations: {
    title: "Integrations",
    on: "On",
    off: "Off",
    sync: {
      name: "Calendar sync",
      every: (minutes: number) => `Every ${minutes} minute${minutes === 1 ? "" : "s"}`,
      manual: "Manual only",
      scheduled: "When the scheduler calls",
      body: "Imports every connected Airbnb and Booking.com calendar in the background.",
    },
    ai: {
      name: "AI advice",
      body: "Lets the Suggestions page ask Claude for advice written for your listings. Listing text and totals are sent; guest names and messages are not.",
    },
    extension: {
      name: "Browser extension",
      body: "Lets the Innkeep extension add guest names, payouts, past stays and listing details from your own Airbnb and Booking.com pages.",
      link: "How to install it",
    },
    telegram: {
      name: "Telegram notifications",
      body: "Sends you a Telegram message each time a cleaning has to be arranged: a new check-out, or a cleaning added by hand. Needs a bot token and a chat.",
    },
    mcp: {
      name: "MCP server",
      body: "Lets an AI assistant read your calendar, revenue and suggestions, and block dates, over the Model Context Protocol.",
      steps: "How to connect an assistant",
      /** Step 1, when the token is not set yet. */
      token: "Create a secret token: a long random text only you know. This command makes one:",
      tokenSet: "A token is set. It is the value you gave MCP_TOKEN; Innkeep never shows it.",
      /** Step 1, in a space that has a token of its own. */
      tokenOwn:
        "Your token is already in the commands below. Whoever has it can read your calendar and revenue: keep it to yourself.",
      whereHosted:
        "Add it in Vercel: your project, Settings, Environment Variables, name MCP_TOKEN. Then redeploy.",
      whereSelf: "Add it to your .env file as MCP_TOKEN, then restart the server.",
      /** `own`: the token is already written in the command, so there is nothing to replace. */
      claudeCode: (own: boolean): string =>
        `Claude Code: run this in a terminal${own ? "" : ", with your token in place of YOUR_MCP_TOKEN"}.`,
      desktop: (own: boolean): string =>
        `Claude Desktop: open Settings, Developer, Edit Config, and add this to the file${own ? "" : ", with your token in place of YOUR_MCP_TOKEN"}. Change nothing else. Node.js must be installed on that computer. Restart Claude Desktop.`,
      other: "Another assistant that accepts an MCP server over HTTP: give it this configuration.",
      tryIt: "Then ask it: “What are my next arrivals in Innkeep?”",
    },
    /** "Change a variable in your environment or `.env` file and restart the server. The README lists them all." */
    footer: {
      beforeFile: "Change a variable in your environment or",
      afterFile: "file and restart the server. The",
      link: "README",
      after: "lists them all.",
    },
  },
  account: {
    title: "Your account",
    note: "Who you are signed in as, and your password.",
    change: "Change your password",
    current: "Current password",
    next: "New password",
    hint: (min: number): string => `At least ${min} characters.`,
    save: "Change password",
    saving: "Saving…",
    saved: "Your password is changed. Other browsers you were signed in on are signed out.",
    wrongCurrent: "That is not your current password.",
    tooShort: (min: number): string => `The new password needs at least ${min} characters.`,
  },
  members: {
    title: "Members",
    note: "Who can open this Innkeep, and what each of them may do.",
    you: "you",
    lastAdmin: "An Innkeep keeps at least one admin.",
    reset: {
      action: "Reset password",
      /** Above the link, once made. */
      ready: (name: string): string =>
        `Send this link to ${name}. They choose a new password with it. It works once, for two days, and cannot be shown again.`,
    },
    role: "Role",
    /** Under the role, in the list of choices. */
    can: {
      admin: "Sees and changes everything",
      visitor: "Sees the properties and the cleaning only, and marks cleanings as done",
    },
    remove: "Remove",
    confirmRemove: (name: string): string => `Remove ${name}? They are signed out at once.`,
    invite: {
      title: "Invite someone",
      note: "Who is it for? (optional)",
      notePlaceholder: "Sandrine, cleaning",
      submit: "Create the invitation link",
      creating: "Creating…",
      ready: "Send this link to the person. It works once, for seven days, and cannot be shown again.",
      waiting: "Invitations waiting",
      /** "Visitor, for Sandrine, until 5 Dec" */
      pending: (role: string, note: string, until: string): string =>
        `${role}${note ? `, for ${note}` : ""}, until ${until}`,
      revoke: "Cancel",
    },
  },
  shortcuts: {
    title: "Keyboard shortcuts",
    commandMenu: "Open the command menu",
    goTo: (label: string) => `Go to ${label}`,
    add: "Add a booking or block (Calendar, Reservations)",
    move: "Move the calendar by four weeks",
    today: "Back to today in the calendar",
    close: "Close the open panel",
  },
};

const fr: typeof en = {
  title: "Réglages",
  description:
    "Innkeep se configure avec des variables d’environnement sur le serveur. Cette page montre ce qui est activé.",
  tabs: {
    label: "Sections des réglages",
    general: "Général",
    connections: "Connexions",
    assistant: "Assistant IA (MCP)",
    data: "Données",
  },
  appearance: {
    title: "Apparence",
    themeHelp: "Mémorisé dans ce navigateur.",
    languageHelp: "Mémorisée pour ce navigateur. Change aussi le format des dates et des montants.",
  },
  integrations: {
    title: "Intégrations",
    on: "Activé",
    off: "Désactivé",
    sync: {
      name: "Synchronisation des calendriers",
      every: (minutes) => (minutes > 1 ? `Toutes les ${minutes} minutes` : "Toutes les minutes"),
      manual: "Manuelle uniquement",
      scheduled: "À chaque appel du planificateur",
      body: "Importe en arrière-plan tous les calendriers Airbnb et Booking.com connectés.",
    },
    ai: {
      name: "Conseils par IA",
      body: "Permet à la page Suggestions de demander à Claude des conseils rédigés pour vos annonces. Le texte des annonces et les totaux sont envoyés ; les noms des voyageurs et les messages ne le sont pas.",
    },
    extension: {
      name: "Extension de navigateur",
      body: "Permet à l’extension Innkeep d’ajouter les noms des voyageurs, les versements, les séjours passés et les détails des annonces à partir de vos propres pages Airbnb et Booking.com.",
      link: "Comment l’installer",
    },
    telegram: {
      name: "Notifications Telegram",
      body: "Vous envoie un message Telegram chaque fois qu’un ménage est à demander : un nouveau départ, ou un ménage ajouté à la main. Nécessite le jeton d’un bot et une conversation.",
    },
    mcp: {
      name: "Serveur MCP",
      body: "Permet à un assistant IA de lire votre calendrier, vos revenus et vos suggestions, et de bloquer des dates, via le Model Context Protocol.",
      steps: "Comment connecter un assistant",
      token:
        "Créez un jeton secret : un long texte aléatoire que vous seul connaissez. Cette commande en fabrique un :",
      tokenSet: "Un jeton est défini. C’est la valeur donnée à MCP_TOKEN ; Innkeep ne l’affiche jamais.",
      tokenOwn:
        "Votre jeton est déjà dans les commandes ci-dessous. Quiconque le possède peut lire votre calendrier et vos revenus : gardez-le pour vous.",
      whereHosted:
        "Ajoutez-le dans Vercel : votre projet, Settings, Environment Variables, nom MCP_TOKEN. Puis redéployez.",
      whereSelf: "Ajoutez-le à votre fichier .env sous le nom MCP_TOKEN, puis redémarrez le serveur.",
      claudeCode: (own) =>
        `Claude Code : lancez ceci dans un terminal${own ? "" : ", avec votre jeton à la place de YOUR_MCP_TOKEN"}.`,
      desktop: (own) =>
        `Claude Desktop : ouvrez Settings, Developer, Edit Config, et ajoutez ceci au fichier${own ? "" : ", avec votre jeton à la place de YOUR_MCP_TOKEN"}. Ne changez rien d’autre. Node.js doit être installé sur cet ordinateur. Redémarrez Claude Desktop.`,
      other: "Un autre assistant qui accepte un serveur MCP en HTTP : donnez-lui cette configuration.",
      tryIt: "Demandez-lui ensuite : « Quelles sont mes prochaines arrivées dans Innkeep ? »",
    },
    footer: {
      beforeFile: "Modifiez une variable dans votre environnement ou dans votre fichier",
      afterFile: "puis redémarrez le serveur. Le",
      link: "README",
      after: "les recense toutes.",
    },
  },
  account: {
    title: "Votre compte",
    note: "Sous quel nom vous êtes connecté, et votre mot de passe.",
    change: "Changer votre mot de passe",
    current: "Mot de passe actuel",
    next: "Nouveau mot de passe",
    hint: (min) => `Au moins ${min} caractères.`,
    save: "Changer le mot de passe",
    saving: "Enregistrement…",
    saved: "Votre mot de passe est changé. Les autres navigateurs où vous étiez connecté sont déconnectés.",
    wrongCurrent: "Ce n’est pas votre mot de passe actuel.",
    tooShort: (min) => `Le nouveau mot de passe doit compter au moins ${min} caractères.`,
  },
  members: {
    title: "Membres",
    note: "Qui peut ouvrir cet Innkeep, et ce que chacun peut y faire.",
    you: "vous",
    lastAdmin: "Un Innkeep garde au moins un admin.",
    reset: {
      action: "Réinitialiser le mot de passe",
      ready: (name) =>
        `Envoyez ce lien à ${name}, qui choisira un nouveau mot de passe. Il fonctionne une seule fois, pendant deux jours, et ne pourra plus être affiché.`,
    },
    role: "Rôle",
    can: {
      admin: "Voit et modifie tout",
      visitor: "Voit seulement les logements et le ménage, et marque les ménages faits",
    },
    remove: "Retirer",
    confirmRemove: (name) => `Retirer ${name} ? Cette personne est déconnectée aussitôt.`,
    invite: {
      title: "Inviter quelqu’un",
      note: "Pour qui ? (facultatif)",
      notePlaceholder: "Sandrine, ménage",
      submit: "Créer le lien d’invitation",
      creating: "Création…",
      ready:
        "Envoyez ce lien à la personne. Il fonctionne une seule fois, pendant sept jours, et ne pourra plus être affiché.",
      waiting: "Invitations en attente",
      pending: (role, note, until) => `${role}${note ? `, pour ${note}` : ""}, jusqu’au ${until}`,
      revoke: "Annuler",
    },
  },
  shortcuts: {
    title: "Raccourcis clavier",
    commandMenu: "Ouvrir le menu de commandes",
    goTo: (label) => `Aller à ${label}`,
    add: "Ajouter une réservation ou un blocage (Calendrier, Réservations)",
    move: "Déplacer le calendrier de quatre semaines",
    today: "Revenir à aujourd’hui dans le calendrier",
    close: "Fermer le panneau ouvert",
  },
};

export const settings = { en, fr };
