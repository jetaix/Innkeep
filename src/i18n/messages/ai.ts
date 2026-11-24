/**
 * The public AI page: what an assistant can do with Innkeep through its MCP
 * server, how to connect one, and where it stops. Every tool named here
 * exists in `features/mcp/server.ts`; keep the two in step.
 */
const en = {
  nav: "AI",
  title: "Innkeep for your AI assistant",
  description:
    "Innkeep has a built-in MCP server: Claude or another assistant can read your calendar, revenue and suggestions, and block dates when you ask. Here is how.",
  heading: "Ask your assistant about your rentals.",
  lead: "Innkeep has a built-in MCP server. Connect Claude, or any assistant that speaks the Model Context Protocol, and it can read your calendar, your revenue and your suggestions, and block dates when you tell it to.",
  wink: "Every product has an AI page now. This is ours.",
  talk: {
    label: "An example conversation",
    you: "You",
    assistant: "Assistant",
    turns: [
      {
        ask: "Who arrives this week?",
        answer:
          "Two arrivals. Léa Martin at Canal Loft on Tuesday for three nights, and Sam Wright at Harbour Studio on Wednesday for four.",
        tool: "list_reservations",
      },
      {
        ask: "Anything I should worry about?",
        answer:
          "One urgent item: Harbour Studio is double booked from 13 to 14 November. Sam Wright came through Airbnb, Ines Ferreira through Booking.com.",
        tool: "list_suggestions",
      },
      {
        ask: "Block the loft from 3 to 5 December for the plumber.",
        answer: "Blocked. Both platforms close those nights the next time they read your calendar link.",
        tool: "block_dates",
      },
    ],
    example: "Names and dates are examples.",
  },
  tools: {
    title: "Five things it can do.",
    intro:
      "Four of them only read. One changes something, and only inside Innkeep: it never touches your Airbnb or Booking.com account.",
    reads: "Reads",
    writes: "Changes",
    items: [
      {
        name: "list_properties",
        kind: "read",
        body: "Your places, with how many guests each takes and its nightly rate.",
      },
      {
        name: "list_reservations",
        kind: "read",
        body: "Stays and blocked dates in a period, across Airbnb, Booking.com and direct bookings, with guest names, payouts and a flag on double bookings.",
      },
      {
        name: "get_revenue",
        kind: "read",
        body: "Revenue, costs, net and occupancy for a month.",
      },
      {
        name: "list_suggestions",
        kind: "read",
        body: "What Innkeep thinks needs attention: double bookings, calendars that stopped syncing, pricing signals.",
      },
      {
        name: "block_dates",
        kind: "write",
        body: "Blocks nights on a place. It refuses when the dates overlap a stay, and the platforms close the nights at their next read of your calendar link, not at once.",
      },
    ] as { name: string; kind: "read" | "write"; body: string }[],
  },
  connect: {
    title: "Connect it in three steps.",
    intro:
      "This works with a self-hosted Innkeep today. Your Settings page shows the same snippets with your own address filled in.",
    steps: [
      {
        title: "Choose a token",
        body: "A long random text only you know. Give it to Innkeep as MCP_TOKEN in your settings file, then restart.",
      },
      {
        title: "Tell your assistant where Innkeep is",
        body: "For Claude Code, run this in a terminal, with your address and your token:",
      },
      {
        title: "Ask it something",
        body: "For example: “What are my next arrivals in Innkeep?”",
      },
    ],
    other: "Another assistant that accepts an MCP server over HTTP takes this configuration:",
    desktop: "Claude Desktop needs one more line; Settings in your Innkeep has it ready to copy.",
  },
  limits: {
    title: "Where it stops.",
    items: [
      {
        term: "It sees guest names and payouts",
        body: "Whatever the assistant reads goes to the company that runs it. Connect one you trust with that.",
      },
      {
        term: "It cannot reach the platforms",
        body: "No prices changed, no messages sent, no listing edited. Blocking dates is the only thing it can change.",
      },
      {
        term: "The token is the only lock",
        body: "Anyone holding it can read your bookings. Keep it out of screenshots, and change it if it leaks.",
      },
      {
        term: "It is off until you turn it on",
        body: "Without MCP_TOKEN the server refuses every request.",
      },
    ],
  },
  also: {
    title: "The other two places AI shows up.",
    advice: {
      term: "Advice from Claude",
      body: "Optional. With your own Anthropic key, Innkeep sends a summary of your account and Claude writes suggestions for your listings. Guest names are never sent.",
    },
    install: {
      term: "An assistant that installs Innkeep",
      body: "The home page has a ready-made request to paste into Claude, ChatGPT or another assistant. It installs Innkeep for you, or guides you step by step.",
      link: "See the request",
    },
  },
  cta: {
    title: "Try it on your own bookings.",
    access: "Request early access",
    self: "Self-host from GitHub",
  },
};

