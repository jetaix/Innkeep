/** The "Add a property" guide: one screen per step, from the name to the first read of the host's pages. */
const en = {
  title: "Add a property",
  progress: (step: number, total: number) => `Step ${step} of ${total}`,
  back: "Back",
  continue: "Continue",
  skip: "Skip for now",
  how: {
    title: "How adding a property works",
    intro:
      "It takes a few steps and about ten minutes. Your Airbnb and Booking.com passwords stay with them: Innkeep never sees them.",
    expect: "What to expect",
    items: [
      { title: "Name your place", body: "A name only you see." },
      {
        title: "Paste your calendar links",
        body: "Airbnb and Booking.com each give you a link. It brings your booked dates into Innkeep.",
      },
      {
        title: "Add the browser extension",
        body: "Calendar links only carry dates. The extension reads guest names, payouts and prices from your own pages, in your own browser.",
      },
      {
        title: "Read your pages",
        body: "One button takes a tab through your own Airbnb and Booking.com pages and fills Innkeep.",
      },
    ],
  },
  name: {
    title: "Name your place",
    intro: "Use the name you call it yourself. Guests never see it, and you can change it later.",
    pending: "Adding…",
  },
  calendars: {
    title: (name: string) => `Connect the calendars of ${name}`,
    intro:
      "Paste the link each platform gives you. If you only use one of them, leave the other field empty.",
    label: (channel: string) => `${channel} calendar link`,
    find: (where: string) => `Where to find it: ${where}. Copy the export link shown there.`,
    problem: (error: string) =>
      `Innkeep could not read this link (${error}). Check that you copied the whole link, then save again.`,
    submit: "Save and continue",
    pending: "Reading your calendars…",
    anyway: "Continue anyway",
  },
  extension: {
    title: "Add the browser extension",
    intro: "Do these steps in Chrome, Edge, Brave or Arc, on a computer. About five minutes, once.",
    other: "Using Safari, an iPhone or an iPad?",
    otherLink: "Open the full guide",
    done: "I've added the extension",
    pending: "Checking…",
    waiting:
      "Innkeep has not heard from the extension yet. Do the step “Connect it to this Innkeep” and press “Save and test”: it should answer “Connected”. Then press the button again.",
    outdated:
      "The extension answered, but it is an older version. Download it again, reload it, then press the button again.",
    watching: "Innkeep is watching for the extension. This page continues by itself as soon as it connects.",
  },
  read: {
    title: "Read your pages",
    connected: "The extension is connected.",
    intro:
      "Sign in to Airbnb and to Booking.com in this same browser, then press the button. One tab goes through your own pages by itself, shows a Stop button on each, and comes back to Innkeep.",
    noExtension:
      "Without the extension Innkeep only knows your booked dates. You can add it later with the button in the corner of every page.",
    finish: "Open my property",
    keepOpen: "Keep this page open",
    keepOpenBody:
      "Sign in to Airbnb or Booking.com if they ask. This page continues by itself once your reservations are read.",
    next: "See the result",
  },
  done: {
    title: (name: string) => `${name} is ready`,
    intro:
      "This is what Innkeep knows so far. It keeps your dates up to date by itself from your calendar links.",
    stays: (count: number) =>
      count === 0 ? "No coming stay yet." : count === 1 ? "1 coming stay." : `${count} coming stays.`,
    named: (count: number) => (count === 1 ? "1 with the guest's name." : `${count} with the guest's name.`),
    unnamed:
      "Guest names and payouts come from the extension: press “Refresh everything” in Innkeep after signing in to Airbnb and Booking.com.",
  },
};

