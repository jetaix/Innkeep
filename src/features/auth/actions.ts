"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getI18n } from "@/i18n/server";
import {
  appPassword,
  passwordMatches,
  recordFailure,
  SESSION_COOKIE,
  SESSION_DAYS,
  sessionValue,
  tooManyAttempts,
} from "@/lib/session";

export type SignInState = { error: string | null };

export async function signIn(_previous: SignInState, form: FormData): Promise<SignInState> {
  const password = appPassword();
  if (!password) redirect("/overview");
  const t = (await getI18n()).m.auth;
  if (tooManyAttempts()) return { error: t.tooMany };

  const given = form.get("password");
  if (typeof given !== "string" || !passwordMatches(given, password)) {
    recordFailure();
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
