import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, like } from "drizzle-orm";
import { DEMO_SCHEME } from "@/channels/demo";
import { syncAll } from "@/channels/sync";
import { addDays, diffDays, today } from "@/lib/dates";
import {
  aiAdvice,
  charges,
  conversations,
  dismissedSuggestions,
  getDb,
  listings,
  messages,
  properties,
  reservations,
} from "./index";

export const newToken = () => randomBytes(18).toString("base64url");

const PROPERTIES = [
  {
    name: "Canal Loft",
    address: "12 Quai de Jemmapes, 75010 Paris",
    title: "Bright loft on the Canal Saint-Martin",
    description:
      "A sunny top-floor loft overlooking the canal, five minutes from République. Fully equipped kitchen, fast Wi-Fi and a quiet bedroom on the courtyard side.",
    maxGuests: 4,
    bedrooms: 1,
    bathrooms: 1,
    basePrice: 165,
    houseRules: "No smoking. No parties. Quiet after 22:00.",
  },
  {
    name: "Pine Cabin",
    address: "Chemin des Bois 4, 74400 Chamonix",
    title: "Cosy pine cabin with Mont-Blanc views",
    description:
      "Wood stove, mountain views from the terrace and ski storage. Ten minutes on foot to the Brévent lift.",
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    basePrice: 240,
    houseRules: "Pets welcome. Please take your shoes off inside.",
  },
  {
    name: "Harbour Studio",
    address: "3 Rue du Port, 13260 Cassis",
    title: "Studio two steps from the harbour",
    description: "Compact studio with a balcony above the port. Ideal for two, beach at 200 m.",
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    basePrice: 110,
    houseRules: "No smoking.",
  },
];

const GUESTS: Record<string, string[]> = {
  "1/airbnb": ["Léa Martin", "Tom Becker", "Sofia Rossi"],
  "1/booking": ["J. Novak", "Amira Haddad", "Chris Olsen"],
  "2/airbnb": ["Nina Petrova", "Marc Dubois", "Emily Clarke"],
  "2/booking": ["Hugo Lambert", "Y. Tanaka"],
  "3/airbnb": ["Paula Gómez", "Sam Wright"],
  "3/booking": ["Ines Ferreira", "Olivier Roy"],
};

/** True while any property still reads from a built-in sample calendar. */
export async function hasSampleData(): Promise<boolean> {
  return Boolean(
    await (await getDb())
      .select({ id: listings.id })
      .from(listings)
      .where(like(listings.icalUrl, `${DEMO_SCHEME}%`))
      .limit(1)
      .get(),
  );
}

/**
 * Deletes the sample properties with everything attached to them. If nothing
 * else is left, the sample charges and stored advice go too.
 */
export async function removeSampleData(): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const sampleIds = (
      await tx
        .select({ id: listings.propertyId })
        .from(listings)
        .where(like(listings.icalUrl, `${DEMO_SCHEME}%`))
        .all()
    ).map((row) => row.id);
    if (sampleIds.length === 0) return;
    await tx.delete(properties).where(inArray(properties.id, sampleIds)).run();
    if (!(await tx.select({ id: properties.id }).from(properties).limit(1).get())) {
      await tx.delete(charges).run();
      await tx.delete(dismissedSuggestions).run();
      await tx.delete(aiAdvice).run();
    }
  });
}

