/** The browser notifications the extension shows when a stay appears, moves or is cancelled. */
const en = {
  title: {
    new: (channel: string) => `New reservation on ${channel}`,
    cancelled: (channel: string) => `Reservation cancelled on ${channel}`,
    changed: (channel: string) => `Reservation changed on ${channel}`,
  },
  /** Booking.com's calendar cannot tell a booking from dates the host closed. */
  unsure: {
    new: (channel: string) => `Dates now closed on ${channel}`,
    cancelled: (channel: string) => `Dates open again on ${channel}`,
    changed: (channel: string) => `Closed dates changed on ${channel}`,
    hint: {
      new: "A booking, or dates you closed.",
      cancelled: "A cancellation, or dates you opened again.",
      changed: "",
    },
  },
  dates: (from: string, to: string) => `${from} to ${to}`,
  was: (dates: string) => `was ${dates}`,
  /** One notification in place of many, when a lot changed at once. */
  many: {
    title: (count: number) => `${count} more reservation changes`,
    body: "Open Innkeep to see them.",
  },
  /** Shown once, when the host switches notifications on. */
  test: {
    title: "Notifications are on",
    body: "Innkeep will tell you here about new, changed and cancelled reservations.",
  },
};

const fr: typeof en = {
  title: {
    new: (channel) => `Nouvelle réservation sur ${channel}`,
    cancelled: (channel) => `Réservation annulée sur ${channel}`,
    changed: (channel) => `Réservation modifiée sur ${channel}`,
  },
  unsure: {
    new: (channel) => `Dates désormais fermées sur ${channel}`,
    cancelled: (channel) => `Dates de nouveau ouvertes sur ${channel}`,
    changed: (channel) => `Dates fermées modifiées sur ${channel}`,
    hint: {
      new: "Une réservation, ou des dates que vous avez fermées.",
      cancelled: "Une annulation, ou des dates que vous avez rouvertes.",
      changed: "",
    },
  },
  dates: (from, to) => `du ${from} au ${to}`,
  was: (dates) => `auparavant ${dates}`,
  many: {
    title: (count) => `${count} autres changements de réservation`,
    body: "Ouvrez Innkeep pour les voir.",
  },
  test: {
    title: "Les notifications sont activées",
    body: "Innkeep vous préviendra ici des réservations nouvelles, modifiées et annulées.",
  },
};

export const notifications = { en, fr };
