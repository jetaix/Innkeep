/** The sign-in page shown when the instance is protected by `APP_PASSWORD`. */
const en = {
  title: "Sign in",
  intro: "This Innkeep is private. Enter its password to open it.",
  email: "Email",
  emailHint: "Leave empty if you are the owner and sign in with the password of this Innkeep.",
  password: "Password",
  submit: "Sign in",
  checking: "Checking…",
  wrong: "That is not the password. Check it and try again.",
  tooMany: "Too many wrong passwords. Wait ten minutes, then try again.",
  join: {
    title: "Join this Innkeep",
    /** "You are invited as Visitor." */
    invited: (role: string): string => `You are invited as ${role}.`,
    can: {
      admin: "You will see and change everything: bookings, revenue, settings and members.",
      visitor: "You will see the cleaning schedule and the properties, without changing them.",
    },
    name: "Your name",
    email: "Your email",
    emailHint: "You will sign in with it.",
    password: "Choose a password",
    passwordHint: (min: number): string => `At least ${min} characters.`,
    submit: "Join",
    joining: "Joining…",
    invalid: "This invitation is no longer valid. Ask for a new link.",
    taken: "Someone already joined with this email. Sign in instead, or use another address.",
    check: "Check your name, your email and your password.",
    signIn: "Sign in",
  },
};

const fr: typeof en = {
  title: "Connexion",
  intro: "Cet Innkeep est privé. Saisissez son mot de passe pour l’ouvrir.",
  email: "E-mail",
  emailHint:
    "Laissez vide si vous êtes le propriétaire et vous connectez avec le mot de passe de cet Innkeep.",
  password: "Mot de passe",
  submit: "Se connecter",
  checking: "Vérification…",
  wrong: "Ce n’est pas le mot de passe. Vérifiez-le et réessayez.",
  tooMany: "Trop de mots de passe erronés. Attendez dix minutes, puis réessayez.",
  join: {
    title: "Rejoindre cet Innkeep",
    invited: (role) => `Vous êtes invité en tant que ${role}.`,
    can: {
      admin: "Vous verrez et pourrez modifier tout : réservations, revenus, réglages et membres.",
      visitor: "Vous verrez le planning de ménage et les logements, sans pouvoir les modifier.",
    },
    name: "Votre nom",
    email: "Votre e-mail",
    emailHint: "Il vous servira à vous connecter.",
    password: "Choisissez un mot de passe",
    passwordHint: (min) => `Au moins ${min} caractères.`,
    submit: "Rejoindre",
    joining: "Un instant…",
    invalid: "Cette invitation n’est plus valable. Demandez un nouveau lien.",
    taken: "Quelqu’un a déjà rejoint avec cet e-mail. Connectez-vous, ou utilisez une autre adresse.",
    check: "Vérifiez votre nom, votre e-mail et votre mot de passe.",
    signIn: "Se connecter",
  },
};

export const auth = { en, fr };
