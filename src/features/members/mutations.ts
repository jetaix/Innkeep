import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, eq, lt, ne } from "drizzle-orm";
import { z } from "zod";
import { central, getDb, invitations, MAIN_STORE, newStore, ROLES, spaces, users } from "@/db";
import { InvalidInput, parse, text } from "@/lib/form";
import { isApproved } from "@/features/access/requests";
import { ownerEmail, signUpMode } from "@/lib/session";
import { hashPassword, passwordFits } from "./password";

/**
 * Accounts: signing up, the members of a space and the links that bring them
 * in. Called by the API; no framework in here. Everything is kept in the main
 * database (`central`) and names the space it changes, so an admin can only
 * ever touch their own space's people.
 */
const INVITE_DAYS = 7;
const RESET_DAYS = 2;
export const MIN_PASSWORD = 10;

const hashOf = (token: string) => createHash("sha256").update(token).digest("hex");
const email = z
  .email()
  .max(200)
  .transform((value) => value.trim().toLowerCase());
const password = z.string().min(MIN_PASSWORD).max(500);

const signingUp = z.object({
  name: text.min(1).max(100),
  email,
  password,
});

/** Refused: sign-up is closed, or in beta and this address was not let in. */
export class NoAccessError extends Error {
  constructor(readonly reason: "closed" | "beta") {
    super(
      reason === "closed"
        ? "This Innkeep takes no new accounts."
        : "This address has no access yet. Request access, then sign up once it is approved.",
    );
    this.name = "NoAccessError";
  }
}

/**
 * Creates an account: a new space, and its first user, an admin.
 *
 * The first space is the main database itself, with whatever was already in
 * it: it goes to the first account created, or, when `OWNER_EMAIL` is set, to
 * the account with that address and nobody else. Every other account starts
 * in an empty database of its own.
 *
 * Who may sign up at all is `SIGN_UP`'s to say (see `signUpMode`); whoever
 * takes the main database always may, or nobody could ever get in.
 */
export async function signUp(input: unknown) {
  const data = parse(signingUp, input);
  return central(async () => {
    const db = getDb();
    if (await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).get()) {
      throw new InvalidInput("email");
    }
    const host = () =>
      db.select().from(spaces).where(eq(spaces.store, MAIN_STORE)).orderBy(asc(spaces.id)).get();
    const owner = ownerEmail();
    const takesHost = !(await host()) && (owner == null || owner === data.email);
    if (!takesHost && owner !== data.email) {
      const mode = signUpMode();
      if (mode === "closed") throw new NoAccessError("closed");
      if (mode === "beta" && !(await isApproved(data.email))) throw new NoAccessError("beta");
    }

    const now = Date.now();
    let space = await db
      .insert(spaces)
      // "pending" is replaced below; a space never works on a store it was not given.
      .values({ name: data.name, store: takesHost ? MAIN_STORE : "pending", createdAt: now })
      .returning()
      .get();
    try {
      // Two people signing up at the same moment must not both get the main database.
      const lost = takesHost && (await host())?.id !== space.id;
      if (!takesHost || lost) {
        space = await db
          .update(spaces)
          .set({ store: await newStore(space.id) })
          .where(eq(spaces.id, space.id))
          .returning()
          .get();
      }
      const user = await db
        .insert(users)
        .values({
          spaceId: space.id,
          email: data.email,
          name: data.name,
          role: "admin",
          passwordHash: hashPassword(data.password),
          createdAt: now,
        })
        .returning()
        .get();
      return { user, space };
    } catch (error) {
      await db.delete(spaces).where(eq(spaces.id, space.id)).run();
      throw error;
    }
  });
}

/**
 * Makes an invitation and answers with its secret, which goes in the link the
 * admin sends. Only the secret's hash is kept: the link cannot be shown again.
 */
export async function invite(spaceId: number, input: unknown): Promise<{ id: number; token: string }> {
  const data = parse(z.object({ role: z.enum(ROLES), email: text.max(200).default("") }), input);
  return link({ spaceId, userId: null, email: data.email, role: data.role, days: INVITE_DAYS });
}

