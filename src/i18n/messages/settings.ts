/** The Settings page: appearance, the integrations switched on by environment variables, and keyboard shortcuts. */
const en = {
  title: "Settings",
  description: "Innkeep is configured with environment variables on the server. This page shows what is on.",
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
    webhook: {
      name: "Messages webhook",
      /** Followed by the endpoint, then `after`. */
      before: "Accepts guest messages at",
      after: "from an email parser or automation.",
    },
    extension: {
      name: "Browser extension",
      body: "Lets the Innkeep Companion extension add guest names, payouts, past stays and listing details from your own Airbnb and Booking.com pages.",
      link: "How to install it",
    },
    telegram: {
      name: "Telegram notifications",
      body: "Sends you a Telegram message each time a cleaning has to be arranged: a new check-out, or a cleaning added by hand. Needs a bot token and a chat.",
    },
    password: {
      name: "Password",
      body: "Asks for a password before any page opens. Set it before putting Innkeep on the internet.",
      signOut: "Sign out",
    },
    mcp: {
      name: "MCP server",
      body: "Lets an AI assistant read your calendar, revenue and suggestions, and block dates, over the Model Context Protocol.",
      config: "Client configuration",
    },
    /** "Change a variable in your environment or `.env` file and restart the server. The README lists them all." */
    footer: {
      beforeFile: "Change a variable in your environment or",
      afterFile: "file and restart the server. The",
      link: "README",
      after: "lists them all.",
    },
  },
  shortcuts: {
    title: "Keyboard shortcuts",
    commandMenu: "Open the command menu",
    goTo: (label: string) => `Go to ${label}`,
    add: "Add a booking or block (Calendar, Reservations)",
    move: "Move the calendar by four weeks",
    today: "Back to today in the calendar",
    conversations: "Next and previous conversation",
    close: "Close the open panel",
  },
};

const fr: typeof en = {
  title: "Réglages",
  description:
    "Innkeep se configure avec des variables d’environnement sur le serveur. Cette page montre ce qui est activé.",
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
    webhook: {
      name: "Webhook des messages",
      before: "Reçoit les messages des voyageurs sur",
      after: "depuis un analyseur d’e-mails ou une automatisation.",
    },
    extension: {
      name: "Extension de navigateur",
      body: "Permet à l’extension Innkeep Companion d’ajouter les noms des voyageurs, les versements, les séjours passés et les détails des annonces à partir de vos propres pages Airbnb et Booking.com.",
      link: "Comment l’installer",
    },
    telegram: {
      name: "Notifications Telegram",
      body: "Vous envoie un message Telegram chaque fois qu’un ménage est à demander : un nouveau départ, ou un ménage ajouté à la main. Nécessite le jeton d’un bot et une conversation.",
    },
    password: {
      name: "Mot de passe",
      body: "Demande un mot de passe avant d’ouvrir la moindre page. À définir avant de mettre Innkeep sur Internet.",
      signOut: "Se déconnecter",
    },
    mcp: {
      name: "Serveur MCP",
      body: "Permet à un assistant IA de lire votre calendrier, vos revenus et vos suggestions, et de bloquer des dates, via le Model Context Protocol.",
      config: "Configuration du client",
    },
    footer: {
      beforeFile: "Modifiez une variable dans votre environnement ou dans votre fichier",
      afterFile: "puis redémarrez le serveur. Le",
      link: "README",
      after: "les recense toutes.",
    },
  },
  shortcuts: {
    title: "Raccourcis clavier",
    commandMenu: "Ouvrir le menu de commandes",
    goTo: (label) => `Aller à ${label}`,
    add: "Ajouter une réservation ou un blocage (Calendrier, Réservations)",
    move: "Déplacer le calendrier de quatre semaines",
    today: "Revenir à aujourd’hui dans le calendrier",
    conversations: "Conversation suivante et précédente",
    close: "Fermer le panneau ouvert",
  },
};

export const settings = { en, fr };
