import { hc } from "hono/client";
import type { AppType } from "../../server/app";

/** A refusal from the API, with the status and the server's message. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The API, typed from the server's own routes: an address or a field that
 * does not exist there is a type error here. The session cookie travels
 * with every request.
 */
export const rpc = hc<AppType>("/", { init: { credentials: "same-origin" } }).api.app;

type Answer = { ok: boolean; status: number; statusText: string; json(): Promise<unknown> };

/** Waits for an answer and returns its data, or throws what the server said. */
export async function unwrap<R extends Answer>(call: Promise<R>): Promise<Awaited<ReturnType<R["json"]>>> {
  const response = await call;
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, problem?.error ?? response.statusText);
  }
  return (await response.json()) as Awaited<ReturnType<R["json"]>>;
}
