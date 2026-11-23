/** The sign-in page shown when the instance is protected by `APP_PASSWORD`. */
const en = {
  title: "Sign in",
  intro: "This Innkeep is private. Enter its password to open it.",
  password: "Password",
  submit: "Sign in",
  checking: "Checking…",
  wrong: "That is not the password. Check it and try again.",
  tooMany: "Too many wrong passwords. Wait ten minutes, then try again.",
};

const fr: typeof en = {
  title: "Connexion",
  intro: "Cet Innkeep est privé. Saisissez son mot de passe pour l’ouvrir.",
  password: "Mot de passe",
  submit: "Se connecter",
  checking: "Vérification…",
  wrong: "Ce n’est pas le mot de passe. Vérifiez-le et réessayez.",
  tooMany: "Trop de mots de passe erronés. Attendez dix minutes, puis réessayez.",
};

export const auth = { en, fr };
