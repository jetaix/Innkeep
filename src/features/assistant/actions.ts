"use server";

import Anthropic from "@anthropic-ai/sdk";
import { refresh } from "next/cache";
import { z } from "zod";
import { hostOnly } from "@/db";
import { AI_MODEL } from "@/features/insights/ai";
import { MESSAGES } from "@/i18n/messages";
import { getLocale } from "@/i18n/server";
import { removeApiKey, saveApiKey } from "./key";

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
export async function connectClaude(_previous: ConnectState, form: FormData): Promise<ConnectState> {
  await hostOnly();
  const t = MESSAGES[await getLocale()].assistant.errors;
  const parsed = keySchema.safeParse(form.get("apiKey"));
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
  refresh();
  return { error: null, connected: true };
}

export async function disconnectClaude() {
  await hostOnly();
  await removeApiKey();
  refresh();
}
