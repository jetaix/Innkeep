import "server-only";
import { asc, eq, gt } from "drizzle-orm";
import { getDb, invitations, users } from "@/db";

/** The members, without anything a page has no business holding. */
export async function getMembers() {
  return await getDb()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt))
    .all();
}

/** Invitations still waiting for someone to use them. */
export async function getInvitations() {
  return await getDb()
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
    })
    .from(invitations)
    .where(gt(invitations.expiresAt, Date.now()))
    .orderBy(asc(invitations.createdAt))
    .all();
}

export async function findMember(id: number) {
  return (await getDb().select().from(users).where(eq(users.id, id)).get()) ?? null;
}

export async function findMemberByEmail(email: string) {
  return (
    (await getDb().select().from(users).where(eq(users.email, email.trim().toLowerCase())).get()) ?? null
  );
}
