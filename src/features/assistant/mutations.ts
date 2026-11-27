import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AI_MODEL } from "@/features/insights/ai";
import type { Locale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { removeApiKey, saveApiKey } from "./key";

/** Connecting Claude. Called by the API; no framework in here. */
export type ConnectState = { error: string | null; connected?: boolean };

const keySchema = z
  .string()
  .trim()
  .regex(/^sk-ant-[A-Za-z0-9_-]{20,300}$/);

/**
 * Checks a pasted API key with Anthropic and keeps it only if it works. The
 * check looks up the model Innkeep uses, which costs nothing and also proves
 * the key may use that model.
 */
export async function connectClaude(apiKey: unknown, locale: Locale): Promise<ConnectState> {
  const t = MESSAGES[locale].assistant.errors;
  const parsed = keySchema.safeParse(apiKey);
  if (!parsed.success) return { error: t.format };

  try {
    await new Anthropic({ apiKey: parsed.data }).models.retrieve(AI_MODEL);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return { error: t.rejected };
    if (error instanceof Anthropic.PermissionDeniedError || error instanceof Anthropic.NotFoundError) {
      return { error: t.model(AI_MODEL) };
    }
    if (error instanceof Anthropic.APIConnectionError) return { error: t.connection };
    if (error instanceof Anthropic.APIError) return { error: t.api(error.status ?? null) };
    throw error;
  }

  await saveApiKey(parsed.data);
  return { error: null, connected: true };
}

export async function disconnectClaude() {
  await removeApiKey();
}
