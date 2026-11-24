import type { GuideSlug } from "@/features/marketing/guides";

/**
 * The guides: plain answers to the questions a host with one or two places
 * types into a search engine. Each one must stand on its own for a reader who
 * never installs Innkeep, and say only what is true of the platforms' own
 * calendar links. No invented numbers; keep both languages saying the same thing.
 */
type Section = { heading: string; paragraphs: string[]; steps?: string[] };

type Guide = {
  /** The page title and H1. */
  title: string;
  /** The meta description, 150 to 160 characters. */
  description: string;
  lead: string;
  sections: Section[];
  faq: { question: string; answer: string }[];
};

type Shape = {
  nav: string;
  heading: string;
  description: string;
  intro: string;
  all: string;
  read: string;
  updated: (date: string) => string;
  questions: string;
  more: string;
  cta: { title: string; body: string; install: string; demo: string };
  guides: Record<GuideSlug, Guide>;
};

const en: Shape = {
  nav: "Guides",
  heading: "Guides for hosts with one or two places",
  description:
    "Plain guides for small hosts: sync Airbnb and Booking.com calendars, avoid double bookings, pick a free channel manager and work out what a month pays.",
  intro:
    "Short, practical answers to the questions that come up when you rent out a place on more than one platform. They work whether or not you use Innkeep.",
  all: "All guides",
  read: "Read the guide",
  updated: (date) => `Updated on ${date}`,
  questions: "Common questions",
  more: "More guides",
  cta: {
    title: "Innkeep does this for you.",
    body: "One calendar for Airbnb and Booking.com, revenue after costs, and a flag when two bookings overlap. Hosted in early access, or free and self-hosted.",
    install: "Request early access",
    demo: "Self-host from GitHub",
  },
  guides: {
    "sync-airbnb-booking-calendars": {
      title: "How to sync your Airbnb and Booking.com calendars",
      description:
        "Step by step: export the calendar link from Airbnb and Booking.com, import each one into the other, and know what a calendar link can and cannot do.",
      lead: "If the same place is listed on Airbnb and on Booking.com, each platform has to learn about the nights the other one sold. Both give every host a calendar link for exactly this. Here is how to connect them, and what to expect once they are connected.",
      sections: [
        {
          heading: "What a calendar link is",
          paragraphs: [
            "A calendar link (often called an iCal link) is a web address that lists the nights your place is taken. Airbnb publishes one for each listing and so does Booking.com. When one platform reads the other's link, it closes the nights that are already booked there.",
            "The link carries dates and nothing else. Guest names, prices, payouts and messages are not in it. That is by design: those details are reserved for software partners approved by each platform.",
          ],
        },
        {
          heading: "Connect the two calendars",
          paragraphs: [
            "You do the same thing twice, once in each direction. The menu names below are the ones each platform used when this guide was written; they move from time to time.",
          ],
          steps: [
            "On Airbnb, open Calendar, then Availability, then Connect calendars, and choose Export calendar. Copy the link.",
            "On Booking.com, open the Extranet, then Rates & Availability, then Sync calendars. Add a calendar and paste the Airbnb link.",
            "Still on Booking.com, in the same screen, choose Export and copy the Booking.com link.",
            "Back on Airbnb, in Connect calendars, choose to import a calendar and paste the Booking.com link.",
            "Make a test: block one night on one platform and check, later that day, that it is closed on the other.",
          ],
        },
        {
          heading: "What to expect afterwards",
          paragraphs: [
            "The sync is not instant. Each platform re-reads the links it was given on its own schedule, and you cannot make it go faster. Between two readings, the same night can still be sold twice. It is rare, and it is the one real weakness of calendar links.",
            "Two platforms linked to each other need no extra tool. A tool starts to help when you also take direct bookings, when you want to see every stay on one timeline, or when you want to be told the moment two bookings overlap.",
          ],
        },
        {
          heading: "Where Innkeep fits",
          paragraphs: [
            "Innkeep reads both links every 15 minutes and gives each platform a link that contains everything except that platform's own bookings, so a platform never sees its reservations echoed back. Direct bookings and blocked dates you add in Innkeep are shared with both. If two stays ever overlap, it is flagged on the calendar and at the top of your suggestions.",
          ],
        },
      ],
      faq: [
        {
          question: "Is syncing calendars between Airbnb and Booking.com free?",
          answer:
            "Yes. Both platforms give every host a calendar link at no cost, and importing one into the other is free too.",
        },
        {
          question: "Do I need a channel manager for two platforms?",
          answer:
            "No. You can link the two calendars directly. A channel manager becomes useful for direct bookings, a single view of all stays, revenue after costs, or instant sync through the platforms' partner connections.",
        },
        {
          question: "Why is a night still open on one platform after it was booked on the other?",
          answer:
            "The platform has not re-read the calendar link yet. Each one refreshes on its own schedule. If it stays open for more than a day, check that the link was pasted in full and is still listed as connected.",
        },
      ],
    },
    "avoid-double-bookings": {
      title: "How to avoid double bookings on Airbnb and Booking.com",
      description:
        "Why double bookings happen when you list on two platforms, what calendar links cannot prevent, and the habits and tools that keep the risk low.",
      lead: "A double booking is two guests holding a confirmed reservation for the same night. It is the thing small hosts fear most when they add a second platform. It cannot be ruled out entirely with calendar links, but it can be made rare, and caught early when it does happen.",
      sections: [
        {
          heading: "Why it happens",
          paragraphs: [
            "Each platform only knows about the other's bookings when it re-reads the calendar link you gave it. That reading happens on the platform's own schedule. If a guest books on Airbnb and another books the same night on Booking.com before the next reading, both bookings are accepted.",
            "The other common cause is a link that quietly stopped working: it was replaced, removed during a listing edit, or pasted incompletely. Nothing looks wrong until two bookings collide.",
          ],
        },
        {
          heading: "Habits that lower the risk",
          paragraphs: ["None of these needs any software."],
          steps: [
            "Check once a week that each platform still shows the other's calendar as connected.",
            "After changing a listing, look at the calendar connection again: some edits reset it.",
            "Block dates on both platforms yourself when you take a booking by phone or from a returning guest.",
            "Avoid instant booking for same-day and next-day arrivals on one of the two platforms, where the window for a clash is smallest to react to.",
            "When a booking arrives, open the other platform and confirm that the nights closed.",
          ],
        },
        {
          heading: "What software can and cannot do",
          paragraphs: [
            "Software that works from calendar links, Innkeep included, cannot prevent a clash inside the gap between two readings. What it can do is notice the overlap at once and tell you, so you can contact one guest the same day rather than on the day of arrival.",
            "Software that connects through the platforms' partner programmes updates availability within seconds, which closes most of the gap. If you cannot accept any risk of a clash, that is the kind of tool to choose; the Alternatives page lists them with their prices.",
          ],
        },
        {
          heading: "If it happens anyway",
          paragraphs: [
            "Act the same day. Decide which booking you keep, contact the other guest before they hear it from the platform, and follow that platform's own cancellation process. Platforms treat a host cancellation seriously, so the earlier you raise it, the more options the guest has.",
          ],
        },
      ],
      faq: [
        {
          question: "Can calendar sync fully prevent double bookings?",
          answer:
            "No. Calendar links are re-read on each platform's schedule, so a short window always remains. Only a connection through the platforms' partner programmes updates availability in near real time.",
        },
        {
          question: "How do I know my calendars stopped syncing?",
          answer:
            "Each platform shows the imported calendar and when it was last read. In Innkeep, a calendar that has stopped syncing appears in your suggestions and on the Data page.",
        },
      ],
    },
    "free-channel-manager-small-hosts": {
      title: "A free channel manager for one or two rentals: what to look for",
      description:
        "What a channel manager does, what a host with one or two places really needs, and how free options compare, including the open-source ones.",
      lead: "Most channel managers are built for agencies that run dozens of listings, and priced the same way. With one or two places, you need far less, and you can get it without a monthly bill. Here is how to decide.",
      sections: [
        {
          heading: "What a channel manager does",
          paragraphs: [
            "A channel manager keeps your availability the same on every platform where your place is listed. The larger ones also bring guest messages into one inbox, push price changes to every platform, send automatic messages and build a direct booking website.",
            "They reach the platforms in one of two ways. Approved partners use the platforms' own connections, which update within seconds and carry reservations, messages and prices. Everyone else uses calendar links, which are free and open to every host but carry only dates and are re-read on a delay.",
          ],
        },
        {
          heading: "What you need with one or two places",
          paragraphs: ["Before comparing products, check which of these you would use every week."],
          steps: [
            "One calendar where every stay appears, whatever platform it came from.",
            "A warning when two bookings overlap or when a calendar stops syncing.",
            "What each month pays once cleaning, commission and bills are taken off.",
            "A place to note direct bookings and blocked dates that both platforms then respect.",
          ],
        },
        {
          heading: "The free options",
          paragraphs: [
            "Linking the two platforms' calendars directly is free and enough for many hosts. It gives you no single view and no warning, but it works.",
            "Some commercial products have a free tier, usually with limits on support or features. They use the partner connections, so sync is fast, and your data lives on their servers.",
            "Open-source tools are free to run on your own computer. They rely on calendar links, so sync is slower, and in exchange nothing is stored anywhere but with you. Innkeep is one of them. The Alternatives page compares it with the commercial products one by one, with prices read on each vendor's site.",
          ],
        },
        {
          heading: "When to pay for one",
          paragraphs: [
            "Pay when the delay of calendar links costs you: many last-minute bookings, short stays back to back, or more listings than you can check by eye. Pay as well if you want replies and price changes sent to the platforms from one screen, which only partner software can do.",
          ],
        },
      ],
      faq: [
        {
          question: "Is there a completely free channel manager?",
          answer:
            "Yes. Open-source tools such as Innkeep cost nothing and run on your own computer, and some commercial products have a free tier. The trade-off is slower sync for the former and feature limits for the latter.",
        },
        {
          question: "Is Innkeep an official Airbnb or Booking.com partner?",
          answer:
            "No. Innkeep is not affiliated with either. It works from the calendar links every host is given, plus a Chrome extension that reads your own pages while you are signed in.",
        },
      ],
    },
    "rental-income-after-costs": {
      title: "How to work out what your rental really pays each month",
      description:
        "Payouts are not profit. A simple method to subtract cleaning, platform commission, subscriptions and bills, and see the net income of a short-term rental.",
      lead: "The figure a platform shows you is what guests paid or what you will be paid out, not what you keep. For one or two places, a clear monthly net takes four numbers and ten minutes.",
      sections: [
        {
          heading: "Start from the right figure",
          paragraphs: [
            "Take the revenue for stays that happen in the month, not the money that landed in your bank that month. Payouts often arrive after check-in, so counting by payout date moves income into the wrong month and hides bookings that are confirmed but not yet paid.",
          ],
        },
        {
          heading: "Subtract four kinds of cost",
          paragraphs: ["Each behaves differently, which is why they are worth keeping apart."],
          steps: [
            "Per stay: cleaning and laundry. Multiply by the number of check-outs in the month, not by the number of nights.",
            "A share of revenue: the commission your platform keeps. Use the rate shown in your own account, and note that it can differ between platforms.",
            "Every month or year: subscriptions, insurance, internet, software. Spread a yearly cost over twelve months.",
            "One-off: a repair, a replaced appliance, a plumber. Put it in the month it happened.",
          ],
        },
        {
          heading: "A worked example",
          paragraphs: [
            "Say a month has 28 booked nights across 9 stays and €4,609 of revenue. Cleaning at €55 a stay comes to €495. Commission comes to €324, and subscriptions and bills to €250. The net for the month is 4,609 − 495 − 324 − 250 = €3,540. These figures are an example, not a benchmark.",
            "Two months with the same revenue can leave very different amounts: nine short stays cost nine cleanings, three long ones cost three.",
          ],
        },
        {
          heading: "Keep it up without a spreadsheet",
          paragraphs: [
            "Innkeep does this sum for every month. You enter cleaning per stay, commission as a percentage, subscriptions and one-off bills once; it then shows revenue, costs and net month by month, including bookings that have not been paid out yet.",
          ],
        },
      ],
      faq: [
        {
          question: "Should I count income by payout date or by stay date?",
          answer:
            "By stay date. It matches each cost to the stay that caused it and shows confirmed bookings that have not been paid out yet.",
        },
        {
          question: "Does this replace my accounting or tax return?",
          answer:
            "No. It tells you what a month is worth so you can make decisions. Tax rules depend on your country and situation; ask an accountant for those.",
        },
      ],
    },
  },
};