/** Fills an empty database with sample properties, bookings and conversations. */
export async function seedDemo(): Promise<void> {
  const db = getDb();
  if (await db.select({ id: properties.id }).from(properties).limit(1).get()) return;

  const ids: number[] = [];
  for (const [index, property] of PROPERTIES.entries()) {
    const row = await db
      .insert(properties)
      .values({ ...property, icalToken: newToken(), createdAt: Date.now() + index })
      .returning({ id: properties.id })
      .get();
    for (const channel of ["airbnb", "booking"] as const) {
      await db
        .insert(listings)
        .values({
          propertyId: row.id,
          channel,
          icalUrl: `demo://${channel}/${index + 1}`,
          titleOverride:
            channel === "booking" && index === 0 ? "Canal Saint-Martin Loft – Top floor, canal view" : "",
        })
        .run();
    }
    ids.push(row.id);
  }

  await syncAll();

  // iCal feeds never carry guest names, so hosts add them by hand. Do the same here.
  for (const [index, propertyId] of ids.entries()) {
    for (const channel of ["airbnb", "booking"] as const) {
      const names = GUESTS[`${index + 1}/${channel}`] ?? [];
      const rows = await db
        .select({ id: reservations.id, checkIn: reservations.checkIn, checkOut: reservations.checkOut })
        .from(reservations)
        .where(
          and(
            eq(reservations.propertyId, propertyId),
            eq(reservations.source, channel),
            // Booking.com stays arrive as closed dates until the extension confirms them.
            channel === "booking" ? undefined : eq(reservations.kind, "reservation"),
          ),
        )
        .orderBy(asc(reservations.checkIn))
        .all();
      for (const [i, row] of rows.entries()) {
        // Leave the last stay of each feed untouched, as a freshly imported booking looks.
        if (!names[i] || i === rows.length - 1) continue;
        const nights = diffDays(row.checkIn, row.checkOut);
        await db
          .update(reservations)
          .set({
            // What the browser extension would add from the reservations page.
            kind: "reservation",
            externalCode: channel === "booking" ? `50000${propertyId}${i}0000` : null,
            guestName: names[i],
            // Hosts copy the payout from the platform; vary it a little around the nightly rate.
            amount:
              i % 2 === 0 ? Math.round(PROPERTIES[index].basePrice * nights * (0.92 + i * 0.07)) * 100 : null,
          })
          .where(eq(reservations.id, row.id))
          .run();
      }
    }
  }

  const now = today();
  await db
    .insert(reservations)
    .values([
      {
        propertyId: ids[1],
        source: "direct",
        kind: "block",
        checkIn: addDays(now, 14),
        checkOut: addDays(now, 17),
        notes: "Chimney sweep and deep clean",
        createdAt: Date.now(),
      },
      {
        propertyId: ids[2],
        source: "direct",
        kind: "reservation",
        guestName: "Claire Fontaine",
        checkIn: addDays(now, 15),
        checkOut: addDays(now, 19),
        notes: "Returning guest, paid by bank transfer",
        amount: 40_000,
        createdAt: Date.now(),
      },
    ])
    .run();

  const yearStart = `${now.slice(0, 4)}-01-01`;
  const charge = { propertyId: null, appliesTo: "all" as const, startsOn: yearStart, createdAt: Date.now() };
  await db
    .insert(charges)
    .values([
      { ...charge, label: "Cleaning", category: "cleaning", frequency: "per_stay", amount: 5_500 },
      {
        ...charge,
        label: "Booking.com commission",
        category: "commission",
        frequency: "percent",
        amount: 1_500,
        appliesTo: "booking",
      },
      {
        ...charge,
        label: "Airbnb host fee",
        category: "commission",
        frequency: "percent",
        amount: 300,
        appliesTo: "airbnb",
      },
      { ...charge, label: "Internet", category: "utilities", frequency: "monthly", amount: 3_500 },
      { ...charge, label: "Home insurance", category: "subscription", frequency: "yearly", amount: 42_000 },
      {
        ...charge,
        label: "Boiler service",
        category: "maintenance",
        frequency: "once",
        amount: 18_000,
        propertyId: ids[1],
        startsOn: addDays(now, -2),
      },
    ])
    .run();

  const hour = 3_600_000;
  const threads = [
    {
      propertyId: ids[0],
      source: "airbnb" as const,
      guestName: "Tom Becker",
      unread: 1,
      thread: [
        ["in", "Hi! We land at CDG around 9am. Any chance of an early check-in?", 5 * hour],
        ["out", "Hi Tom, the loft is free the night before, so you can come from 11:00.", 4 * hour],
        ["in", "Perfect, thank you! Is there somewhere to leave a stroller downstairs?", 0.5 * hour],
      ],
    },
    {
      propertyId: ids[1],
      source: "booking" as const,
      guestName: "Hugo Lambert",
      unread: 1,
      thread: [["in", "Bonjour, is the wood for the stove included in the price?", 2 * hour]],
    },
    {
      propertyId: ids[2],
      source: "airbnb" as const,
      guestName: "Paula Gómez",
      unread: 0,
      thread: [
        ["in", "We just arrived, the studio is lovely. Where do we put the recycling?", 26 * hour],
        [
          "out",
          "Welcome! Yellow bins are in the courtyard, glass goes to the container by the port.",
          25 * hour,
        ],
      ],
    },
  ] as const;

  for (const { thread, ...conversation } of threads) {
    const last = Date.now() - Math.min(...thread.map(([, , ago]) => ago));
    const row = await db
      .insert(conversations)
      .values({ ...conversation, externalThreadId: `demo-${conversation.guestName}`, lastMessageAt: last })
      .returning({ id: conversations.id })
      .get();
    await db
      .insert(messages)
      .values(
        thread.map(([direction, body, ago]) => ({
          conversationId: row.id,
          direction,
          body,
          sentAt: Date.now() - ago,
        })),
      )
      .run();
  }
}
