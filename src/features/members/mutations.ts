import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { z } from "zod";
import { getDb, invitations, ROLES, users } from "@/db";
import { InvalidInput, parse, text } from "@/lib/form";
import { hashPassword } from "./password";

/** Members and the invitations that bring them in. Called by the API; no framework in here. */
const INVITE_DAYS = 7;
export const MIN_PASSWORD = 10;

const hashOf = (token: string) => createHash("sha256").update(token).digest("hex");
const email = z
  .email()
  .max(200)
  .transform((value) => value.trim().toLowerCase());

/**
 * Makes an invitation and answers with its secret, which goes in the link the
 * admin sends. Only the secret's hash is kept: the link cannot be shown again.
 */
export async function invite(input: unknown): Promise<{ id: number; token: string }> {
  const data = parse(z.object({ role: z.enum(ROLES), email: text.max(200).default("") }), input);
  const token = randomBytes(24).toString("base64url");
  const now = Date.now();
  const db = getDb();
  // Invitations nobody used are swept on the way.
  await db.delete(invitations).where(lt(invitations.expiresAt, now)).run();
  const row = await db
    .insert(invitations)
    .values({
      tokenHash: hashOf(token),
      email: data.email,
      role: data.role,
      createdAt: now,
      expiresAt: now + INVITE_DAYS * 86_400_000,
    })
    .returning({ id: invitations.id })
    .get();
  return { id: row.id, token };
}

export async function revokeInvitation(id: number) {
  await getDb().delete(invitations).where(eq(invitations.id, id)).run();
}

/** The invitation a link carries, while it can still be used. */
export async function findInvitation(token: string) {
  const row = await getDb()
    .select()
    .from(invitations)
    .where(eq(invitations.tokenHash, hashOf(token)))
    .get();
  return row && row.expiresAt > Date.now() ? row : null;
}

const joining = z.object({
  name: text.min(1).max(100),
  email,
  password: z.string().min(MIN_PASSWORD).max(500),
});

/** Turns an invitation into a member. The invitation is used up, whoever asks again. */
export async function acceptInvitation(token: string, input: unknown) {
  const data = parse(joining, input);
  const invitation = await findInvitation(token);
  if (!invitation) throw new InvalidInput("invitation");
  const db = getDb();
  if (await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).get()) {
    throw new InvalidInput("email");
  }
  const member = await db
    .insert(users)
    .values({
      email: data.email,
      name: data.name,
      role: invitation.role,
      passwordHash: hashPassword(data.password),
      createdAt: Date.now(),
    })
    .returning()
    .get();
  await db.delete(invitations).where(eq(invitations.id, invitation.id)).run();
  return member;
}

export async function setRole(id: number, input: unknown) {
  const { role } = parse(z.object({ role: z.enum(ROLES) }), input);
  await getDb().update(users).set({ role }).where(eq(users.id, id)).run();
}

/** Removing a member signs them out at once: their cookie no longer matches anyone. */
export async function removeMember(id: number) {
  await getDb().delete(users).where(eq(users.id, id)).run();
}
