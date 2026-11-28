import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { accessRequests, central, getDb } from "@/db";
import { parse } from "@/lib/form";

/**
 * Access while sign-up is in beta: who asked for an account, and who the host
 * let in. Kept in the main database (`central`), whoever is asking. Innkeep
 * sends no email: the host tells the person themselves once they are approved.
 */
const email = z
  .email()
  .max(254)
  .transform((value) => value.trim().toLowerCase());

/** Enough for a beta; a script filling the form cannot grow the table without end. */
const MAX_PENDING = 5000;

/** Keeps a request, once per address. Answers false when the list is full. */
export const recordRequest = (address: string, locale: string) =>
  central(async () => {
    const db = getDb();
    const pending = await db
      .select({ n: count() })
      .from(accessRequests)
      .where(eq(accessRequests.status, "pending"))
      .get();
    if ((pending?.n ?? 0) >= MAX_PENDING) return false;
    await db
      .insert(accessRequests)
      .values({ email: address, locale, createdAt: Date.now() })
      .onConflictDoNothing()
      .run();
    return true;
  });

export const isApproved = (address: string) =>
  central(async () =>
    Boolean(
      await getDb()
        .select({ id: accessRequests.id })
        .from(accessRequests)
        .where(and(eq(accessRequests.email, address), eq(accessRequests.status, "approved")))
        .get(),
    ),
  );

export const getRequests = () =>
  central(() =>
    getDb()
      .select({
        id: accessRequests.id,
        email: accessRequests.email,
        status: accessRequests.status,
        createdAt: accessRequests.createdAt,
      })
      .from(accessRequests)
      .orderBy(asc(accessRequests.createdAt))
      .all(),
  );

export const approveRequest = (id: number) =>
  central(() =>
    getDb()
      .update(accessRequests)
      .set({ status: "approved", approvedAt: Date.now() })
      .where(eq(accessRequests.id, id))
      .run(),
  );

/** Lets an address in without waiting for its request. */
export async function approveEmail(input: unknown) {
  const data = parse(z.object({ email }), input);
  const now = Date.now();
  await central(() =>
    getDb()
      .insert(accessRequests)
      .values({ email: data.email, status: "approved", createdAt: now, approvedAt: now })
      .onConflictDoUpdate({ target: accessRequests.email, set: { status: "approved", approvedAt: now } })
      .run(),
  );
}

/** Forgets a request or takes an approval back. An account already created stays. */
export const removeRequest = (id: number) =>
  central(() => getDb().delete(accessRequests).where(eq(accessRequests.id, id)).run());
