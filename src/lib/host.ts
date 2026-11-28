import { inHostSpace } from "@/db";

/**
 * A setting from the server's environment that belongs to the host: a key
 * they pay for, a chat they read, a token they chose. It serves the host's
 * own space only, so someone who signs up cannot spend or reach it; in any
 * other space it reads as not set.
 */
export type HostSetting =
  | "ANTHROPIC_API_KEY"
  | "ANTHROPIC_AUTH_TOKEN"
  | "TELEGRAM_BOT_TOKEN"
  | "TELEGRAM_CHAT_ID"
  | "EXTENSION_TOKEN"
  | "MCP_TOKEN";

export const hostSetting = (name: HostSetting): string | undefined =>
  inHostSpace() ? process.env[name] || undefined : undefined;