const fr: typeof en = {
  title: "Ajouter un logement",
  progress: (step, total) => `Étape ${step} sur ${total}`,
  back: "Retour",
  continue: "Continuer",
  skip: "Passer pour l’instant",
  how: {
    title: "Comment se passe l’ajout d’un logement",
    intro:
      "Quelques étapes et une dizaine de minutes. Vos mots de passe Airbnb et Booking.com restent chez eux : Innkeep ne les voit jamais.",
    expect: "Ce qui vous attend",
    items: [
      { title: "Nommez votre logement", body: "Un nom que vous seul voyez." },
      {
        title: "Collez vos liens de calendrier",
        body: "Airbnb et Booking.com vous donnent chacun un lien. Il apporte vos dates réservées dans Innkeep.",
      },
      {
        title: "Ajoutez l’extension de navigateur",
        body: "Les liens de calendrier ne contiennent que des dates. L’extension lit les noms des voyageurs, les versements et les prix sur vos propres pages, dans votre navigateur.",
      },
      {
        title: "Lisez vos pages",
        body: "Un bouton fait parcourir à un onglet vos propres pages Airbnb et Booking.com et remplit Innkeep.",
      },
    ],
  },
  name: {
    title: "Nommez votre logement",
    intro:
      "Utilisez le nom que vous lui donnez vous-même. Les voyageurs ne le voient jamais, et vous pourrez le changer.",
    pending: "Ajout…",
  },
  calendars: {
    title: (name) => `Connectez les calendriers de ${name}`,
    intro:
      "Collez le lien que chaque plateforme vous donne. Si vous n’en utilisez qu’une, laissez l’autre champ vide.",
    label: (channel) => `Lien de calendrier ${channel}`,
    find: (where) => `Où le trouver : ${where}. Copiez le lien d’export qui s’y affiche.`,
    problem: (error) =>
      `Innkeep n’a pas pu lire ce lien (${error}). Vérifiez que vous avez copié le lien en entier, puis enregistrez de nouveau.`,
    submit: "Enregistrer et continuer",
    pending: "Lecture de vos calendriers…",
    anyway: "Continuer quand même",
  },
  extension: {
    title: "Ajoutez l’extension de navigateur",
    intro:
      "Suivez ces étapes dans Chrome, Edge, Brave ou Arc, sur un ordinateur. Environ cinq minutes, une seule fois.",
    other: "Vous utilisez Safari, un iPhone ou un iPad ?",
    otherLink: "Ouvrir le guide complet",
    done: "J’ai ajouté l’extension",
    pending: "Vérification…",
    waiting:
      "Innkeep n’a pas encore eu de nouvelles de l’extension. Suivez l’étape « Reliez-la à cet Innkeep » et appuyez sur « Save and test » : elle doit répondre « Connected ». Appuyez ensuite de nouveau sur le bouton.",
    outdated:
      "L’extension a répondu, mais c’est une ancienne version. Téléchargez-la de nouveau, rechargez-la, puis appuyez de nouveau sur le bouton.",
    watching: "Innkeep guette l’extension. Cette page continue toute seule dès qu’elle se connecte.",
  },
  read: {
    title: "Lisez vos pages",
    connected: "L’extension est connectée.",
    intro:
      "Connectez-vous à Airbnb et à Booking.com dans ce même navigateur, puis appuyez sur le bouton. Un onglet parcourt vos propres pages tout seul, affiche un bouton Stop sur chacune, puis revient dans Innkeep.",
    noExtension:
      "Sans l’extension, Innkeep ne connaît que vos dates réservées. Vous pourrez l’ajouter plus tard avec le bouton présent dans le coin de chaque page.",
    finish: "Ouvrir mon logement",
    keepOpen: "Gardez cette page ouverte",
    keepOpenBody:
      "Connectez-vous à Airbnb ou à Booking.com s’ils le demandent. Cette page continue toute seule une fois vos réservations lues.",
    next: "Voir le résultat",
  },
  done: {
    title: (name) => `${name} est prêt`,
    intro:
      "Voici ce qu’Innkeep sait pour l’instant. Il tient vos dates à jour tout seul grâce à vos liens de calendrier.",
    stays: (count) =>
      count === 0
        ? "Aucun séjour à venir pour l’instant."
        : count === 1
          ? "1 séjour à venir."
          : `${count} séjours à venir.`,
    named: (count) => (count === 1 ? "1 avec le nom du voyageur." : `${count} avec le nom du voyageur.`),
    unnamed:
      "Les noms des voyageurs et les versements viennent de l’extension : appuyez sur « Tout mettre à jour » dans Innkeep après vous être connecté à Airbnb et à Booking.com.",
  },
};

export const setup = { en, fr };
