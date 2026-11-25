import { aiAdvice, dismissedSuggestions, getDb } from "@/db";
import { getPricing } from "@/features/pricing/queries";
import { getStays } from "@/features/reservations/queries";
import { getCharges } from "@/features/revenue/queries";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { addDays } from "@/lib/dates";
import { aiConfigured, buildSnapshot, generateAdvice } from "./ai";
import { getSuggestions } from "./queries";

/** Changes to suggestions and advice. Called by the Next.js actions and by the API; no framework in here. */
export async function dismissSuggestion(key: string) {
  await getDb()
    .insert(dismissedSuggestions)
    .values({ key, dismissedAt: Date.now() })
    .onConflictDoNothing()
    .run();
}

export async function restoreSuggestions() {
  await getDb().delete(dismissedSuggestions).run();
}

export type AdviceState = { error: string | null };

/** Asks the model for advice and stores it, so the page can show it without another call. */
export async function requestAdvice(locale: Locale): Promise<AdviceState> {
  const errors = MESSAGES[locale].insights.errors;
  if (!(await aiConfigured())) return { error: errors.notConfigured };

  const { active, input } = await getSuggestions(locale);
  if (input.properties.length === 0) return { error: errors.noProperty };

  // A full year of nightly prices, so seasonal advice has something real to stand on.
  const pricing = new Map(
    await Promise.all(
      input.properties.map(
        async (property) => [property.id, await getPricing(property.id, undefined, 365)] as const,
      ),
    ),
  );
  // The rules only look ahead; the model also gets the past year, where the real payouts are.
  const withHistory = { ...input, stays: await getStays(addDays(input.today, -400)) };
  const result = await generateAdvice(
    buildSnapshot(withHistory, await getCharges(), active, pricing),
    locale,
  );
  if (!result.ok) return { error: result.error };

  const row = { generatedAt: Date.now(), model: result.model, payload: JSON.stringify(result.advice) };
  await getDb()
    .insert(aiAdvice)
    .values({ id: 1, ...row })
    .onConflictDoUpdate({ target: aiAdvice.id, set: row })
    .run();
  return { error: null };
}