const fr: typeof en = {
  nav: "IA",
  title: "Innkeep pour votre assistant IA",
  description:
    "Innkeep intègre un serveur MCP : Claude ou un autre assistant peut lire votre calendrier, vos revenus et vos suggestions, et bloquer des dates à votre demande.",
  heading: "Interrogez votre assistant sur vos locations.",
  lead: "Innkeep intègre un serveur MCP. Reliez Claude, ou tout assistant compatible avec le Model Context Protocol : il peut lire votre calendrier, vos revenus et vos suggestions, et bloquer des dates quand vous le lui demandez.",
  wink: "Tous les produits ont une page IA désormais. Voici la nôtre.",
  talk: {
    label: "Un exemple de conversation",
    you: "Vous",
    assistant: "Assistant",
    turns: [
      {
        ask: "Qui arrive cette semaine ?",
        answer:
          "Deux arrivées. Léa Martin au Canal Loft mardi pour trois nuits, et Sam Wright au Harbour Studio mercredi pour quatre.",
        tool: "list_reservations",
      },
      {
        ask: "Y a-t-il quelque chose d’inquiétant ?",
        answer:
          "Un point urgent : Harbour Studio est réservé deux fois du 13 au 14 novembre. Sam Wright est passé par Airbnb, Ines Ferreira par Booking.com.",
        tool: "list_suggestions",
      },
      {
        ask: "Bloque le loft du 3 au 5 décembre pour le plombier.",
        answer:
          "C’est bloqué. Les deux plateformes fermeront ces nuits à leur prochaine lecture de votre lien de calendrier.",
        tool: "block_dates",
      },
    ],
    example: "Les noms et les dates sont des exemples.",
  },
  tools: {
    title: "Cinq choses qu’il sait faire.",
    intro:
      "Quatre ne font que lire. Une seule modifie quelque chose, et uniquement dans Innkeep : elle ne touche jamais à votre compte Airbnb ou Booking.com.",
    reads: "Lit",
    writes: "Modifie",
    items: [
      {
        name: "list_properties",
        kind: "read",
        body: "Vos logements, avec leur capacité et leur prix par nuit.",
      },
      {
        name: "list_reservations",
        kind: "read",
        body: "Les séjours et les dates bloquées d’une période, sur Airbnb, Booking.com et en direct, avec les noms des voyageurs, les versements et un signal sur les doubles réservations.",
      },
      {
        name: "get_revenue",
        kind: "read",
        body: "Les revenus, les charges, le net et le taux d’occupation d’un mois.",
      },
      {
        name: "list_suggestions",
        kind: "read",
        body: "Ce qui, selon Innkeep, demande votre attention : doubles réservations, calendriers qui ne se synchronisent plus, signaux de prix.",
      },
      {
        name: "block_dates",
        kind: "write",
        body: "Bloque des nuits sur un logement. Il refuse si les dates chevauchent un séjour, et les plateformes ferment ces nuits à leur prochaine lecture de votre lien de calendrier, pas immédiatement.",
      },
    ],
  },
  connect: {
    title: "Le relier en trois étapes.",
    intro:
      "Cela fonctionne dès aujourd’hui avec un Innkeep auto-hébergé. Votre page Réglages affiche les mêmes extraits, avec votre adresse déjà remplie.",
    steps: [
      {
        title: "Choisissez un jeton",
        body: "Un long texte aléatoire connu de vous seul. Donnez-le à Innkeep sous le nom MCP_TOKEN dans votre fichier de réglages, puis redémarrez.",
      },
      {
        title: "Indiquez à votre assistant où se trouve Innkeep",
        body: "Pour Claude Code, lancez ceci dans un terminal, avec votre adresse et votre jeton :",
      },
      {
        title: "Posez-lui une question",
        body: "Par exemple : « Quelles sont mes prochaines arrivées dans Innkeep ? »",
      },
    ],
    other: "Un autre assistant qui accepte un serveur MCP en HTTP utilise cette configuration :",
    desktop:
      "Claude Desktop demande une ligne de plus ; les Réglages de votre Innkeep la proposent prête à copier.",
  },
  limits: {
    title: "Là où il s’arrête.",
    items: [
      {
        term: "Il voit les noms des voyageurs et les versements",
        body: "Ce que lit l’assistant part chez l’entreprise qui le fait fonctionner. Reliez-en un à qui vous confiez ces informations.",
      },
      {
        term: "Il ne peut pas atteindre les plateformes",
        body: "Aucun prix modifié, aucun message envoyé, aucune annonce changée. Bloquer des dates est la seule chose qu’il peut modifier.",
      },
      {
        term: "Le jeton est le seul verrou",
        body: "Quiconque le détient peut lire vos réservations. Ne le laissez pas apparaître dans une capture d’écran, et changez-le s’il fuit.",
      },
      {
        term: "Il est éteint tant que vous ne l’allumez pas",
        body: "Sans MCP_TOKEN, le serveur refuse toute demande.",
      },
    ],
  },
  also: {
    title: "Les deux autres endroits où l’IA intervient.",
    advice: {
      term: "Les conseils de Claude",
      body: "Facultatif. Avec votre propre clé Anthropic, Innkeep envoie un résumé de votre compte et Claude rédige des suggestions pour vos annonces. Les noms des voyageurs ne sont jamais envoyés.",
    },
    install: {
      term: "Un assistant qui installe Innkeep",
      body: "La page d’accueil propose une demande toute prête à coller dans Claude, ChatGPT ou un autre assistant. Il installe Innkeep pour vous, ou vous guide pas à pas.",
      link: "Voir la demande",
    },
  },
  cta: {
    title: "Essayez-le sur vos propres réservations.",
    access: "Demander un accès anticipé",
    self: "Auto-héberger depuis GitHub",
  },
};

export const ai = { en, fr };
