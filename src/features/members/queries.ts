import "server-only";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { central, getDb, invitations, MAIN_STORE, type SpaceRef, spaces, users } from "@/db";
import { ownerEmail, type SignUpMode, signUpMode } from "@/lib/session";

/**
 * Users, spaces and invitations live in the main database, shared by every
 * space, so each function here goes there (`central`) and names the space it
 * answers for.
 */

/** The members of a space, without anything a page has no business holding. */
export const getMembers = (spaceId: number) =>
  central(() =>
    getDb()
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.spaceId, spaceId))
      .orderBy(asc(users.createdAt))
      .all(),
  );

/** Invitations to a space still waiting for someone to use them. */
export const getInvitations = (spaceId: number) =>
  central(() =>
    getDb()
      .select({
        id: invitations.id,
        email: invitations.email,
        role: invitations.role,
        expiresAt: invitations.expiresAt,
      })
      .from(invitations)
      .where(
        and(
          eq(invitations.spaceId, spaceId),
          isNull(invitations.userId),
          gt(invitations.expiresAt, Date.now()),
        ),
      )
      .orderBy(asc(invitations.createdAt))
      .all(),
  );

/** A user with the space they belong to: who a session is, and where their data is. */
export const findAccount = (id: number) =>
  central(async () => {
    const row = await getDb()
      .select({ user: users, space: spaces })
      .from(users)
      .innerJoin(spaces, eq(spaces.id, users.spaceId))
      .where(eq(users.id, id))
      .get();
    return row ?? null;
  });

export const findMemberByEmail = (email: string) =>
  central(
    async () =>
      (await getDb().select().from(users).where(eq(users.email, email.trim().toLowerCase())).get()) ?? null,
  );

export const findSpace = (id: number) =>
  central(async (): Promise<SpaceRef | null> => {
    const row = await getDb().select().from(spaces).where(eq(spaces.id, id)).get();
    return row ? { id: row.id, store: row.store } : null;
  });

/**
 * Every place data lives, for the work done for all of them (the calendar
 * sync, the Telegram messages). The main database comes first, and is there
 * even before anyone has an account.
 */
export const everySpace = () =>
  central(async (): Promise<SpaceRef[]> => {
    const rows = await getDb().select().from(spaces).orderBy(asc(spaces.id)).all();
    const refs = rows.map((row) => ({ id: row.id, store: row.store }));
    const host = refs.find((ref) => ref.store === MAIN_STORE) ?? { id: 0, store: MAIN_STORE };
    return [host, ...refs.filter((ref) => ref.store !== MAIN_STORE)];
  });

const hostSpace = () =>
  central(
    async () => (await getDb().select().from(spaces).where(eq(spaces.store, MAIN_STORE)).get()) ?? null,
  );

/**
 * What the sign-up page needs to know before anyone has typed anything.
 * While nobody owns the main database and no owner is named, the next account
 * is the first and takes it, whatever the mode.
 */
export async function signUpState(): Promise<{ mode: SignUpMode; first: boolean }> {
  return { mode: signUpMode(), first: !(await hostSpace()) && ownerEmail() == null };
}

export { hostSpace };
