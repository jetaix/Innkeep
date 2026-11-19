/** The Inbox page: the conversation list, the open thread and the reply form. */
const en = {
  title: "Inbox",
  description: "Guest conversations from every channel, newest first.",
  empty: {
    title: "No conversations yet",
    before:
      "Airbnb and Booking.com only open guest messaging to approved partners, so Innkeep receives messages through a webhook. Point an email parser or automation at",
    after: "and conversations appear here. Settings shows whether the webhook is on.",
  },
  list: {
    /** Prefix of a preview when the last message is the host's own. */
    you: "You: ",
    unread: "unread",
    selectBefore: "Select a conversation, or press",
    selectAfter: "for the first one",
  },
  thread: {
    label: (guest: string) => `Conversation with ${guest}`,
    back: "← All",
    notSent: (channel: string) => `Not sent to ${channel}`,
  },
  reply: {
    label: (guest: string) => `Reply to ${guest}`,
    placeholder: "Write a reply…",
    send: "Send",
    save: "Save reply",
    saving: "Saving…",
    hintBefore: (channel: string) =>
      `${channel} only opens messaging to approved partners, so replies are saved here and not delivered. Copy your reply and paste it in`,
    hintLink: (channel: string) => `the ${channel} inbox ↗`,
    hintAfter: ".",
  },
};

const fr: typeof en = {
  title: "Messages",
  description: "Les conversations avec vos voyageurs sur toutes les plateformes, les plus récentes d’abord.",
  empty: {
    title: "Aucune conversation pour l’instant",
    before:
      "Airbnb et Booking.com réservent la messagerie voyageurs à leurs partenaires agréés ; Innkeep reçoit donc les messages par un webhook. Dirigez un analyseur d’e-mails ou une automatisation vers",
    after: "et les conversations apparaîtront ici. Les réglages indiquent si le webhook est actif.",
  },
  list: {
    you: "Vous : ",
    unread: "non lus",
    selectBefore: "Sélectionnez une conversation, ou appuyez sur",
    selectAfter: "pour ouvrir la première",
  },
  thread: {
    label: (guest) => `Conversation avec ${guest}`,
    back: "← Toutes",
    notSent: (channel) => `Non envoyé à ${channel}`,
  },
  reply: {
    label: (guest) => `Répondre à ${guest}`,
    placeholder: "Écrivez une réponse…",
    send: "Envoyer",
    save: "Enregistrer la réponse",
    saving: "Enregistrement…",
    hintBefore: (channel) =>
      `${channel} réserve la messagerie à ses partenaires agréés ; les réponses sont donc enregistrées ici sans être envoyées. Copiez votre réponse et collez-la dans`,
    hintLink: (channel) => `la messagerie ${channel} ↗`,
    hintAfter: ".",
  },
};

export const inbox = { en, fr };
