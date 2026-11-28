/** The public demo: the banner over the dashboard and what a visitor is told when they try to change something. */
const en = {
  banner: "This is a demo with example bookings. Look around; nothing you change is saved.",
  access: "Request early access",
  back: "Back to the website",
  signIn: "Sign in",
  refused: "This is a demo: changes are not saved.",
  error: {
    title: "Something went wrong",
    demoTitle: "This is a demo",
    demoBody: "You can look at everything, but changes are not saved here.",
    body: "The page could not be shown. Try again; if it keeps happening, reload the page.",
    retry: "Try again",
  },
  landing: "Or look at the demo first",
};

const fr: typeof en = {
  banner:
    "Ceci est une démo avec des réservations d’exemple. Explorez librement ; rien de ce que vous modifiez n’est enregistré.",
  access: "Demander un accès anticipé",
  back: "Retour au site",
  signIn: "Se connecter",
  refused: "Ceci est une démo : les modifications ne sont pas enregistrées.",
  error: {
    title: "Une erreur est survenue",
    demoTitle: "Ceci est une démo",
    demoBody: "Vous pouvez tout consulter, mais les modifications ne sont pas enregistrées ici.",
    body: "La page n’a pas pu s’afficher. Réessayez ; si le problème persiste, rechargez la page.",
    retry: "Réessayer",
  },
  landing: "Ou regardez d’abord la démo",
};

export const demo = { en, fr };