/** A link with which one member chooses a new password: what an admin sends to someone who forgot theirs. */
export async function resetLink(spaceId: number, userId: number): Promise<{ id: number; token: string }> {
  const member = await central(() =>
    getDb()
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.spaceId, spaceId)))
      .get(),
  );
  if (!member) throw new InvalidInput("member");
  return link({ spaceId, userId, email: member.email, role: member.role, days: RESET_DAYS });
}

function link(row: {
  spaceId: number;
  userId: number | null;
  email: string;
  role: (typeof ROLES)[number];
  days: number;
}) {
  return central(async () => {
    const token = randomBytes(24).toString("base64url");
    const now = Date.now();
    const db = getDb();
    // Links nobody used are swept on the way.
    await db.delete(invitations).where(lt(invitations.expiresAt, now)).run();
    const made = await db
      .insert(invitations)
      .values({
        spaceId: row.spaceId,
        userId: row.userId,
        tokenHash: hashOf(token),
        email: row.email,
        role: row.role,
        createdAt: now,
        expiresAt: now + row.days * 86_400_000,
      })
      .returning({ id: invitations.id })
      .get();
    return { id: made.id, token };
  });
}

export const revokeInvitation = (spaceId: number, id: number) =>
  central(() =>
    getDb()
      .delete(invitations)
      .where(and(eq(invitations.id, id), eq(invitations.spaceId, spaceId)))
      .run(),
  );

/** The link's row, while it can still be used. */
export const findInvitation = (token: string) =>
  central(async () => {
    const row = await getDb()
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, hashOf(token)))
      .get();
    return row && row.expiresAt > Date.now() ? row : null;
  });

const joining = z.object({ name: text.min(1).max(100), email, password });

/**
 * Uses a link up, whoever asks again. An invitation becomes a member of the
 * space it was made in; a reset link gives its member the new password.
 */
export async function acceptInvitation(token: string, input: unknown) {
  const invitation = await findInvitation(token);
  if (!invitation) throw new InvalidInput("invitation");
  return central(async () => {
    const db = getDb();
    if (invitation.userId != null) {
      const data = parse(z.object({ password }), input);
      const member = await db
        .update(users)
        .set({ passwordHash: hashPassword(data.password) })
        .where(eq(users.id, invitation.userId))
        .returning()
        .get();
      if (!member) throw new InvalidInput("invitation");
      await db.delete(invitations).where(eq(invitations.id, invitation.id)).run();
      return member;
    }
    const data = parse(joining, input);
    if (await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).get()) {
      throw new InvalidInput("email");
    }
    const member = await db
      .insert(users)
      .values({
        spaceId: invitation.spaceId,
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
  });
}

/** A signed-in person choosing a new password, after typing the one they have. */
export async function changePassword(userId: number, input: unknown) {
  const data = parse(z.object({ current: z.string().max(500), password }), input);
  return central(async () => {
    const db = getDb();
    const member = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!member || !passwordFits(data.current, member.passwordHash)) throw new InvalidInput("current");
    return await db
      .update(users)
      .set({ passwordHash: hashPassword(data.password) })
      .where(eq(users.id, userId))
      .returning()
      .get();
  });
}

/** A space keeps at least one admin, or nobody could invite, repair or remove anyone. */
async function anotherAdmin(spaceId: number, userId: number) {
  const row = await getDb()
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.spaceId, spaceId), eq(users.role, "admin"), ne(users.id, userId)))
    .get();
  return (row?.n ?? 0) > 0;
}

export async function setRole(spaceId: number, id: number, input: unknown) {
  const { role } = parse(z.object({ role: z.enum(ROLES) }), input);
  await central(async () => {
    if (role !== "admin" && !(await anotherAdmin(spaceId, id))) throw new InvalidInput("role");
    await getDb()
      .update(users)
      .set({ role })
      .where(and(eq(users.id, id), eq(users.spaceId, spaceId)))
      .run();
  });
}

/** Removing a member signs them out at once: their cookie no longer matches anyone. */
export async function removeMember(spaceId: number, id: number) {
  await central(async () => {
    if (!(await anotherAdmin(spaceId, id))) throw new InvalidInput("member");
    const db = getDb();
    await db
      .delete(invitations)
      .where(and(eq(invitations.userId, id), eq(invitations.spaceId, spaceId)))
      .run();
    await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.spaceId, spaceId)))
      .run();
  });
}
