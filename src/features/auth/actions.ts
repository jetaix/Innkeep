"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getI18n } from "@/i18n/server";
import { eq } from "drizzle-orm";
import { appState, getDb, withData } from "@/db";
import {
  appPassword,
  passwordMatches,
  recentFailures,
  SESSION_COOKIE,
  SESSION_DAYS,
  sessionValue,
  tooManyAttempts,
} from "@/lib/session";

/** Wrong passwords are counted in the database, so the limit holds on a host with many short-lived servers. */
const FAILURES = "sign-in-failures";

/**
 * Someone signing in is not signed in yet, so their request only sees the
 * demo. The count of wrong passwords is the one thing they may read and
 * write in the host's own data.
 */
async function failures(): Promise<number[]> {
  const row = await withData("real", () =>
    getDb().select().from(appState).where(eq(appState.key, FAILURES)).get(),
  );
  try {
    const parsed: unknown = JSON.parse(row?.value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((at) => typeof at === "number") : [];
  } catch {
    return [];
  }
}

async function recordFailure(earlier: number[], now: number) {
  const value = JSON.stringify([...recentFailures(earlier, now), now]);
  await withData("real", () =>
    getDb()
      .insert(appState)
      .values({ key: FAILURES, value })
      .onConflictDoUpdate({ target: appState.key, set: { value } })
      .run(),
  );
}

export type SignInState = { error: string | null };

export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const password = appPassword();
  if (!password) redirect("/overview");
  const t = (await getI18n()).m.auth;
  const now = Date.now();
  const earlier = await failures();
  if (tooManyAttempts(earlier, now)) return { error: t.tooMany };

  const given = form.get("password");
  if (typeof given !== "string" || !passwordMatches(given, password)) {
    await recordFailure(earlier, now);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: t.wrong };
  }

  (await cookies()).set(SESSION_COOKIE, sessionValue(password), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    // Plain http only happens on a computer at home; anything public is https.
    secure: (await headers()).get("x-forwarded-proto") === "https",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
  redirect("/overview");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
