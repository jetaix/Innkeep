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

/** One JSON request to the Innkeep API. The session cookie travels with it. */
export async function api<T>(path: string, init?: { method?: "POST" | "DELETE"; body?: unknown }): Promise<T> {
  const response = await fetch(`/api/app${path}`, {
    method: init?.method ?? "GET",
    credentials: "same-origin",
    headers: init?.body === undefined ? undefined : { "content-type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(response.status, problem?.error ?? response.statusText);
  }
  return (await response.json()) as T;
}