const fr: Shape = {
  nav: "Guides",
  heading: "Des guides pour les hôtes qui ont un ou deux logements",
  description:
    "Des guides simples pour les petits hôtes : synchroniser Airbnb et Booking.com, éviter les doubles réservations, choisir un channel manager gratuit, calculer le net d’un mois.",
  intro:
    "Des réponses courtes et pratiques aux questions qui se posent quand on loue un logement sur plusieurs plateformes. Elles valent que vous utilisiez Innkeep ou non.",
  all: "Tous les guides",
  read: "Lire le guide",
  updated: (date) => `Mis à jour le ${date}`,
  questions: "Questions fréquentes",
  more: "Autres guides",
  cta: {
    title: "Innkeep le fait pour vous.",
    body: "Un seul calendrier pour Airbnb et Booking.com, les revenus une fois les charges déduites, et une alerte quand deux réservations se chevauchent. Hébergé en accès anticipé, ou gratuit et auto-hébergé.",
    install: "Demander un accès anticipé",
    demo: "Auto-héberger depuis GitHub",
  },
  guides: {
    "sync-airbnb-booking-calendars": {
      title: "Comment synchroniser vos calendriers Airbnb et Booking.com",
      description:
        "Pas à pas : exporter le lien de calendrier d’Airbnb et de Booking.com, importer chacun dans l’autre, et savoir ce qu’un lien de calendrier permet ou non.",
      lead: "Si le même logement est en ligne sur Airbnb et sur Booking.com, chaque plateforme doit apprendre quelles nuits l’autre a vendues. Les deux fournissent à tout hôte un lien de calendrier prévu pour cela. Voici comment les relier, et à quoi vous attendre ensuite.",
      sections: [
        {
          heading: "Ce qu’est un lien de calendrier",
          paragraphs: [
            "Un lien de calendrier (souvent appelé lien iCal) est une adresse web qui liste les nuits où votre logement est pris. Airbnb en publie un par annonce, Booking.com aussi. Quand une plateforme lit le lien de l’autre, elle ferme les nuits déjà réservées là-bas.",
            "Le lien contient des dates et rien d’autre. Les noms des voyageurs, les prix, les versements et les messages n’y figurent pas. C’est voulu : ces informations sont réservées aux logiciels partenaires agréés par chaque plateforme.",
          ],
        },
        {
          heading: "Relier les deux calendriers",
          paragraphs: [
            "Vous faites la même opération deux fois, une dans chaque sens. Les noms de menus ci-dessous sont ceux de chaque plateforme au moment où ce guide a été écrit ; ils changent de temps en temps.",
          ],
          steps: [
            "Sur Airbnb, ouvrez Calendrier, puis Disponibilités, puis Connecter les calendriers, et choisissez d’exporter le calendrier. Copiez le lien.",
            "Sur Booking.com, ouvrez l’Extranet, puis Tarifs et disponibilités, puis Synchroniser les calendriers. Ajoutez un calendrier et collez le lien Airbnb.",
            "Toujours sur Booking.com, dans le même écran, choisissez d’exporter et copiez le lien Booking.com.",
            "De retour sur Airbnb, dans Connecter les calendriers, choisissez d’importer un calendrier et collez le lien Booking.com.",
            "Faites un essai : bloquez une nuit sur une plateforme et vérifiez, plus tard dans la journée, qu’elle est fermée sur l’autre.",
          ],
        },
        {
          heading: "À quoi vous attendre ensuite",
          paragraphs: [
            "La synchronisation n’est pas instantanée. Chaque plateforme relit les liens qu’on lui a donnés à son propre rythme, et vous ne pouvez pas l’accélérer. Entre deux lectures, la même nuit peut encore être vendue deux fois. C’est rare, et c’est la seule vraie faiblesse des liens de calendrier.",
            "Deux plateformes reliées l’une à l’autre n’ont besoin d’aucun outil. Un outil devient utile quand vous prenez aussi des réservations en direct, quand vous voulez voir tous les séjours sur une seule frise, ou être prévenu dès que deux réservations se chevauchent.",
          ],
        },
        {
          heading: "Ce qu’Innkeep apporte",
          paragraphs: [
            "Innkeep lit les deux liens toutes les 15 minutes et fournit à chaque plateforme un lien qui contient tout sauf ses propres réservations : une plateforme ne voit donc jamais ses séjours lui revenir. Les réservations directes et les dates bloquées que vous ajoutez dans Innkeep sont partagées avec les deux. Si deux séjours se chevauchent, c’est signalé sur le calendrier et en tête de vos suggestions.",
          ],
        },
      ],
      faq: [
        {
          question: "La synchronisation des calendriers entre Airbnb et Booking.com est-elle gratuite ?",
          answer:
            "Oui. Les deux plateformes fournissent gratuitement un lien de calendrier à tout hôte, et importer l’un dans l’autre est gratuit aussi.",
        },
        {
          question: "Faut-il un channel manager pour deux plateformes ?",
          answer:
            "Non. Vous pouvez relier les deux calendriers directement. Un channel manager devient utile pour les réservations directes, une vue unique des séjours, les revenus nets, ou une synchronisation instantanée par les connexions partenaires des plateformes.",
        },
        {
          question:
            "Pourquoi une nuit reste-t-elle ouverte sur une plateforme alors qu’elle est réservée sur l’autre ?",
          answer:
            "La plateforme n’a pas encore relu le lien de calendrier. Chacune se met à jour à son rythme. Si la nuit reste ouverte plus d’une journée, vérifiez que le lien a été collé en entier et qu’il apparaît toujours comme connecté.",
        },
      ],
    },
    "avoid-double-bookings": {
      title: "Comment éviter les doubles réservations sur Airbnb et Booking.com",
      description:
        "Pourquoi les doubles réservations arrivent quand on loue sur deux plateformes, ce que les liens de calendrier ne peuvent pas empêcher, et comment réduire le risque.",
      lead: "Une double réservation, ce sont deux voyageurs qui ont chacun une réservation confirmée pour la même nuit. C’est ce que les petits hôtes craignent le plus en ajoutant une deuxième plateforme. Avec des liens de calendrier, on ne peut pas l’exclure tout à fait, mais on peut la rendre rare et la repérer tôt.",
      sections: [
        {
          heading: "Pourquoi cela arrive",
          paragraphs: [
            "Chaque plateforme ne connaît les réservations de l’autre qu’au moment où elle relit le lien de calendrier que vous lui avez donné. Cette lecture se fait à son propre rythme. Si un voyageur réserve sur Airbnb et qu’un autre réserve la même nuit sur Booking.com avant la lecture suivante, les deux réservations sont acceptées.",
            "L’autre cause fréquente est un lien qui a cessé de fonctionner sans bruit : il a été remplacé, supprimé lors d’une modification de l’annonce, ou collé incomplet. Rien ne paraît anormal jusqu’au jour où deux réservations se heurtent.",
          ],
        },
        {
          heading: "Les habitudes qui réduisent le risque",
          paragraphs: ["Aucune ne demande de logiciel."],
          steps: [
            "Vérifiez une fois par semaine que chaque plateforme affiche toujours le calendrier de l’autre comme connecté.",
            "Après avoir modifié une annonce, regardez de nouveau la connexion des calendriers : certaines modifications la réinitialisent.",
            "Bloquez vous-même les dates sur les deux plateformes quand vous prenez une réservation par téléphone ou d’un habitué.",
            "Évitez la réservation instantanée pour les arrivées du jour même et du lendemain sur l’une des deux plateformes : c’est là que vous avez le moins de temps pour réagir.",
            "Quand une réservation arrive, ouvrez l’autre plateforme et vérifiez que les nuits se sont fermées.",
          ],
        },
        {
          heading: "Ce qu’un logiciel peut faire ou non",
          paragraphs: [
            "Un logiciel qui travaille à partir des liens de calendrier, Innkeep compris, ne peut pas empêcher un conflit dans l’intervalle entre deux lectures. Il peut en revanche remarquer le chevauchement aussitôt et vous prévenir, pour que vous contactiez l’un des voyageurs le jour même plutôt que le jour de l’arrivée.",
            "Un logiciel connecté par les programmes partenaires des plateformes met à jour les disponibilités en quelques secondes, ce qui referme l’essentiel de l’intervalle. Si vous ne pouvez accepter aucun risque, c’est ce type d’outil qu’il faut choisir ; la page Alternatives les présente avec leurs prix.",
          ],
        },
        {
          heading: "Si cela arrive quand même",
          paragraphs: [
            "Agissez le jour même. Décidez quelle réservation vous gardez, contactez l’autre voyageur avant qu’il l’apprenne par la plateforme, et suivez la procédure d’annulation de cette plateforme. Les plateformes prennent au sérieux une annulation par l’hôte : plus vous la signalez tôt, plus le voyageur a de solutions.",
          ],
        },
      ],
      faq: [
        {
          question: "La synchronisation des calendriers empêche-t-elle totalement les doubles réservations ?",
          answer:
            "Non. Les liens de calendrier sont relus au rythme de chaque plateforme, il reste donc toujours un court intervalle. Seule une connexion par les programmes partenaires met à jour les disponibilités en quasi temps réel.",
        },
        {
          question: "Comment savoir que mes calendriers ne se synchronisent plus ?",
          answer:
            "Chaque plateforme affiche le calendrier importé et la date de sa dernière lecture. Dans Innkeep, un calendrier qui ne se synchronise plus apparaît dans vos suggestions et sur la page Données.",
        },
      ],
    },
    "free-channel-manager-small-hosts": {
      title: "Un channel manager gratuit pour un ou deux logements : que regarder",
      description:
        "Ce que fait un channel manager, ce dont un hôte avec un ou deux logements a vraiment besoin, et comment se comparent les options gratuites, open source comprises.",
      lead: "La plupart des channel managers sont conçus pour des agences qui gèrent des dizaines d’annonces, et tarifés en conséquence. Avec un ou deux logements, il vous faut bien moins, et vous pouvez l’avoir sans abonnement. Voici comment décider.",
      sections: [
        {
          heading: "Ce que fait un channel manager",
          paragraphs: [
            "Un channel manager garde vos disponibilités identiques sur toutes les plateformes où votre logement est en ligne. Les plus complets réunissent aussi les messages des voyageurs dans une seule boîte, envoient les changements de prix à chaque plateforme, expédient des messages automatiques et créent un site de réservation directe.",
            "Ils atteignent les plateformes de deux façons. Les partenaires agréés utilisent les connexions propres aux plateformes, qui se mettent à jour en quelques secondes et transportent réservations, messages et prix. Tous les autres utilisent les liens de calendrier, gratuits et ouverts à tout hôte, mais qui ne contiennent que des dates et sont relus avec un délai.",
          ],
        },
        {
          heading: "Ce qu’il vous faut avec un ou deux logements",
          paragraphs: ["Avant de comparer les produits, voyez ce que vous utiliseriez chaque semaine."],
          steps: [
            "Un calendrier où chaque séjour apparaît, quelle que soit la plateforme d’origine.",
            "Une alerte quand deux réservations se chevauchent ou qu’un calendrier ne se synchronise plus.",
            "Ce que chaque mois rapporte une fois déduits le ménage, la commission et les factures.",
            "Un endroit où noter les réservations directes et les dates bloquées, que les deux plateformes respectent ensuite.",
          ],
        },
        {
          heading: "Les options gratuites",
          paragraphs: [
            "Relier directement les calendriers des deux plateformes est gratuit et suffit à beaucoup d’hôtes. Vous n’avez ni vue unique ni alerte, mais cela fonctionne.",
            "Certains produits commerciaux ont une offre gratuite, en général limitée en assistance ou en fonctionnalités. Ils utilisent les connexions partenaires, la synchronisation est donc rapide, et vos données sont stockées sur leurs serveurs.",
            "Les outils open source sont gratuits et tournent sur votre propre ordinateur. Ils reposent sur les liens de calendrier, la synchronisation est donc plus lente ; en échange, rien n’est stocké ailleurs que chez vous. Innkeep en fait partie. La page Alternatives le compare aux produits commerciaux un par un, avec les prix lus sur le site de chaque éditeur.",
          ],
        },
        {
          heading: "Quand payer",
          paragraphs: [
            "Payez quand le délai des liens de calendrier vous coûte : beaucoup de réservations de dernière minute, des séjours courts qui s’enchaînent, ou plus d’annonces que vous ne pouvez en surveiller à l’œil. Payez aussi si vous voulez envoyer réponses et changements de prix aux plateformes depuis un seul écran, ce que seuls les logiciels partenaires peuvent faire.",
          ],
        },
      ],
      faq: [
        {
          question: "Existe-t-il un channel manager entièrement gratuit ?",
          answer:
            "Oui. Des outils open source comme Innkeep ne coûtent rien et tournent sur votre ordinateur, et certains produits commerciaux ont une offre gratuite. La contrepartie : une synchronisation plus lente pour les premiers, des fonctionnalités limitées pour les seconds.",
        },
        {
          question: "Innkeep est-il un partenaire officiel d’Airbnb ou de Booking.com ?",
          answer:
            "Non. Innkeep n’a aucun lien avec eux. Il travaille à partir des liens de calendrier fournis à tout hôte, et d’une extension Chrome qui lit vos propres pages quand vous êtes connecté.",
        },
      ],
    },
    "rental-income-after-costs": {
      title: "Comment calculer ce que votre location rapporte vraiment chaque mois",
      description:
        "Un versement n’est pas un bénéfice. Une méthode simple pour déduire ménage, commission, abonnements et factures, et voir le revenu net d’une location courte durée.",
      lead: "Le montant qu’affiche une plateforme est ce que les voyageurs ont payé ou ce qui vous sera versé, pas ce que vous gardez. Pour un ou deux logements, un net mensuel clair demande quatre chiffres et dix minutes.",
      sections: [
        {
          heading: "Partir du bon montant",
          paragraphs: [
            "Prenez les revenus des séjours qui ont lieu dans le mois, pas l’argent arrivé sur votre compte ce mois-là. Les versements arrivent souvent après l’arrivée du voyageur : compter par date de versement déplace des revenus dans le mauvais mois et masque les réservations confirmées mais pas encore payées.",
          ],
        },
        {
          heading: "Déduire quatre types de charges",
          paragraphs: ["Chacun se comporte différemment, d’où l’intérêt de les séparer."],
          steps: [
            "Par séjour : le ménage et le linge. Multipliez par le nombre de départs du mois, pas par le nombre de nuits.",
            "Une part des revenus : la commission que garde votre plateforme. Prenez le taux affiché dans votre propre compte ; il peut différer d’une plateforme à l’autre.",
            "Chaque mois ou chaque année : abonnements, assurance, internet, logiciels. Répartissez une charge annuelle sur douze mois.",
            "Ponctuelles : une réparation, un appareil remplacé, un plombier. Comptez-les dans le mois où elles surviennent.",
          ],
        },
        {
          heading: "Un exemple chiffré",
          paragraphs: [
            "Prenons un mois avec 28 nuits réservées sur 9 séjours et 4 609 € de revenus. Le ménage, à 55 € par séjour, représente 495 €. La commission s’élève à 324 €, les abonnements et factures à 250 €. Le net du mois est de 4 609 − 495 − 324 − 250 = 3 540 €. Ces chiffres sont un exemple, pas une référence.",
            "Deux mois aux revenus identiques peuvent laisser des montants très différents : neuf séjours courts coûtent neuf ménages, trois longs en coûtent trois.",
          ],
        },
        {
          heading: "Tenir le compte sans tableur",
          paragraphs: [
            "Innkeep fait ce calcul pour chaque mois. Vous saisissez une fois le ménage par séjour, la commission en pourcentage, les abonnements et les factures ponctuelles ; il affiche ensuite revenus, charges et net mois par mois, y compris les réservations qui ne vous ont pas encore été versées.",
          ],
        },
      ],
      faq: [
        {
          question: "Faut-il compter les revenus à la date du versement ou à la date du séjour ?",
          answer:
            "À la date du séjour. Chaque charge est ainsi rattachée au séjour qui l’a causée, et les réservations confirmées mais pas encore versées apparaissent.",
        },
        {
          question: "Cela remplace-t-il ma comptabilité ou ma déclaration fiscale ?",
          answer:
            "Non. Cela vous dit ce que vaut un mois pour décider. Les règles fiscales dépendent de votre pays et de votre situation ; voyez un comptable pour cela.",
        },
      ],
    },
  },
};

export const guides = { en, fr };
