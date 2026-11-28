import { mutationOptions, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { rpc, unwrap } from "./client";

/**
 * One definition per change. Each says which cached data it makes stale, so
 * a page never has to remember what to reload after a save: the queries that
 * read those resources fetch again on their own.
 */
type Locale = "en" | "fr";
type Fields = Record<string, unknown>;

const stale = (...keys: QueryKey[]) => ({
  onSuccess: async (_data: unknown, _sent: unknown, _result: unknown, context: { client: QueryClient }) => {
    await Promise.all(keys.map((queryKey) => context.client.invalidateQueries({ queryKey })));
  },
});

// What a change to bookings, places or costs can move: the figures built from them.
const FIGURES: QueryKey[] = [["overview"], ["revenue"], ["suggestions"], ["nav"], ["cleaning"], ["pricing"]];
const id = (value: number) => ({ id: String(value) });

// Costs
export const addCharge = mutationOptions({
  mutationFn: (json: Fields) => unwrap(rpc.charges.$post({ json })),
  ...stale(["charges"], ...FIGURES),
});
export const deleteCharge = mutationOptions({
  mutationFn: (charge: number) => unwrap(rpc.charges[":id"].$delete({ param: id(charge) })),
  ...stale(["charges"], ...FIGURES),
});
export const addLoan = mutationOptions({
  mutationFn: (json: Fields) => unwrap(rpc.loans.$post({ json })),
  ...stale(["charges"], ...FIGURES),
});
export const updateLoan = mutationOptions({
  mutationFn: ({ loan, json }: { loan: number; json: Fields }) =>
    unwrap(rpc.loans[":id"].$put({ param: id(loan), json })),
  ...stale(["charges"], ...FIGURES),
});
export const deleteLoan = mutationOptions({
  mutationFn: (loan: number) => unwrap(rpc.loans[":id"].$delete({ param: id(loan) })),
  ...stale(["charges"], ...FIGURES),
});
export const importSchedule = mutationOptions({
  mutationFn: ({ loan, table }: { loan: number; table: string }) =>
    unwrap(rpc.loans[":id"].schedule.$put({ param: id(loan), json: { table } })),
  ...stale(["charges"], ...FIGURES),
});
export const clearSchedule = mutationOptions({
  mutationFn: (loan: number) => unwrap(rpc.loans[":id"].schedule.$delete({ param: id(loan) })),
  ...stale(["charges"], ...FIGURES),
});

// Suggestions and advice
export const dismissSuggestion = mutationOptions({
  mutationFn: (key: string) => unwrap(rpc.suggestions.dismiss.$post({ json: { key } })),
  ...stale(["suggestions"], ["nav"], ["overview"]),
});
export const restoreSuggestions = mutationOptions({
  mutationFn: () => unwrap(rpc.suggestions.restore.$post()),
  ...stale(["suggestions"], ["nav"], ["overview"]),
});
export const requestAdvice = mutationOptions({
  mutationFn: (locale: Locale) => unwrap(rpc.advice.$post({ json: { locale } })),
  ...stale(["advice"]),
});

// Claude's key
export const connectClaude = mutationOptions({
  mutationFn: (json: { apiKey: string; locale: Locale }) => unwrap(rpc.claude.$post({ json })),
  ...stale(["settings"], ["advice"]),
});
export const disconnectClaude = mutationOptions({
  mutationFn: () => unwrap(rpc.claude.$delete()),
  ...stale(["settings"], ["advice"]),
});

// Properties and their listings
export const createProperty = mutationOptions({
  mutationFn: (name: string) => unwrap(rpc.properties.$post({ json: { name } })),
  ...stale(["properties"], ...FIGURES),
});
export const updateProperty = mutationOptions({
  mutationFn: (sent: { id: number; fields: Fields }) =>
    unwrap(rpc.properties[":id"].$put({ param: id(sent.id), json: sent.fields })),
  ...stale(["properties"], ...FIGURES),
});
export const deleteProperty = mutationOptions({
  mutationFn: (property: number) => unwrap(rpc.properties[":id"].$delete({ param: id(property) })),
  ...stale(["properties"], ["stays"], ["reviews"], ["feeds"], ["freshness"], ...FIGURES),
});
export const saveListing = mutationOptions({
  mutationFn: (sent: { property: number; channel: "airbnb" | "booking"; fields: Fields }) =>
    unwrap(
      rpc.properties[":id"].listings[":channel"].$put({
        param: { id: String(sent.property), channel: sent.channel },
        json: sent.fields,
      }),
    ),
  ...stale(["properties"], ["stays"], ["feeds"], ["freshness"], ...FIGURES),
});
/** The "Add a property" guide: saves the calendar links filled in, and says whether one could not be read. */
export const connectCalendars = mutationOptions({
  mutationFn: (sent: { property: number; links: Record<"airbnb" | "booking", string> }) =>
    unwrap(rpc.setup[":id"].calendars.$put({ param: id(sent.property), json: sent.links })),
  ...stale(["setup"], ["properties"], ["stays"], ["feeds"], ["freshness"], ...FIGURES),
});
export const syncListing = mutationOptions({
  mutationFn: (listing: number) => unwrap(rpc.listings[":id"].sync.$post({ param: id(listing) })),
  ...stale(["properties"], ["stays"], ["feeds"], ["freshness"], ...FIGURES),
});
export const markPublished = mutationOptions({
  mutationFn: (listing: number) => unwrap(rpc.listings[":id"].published.$post({ param: id(listing) })),
  ...stale(["properties"], ["suggestions"], ["nav"]),
});
/** Imports the calendars. With `onlyIfStale`, the server decides whether it is worth doing. */
export const sync = mutationOptions({
  mutationFn: (onlyIfStale: boolean) => unwrap(rpc.sync.$post({ json: { onlyIfStale } })),
  onSuccess: async (data, _sent, _result, { client }) => {
    if (data.synced) await client.invalidateQueries();
  },
});
export const loadSampleData = mutationOptions({
  mutationFn: () => unwrap(rpc["sample-data"].$post()),
  onSuccess: (_data, _sent, _result, { client }) => client.invalidateQueries(),
});
export const clearSampleData = mutationOptions({
  mutationFn: () => unwrap(rpc["sample-data"].$delete()),
  onSuccess: (_data, _sent, _result, { client }) => client.invalidateQueries(),
});

// Stays and blocked dates
export const createStay = mutationOptions({
  mutationFn: (json: Fields) => unwrap(rpc.stays.$post({ json })),
  ...stale(["stays"], ...FIGURES),
});
export const updateStay = mutationOptions({
  mutationFn: (sent: { id: number; fields: Fields }) =>
    unwrap(rpc.stays[":id"].$put({ param: id(sent.id), json: sent.fields })),
  ...stale(["stays"], ...FIGURES),
});
export const deleteStay = mutationOptions({
  mutationFn: (stay: number) => unwrap(rpc.stays[":id"].$delete({ param: id(stay) })),
  ...stale(["stays"], ...FIGURES),
});

// Cleaners and cleanings
export const addCleaner = mutationOptions({
  mutationFn: (json: { name: string; phone: string }) => unwrap(rpc.cleaners.$post({ json })),
  ...stale(["cleaning"]),
});
export const deleteCleaner = mutationOptions({
  mutationFn: (cleaner: number) => unwrap(rpc.cleaners[":id"].$delete({ param: id(cleaner) })),
  ...stale(["cleaning"]),
});
export const assignCleaner = mutationOptions({
  mutationFn: (sent: { property: number; priority: 0 | 1; cleanerId: number | "" }) =>
    unwrap(
      rpc.properties[":id"].cleaners[":priority"].$put({
        param: { id: String(sent.property), priority: String(sent.priority) },
        json: { cleanerId: sent.cleanerId },
      }),
    ),
  ...stale(["cleaning"]),
});
export const setCleaningEnabled = mutationOptions({
  mutationFn: (sent: { property: number; enabled: boolean }) =>
    unwrap(
      rpc.properties[":id"].cleaning.$put({ param: id(sent.property), json: { enabled: sent.enabled } }),
    ),
  ...stale(["cleaning"], ["properties"]),
});
export const addManualCleaning = mutationOptions({
  mutationFn: (json: { propertyId: number; date: string; notes: string }) =>
    unwrap(rpc.cleanings.$post({ json })),
  ...stale(["cleaning"]),
});
/** One cleaning day: its status, where the request to the cleaner stands, or its note and cleaner. */
export const updateCleaning = mutationOptions({
  mutationFn: (sent: { property: number; date: string; fields: Fields }) =>
    unwrap(
      rpc.cleanings[":propertyId"][":date"].$put({
        param: { propertyId: String(sent.property), date: sent.date },
        json: sent.fields,
      }),
    ),
  ...stale(["cleaning"]),
});
export const removeManualCleaning = mutationOptions({
  mutationFn: (sent: { property: number; date: string }) =>
    unwrap(
      rpc.cleanings[":propertyId"][":date"].$delete({
        param: { propertyId: String(sent.property), date: sent.date },
      }),
    ),
  ...stale(["cleaning"]),
});

// Telegram (host only)
export const sendTelegramTest = mutationOptions({
  mutationFn: () => unwrap(rpc.telegram.test.$post()),
});
export const findTelegramChats = mutationOptions({
  mutationFn: () => unwrap(rpc.telegram.chats.$post()),
});
export const chooseTelegramChat = mutationOptions({
  mutationFn: (json: { id: string; title: string }) => unwrap(rpc.telegram.chat.$put({ json })),
  ...stale(["settings"]),
});

// Session and early access
export const signIn = mutationOptions({
  mutationFn: (password: string) => unwrap(rpc.session.$post({ json: { password } })),
  onSuccess: (_data, _sent, _result, { client }) => client.invalidateQueries(),
});
// Members and invitations
export const invite = mutationOptions({
  mutationFn: (json: { role: "admin" | "visitor"; email: string }) => unwrap(rpc.invitations.$post({ json })),
  ...stale(["members"]),
});
export const revokeInvitation = mutationOptions({
  mutationFn: (invitation: number) => unwrap(rpc.invitations[":id"].$delete({ param: id(invitation) })),
  ...stale(["members"]),
});
export const setMemberRole = mutationOptions({
  mutationFn: ({ member, role }: { member: number; role: "admin" | "visitor" }) =>
    unwrap(rpc.members[":id"].$put({ param: id(member), json: { role } })),
  ...stale(["members"]),
});
export const removeMember = mutationOptions({
  mutationFn: (member: number) => unwrap(rpc.members[":id"].$delete({ param: id(member) })),
  ...stale(["members"]),
});

export const signOut = mutationOptions({
  mutationFn: () => unwrap(rpc.session.$delete()),
  onSuccess: (_data, _sent, _result, { client }) => client.invalidateQueries(),
});
export const requestAccess = mutationOptions({
  mutationFn: (json: { email: string; company?: string; locale: Locale }) =>
    unwrap(rpc.access.$post({ json })),
});
