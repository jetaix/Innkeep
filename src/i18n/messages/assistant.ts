/** The Claude section of the Suggestions page: connecting Claude with an API key, what it is sent, and other assistants over MCP. */
const en = {
  title: "Claude",
  description: "Connect Claude to get advice written from your own reservations, payouts and nightly prices.",
  status: {
    connected: "Connected",
    notConnected: "Not connected",
    saved: (ending: string, model: string) =>
      `Key ending in ${ending}, kept in your Innkeep database. Model: ${model}.`,
    environment: (ending: string, model: string) =>
      `Key ending in ${ending}, set as ANTHROPIC_API_KEY on the server. Model: ${model}.`,
    token: (model: string) => `Signed in through ANTHROPIC_AUTH_TOKEN on the server. Model: ${model}.`,
    disconnect: "Disconnect",
    disconnectConfirm: "Remove the saved API key from Innkeep? You can paste it again later.",
    environmentNote: "To change it, edit the server's environment and restart Innkeep.",
  },
  steps: {
    title: "Connect Claude",
    subtitle: "Three steps, about two minutes. You need an Anthropic account.",
    account: {
      title: "Create an API key",
      body: "Sign in to the Anthropic Console, add a little credit under Billing if the account is new, then create a key and copy it. It starts with sk-ant-.",
      link: "Open the Anthropic Console",
    },
    paste: {
      title: "Paste it here",
      body: "Innkeep checks the key with Anthropic before keeping it. The check is free.",
      done: "Done. Claude is connected.",
    },
    ask: {
      title: "Ask for advice",
      body: "Press the button below. Claude reads a summary of your account and answers in about a minute.",
      waiting: "Available once Claude is connected.",
    },
  },
  connect: {
    label: "Anthropic API key",
    hint: "Kept on this server only, in your Innkeep database. Never shown again and never sent to your browser.",
    submit: "Test and connect",
    testing: "Testing…",
  },
  errors: {
    format: "That does not look like an Anthropic API key. It starts with sk-ant-.",
    rejected: "Anthropic rejected this key. Copy it again from the Console; a key is shown only once.",
    model: (model: string) =>
      `The key works, but it may not use ${model}. Check the key's workspace in the Console, or set AI_MODEL on the server to a model it can use.`,
    connection: "Could not reach Anthropic from this server. Check its internet access and try again.",
    api: (status: number | null) =>
      `Anthropic answered with an error (${status ?? "unknown"}). Try again in a minute.`,
  },
  data: {
    title: "What Claude receives",
    intro: "Each time you ask for advice, Innkeep sends one summary of your account to Anthropic:",
    sent: [
      "Your listing: title, description, house rules, capacity and address, and what each platform's public page shows (text, amenities, number of photos).",
      "Public guest reviews: their text and score, without the guest's name.",
      "Stays: dates, platform and payout. For finished stays, what each night earned.",
      "Nightly prices of free nights on each platform, by month, and the nights where they disagree.",
      "Monthly revenue, costs and occupancy for the past year and the next three months.",
      "The suggestions Innkeep's own rules already made.",
    ],
    neverTitle: "Never sent:",
    never:
      "guest names, messages, phone numbers, confirmation codes, calendar links or anything from another host.",
    counts: (stays: number, prices: number) =>
      `In your account today: ${stays} finished stay${stays === 1 ? "" : "s"} with a real payout and ${prices} nightly price${prices === 1 ? "" : "s"} for nights still free.`,
    thin: "With few real figures, the advice will be general. Update your reservations and read your calendars on the Pricing page first.",
    market:
      "Claude has no data on other listings or on your local market. Its pricing advice comes from your own history and from the prices your platforms show.",
    cost: "Each request is billed to your Anthropic account, usually a few cents. Nothing runs in the background: Claude is only called when you press the button.",
  },
  other: {
    title: "Another assistant",
    body: "Innkeep also has an MCP server, so an assistant you already use (Claude Desktop, Claude Code and others) can read your calendar, revenue and suggestions, and block dates.",
    link: "Set it up in Settings",
  },
  /** Shown on the Suggestions page while Claude is not connected. */
  cta: {
    before: "Optional: ",
    link: "connect Claude",
    after: " to get advice written from your own figures. The suggestions above work without it.",
  },
};

const fr: typeof en = {
  title: "Claude",
  description:
    "Connectez Claude pour obtenir des conseils rédigés à partir de vos propres réservations, versements et prix par nuit.",
  status: {
    connected: "Connecté",
    notConnected: "Non connecté",
    saved: (ending, model) =>
      `Clé se terminant par ${ending}, conservée dans votre base Innkeep. Modèle : ${model}.`,
    environment: (ending, model) =>
      `Clé se terminant par ${ending}, définie dans ANTHROPIC_API_KEY sur le serveur. Modèle : ${model}.`,
    token: (model) => `Connecté via ANTHROPIC_AUTH_TOKEN sur le serveur. Modèle : ${model}.`,
    disconnect: "Déconnecter",
    disconnectConfirm:
      "Supprimer la clé d’API enregistrée dans Innkeep ? Vous pourrez la coller de nouveau plus tard.",
    environmentNote: "Pour la changer, modifiez l’environnement du serveur puis redémarrez Innkeep.",
  },
  steps: {
    title: "Connecter Claude",
    subtitle: "Trois étapes, environ deux minutes. Il vous faut un compte Anthropic.",
    account: {
      title: "Créez une clé d’API",
      body: "Connectez-vous à la Console Anthropic, ajoutez un peu de crédit dans Billing si le compte est nouveau, puis créez une clé et copiez-la. Elle commence par sk-ant-.",
      link: "Ouvrir la Console Anthropic",
    },
    paste: {
      title: "Collez-la ici",
      body: "Innkeep vérifie la clé auprès d’Anthropic avant de la conserver. La vérification est gratuite.",
      done: "C’est fait. Claude est connecté.",
    },
    ask: {
      title: "Demandez des conseils",
      body: "Appuyez sur le bouton ci-dessous. Claude lit un résumé de votre compte et répond en une minute environ.",
      waiting: "Disponible une fois Claude connecté.",
    },
  },
  connect: {
    label: "Clé d’API Anthropic",
    hint: "Conservée uniquement sur ce serveur, dans votre base Innkeep. Elle n’est plus jamais affichée ni envoyée à votre navigateur.",
    submit: "Tester et connecter",
    testing: "Test en cours…",
  },
  errors: {
    format: "Cela ne ressemble pas à une clé d’API Anthropic. Elle commence par sk-ant-.",
    rejected:
      "Anthropic a refusé cette clé. Copiez-la de nouveau depuis la Console ; une clé n’est affichée qu’une fois.",
    model: (model) =>
      `La clé fonctionne, mais elle ne peut pas utiliser ${model}. Vérifiez l’espace de travail de la clé dans la Console, ou définissez AI_MODEL sur le serveur avec un modèle autorisé.`,
    connection:
      "Impossible de joindre Anthropic depuis ce serveur. Vérifiez son accès à Internet puis réessayez.",
    api: (status) =>
      `Anthropic a répondu par une erreur (${status ?? "inconnue"}). Réessayez dans une minute.`,
  },
  data: {
    title: "Ce que Claude reçoit",
    intro: "À chaque demande de conseils, Innkeep envoie à Anthropic un seul résumé de votre compte :",
    sent: [
      "Votre annonce : titre, description, règlement intérieur, capacité et adresse, et ce qu’affiche la page publique de chaque plateforme (texte, équipements, nombre de photos).",
      "Les avis publics des voyageurs : leur texte et leur note, sans le nom du voyageur.",
      "Les séjours : dates, plateforme et versement. Pour les séjours terminés, ce que chaque nuit a rapporté.",
      "Les prix par nuit des nuits libres sur chaque plateforme, par mois, et les nuits où ils divergent.",
      "Revenus, charges et taux d’occupation mensuels de l’année écoulée et des trois prochains mois.",
      "Les suggestions déjà faites par les règles d’Innkeep.",
    ],
    neverTitle: "Jamais envoyé :",
    never:
      "noms des voyageurs, messages, numéros de téléphone, codes de confirmation, liens de calendrier, ni quoi que ce soit d’un autre hôte.",
    counts: (stays, prices) =>
      `Dans votre compte aujourd’hui : ${stays} séjour${stays > 1 ? "s" : ""} terminé${stays > 1 ? "s" : ""} avec un versement réel et ${prices} prix par nuit pour des nuits encore libres.`,
    thin: "Avec peu de chiffres réels, les conseils resteront généraux. Mettez d’abord à jour vos réservations et lisez vos calendriers depuis la page Tarifs.",
    market:
      "Claude n’a aucune donnée sur les autres annonces ni sur votre marché local. Ses conseils de prix viennent de votre propre historique et des prix affichés par vos plateformes.",
    cost: "Chaque demande est facturée sur votre compte Anthropic, en général quelques centimes. Rien ne tourne en arrière-plan : Claude n’est appelé que lorsque vous appuyez sur le bouton.",
  },
  other: {
    title: "Un autre assistant",
    body: "Innkeep dispose aussi d’un serveur MCP : un assistant que vous utilisez déjà (Claude Desktop, Claude Code et d’autres) peut lire votre calendrier, vos revenus et vos suggestions, et bloquer des dates.",
    link: "Le configurer dans les Réglages",
  },
  cta: {
    before: "Facultatif : ",
    link: "connectez Claude",
    after:
      " pour obtenir des conseils rédigés à partir de vos propres chiffres. Les suggestions ci-dessus fonctionnent sans cela.",
  },
};

export const assistant = { en, fr };
