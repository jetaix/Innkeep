import { appPassword, type DataScope, publicDemo, SESSION_COOKIE, sessionValid } from "../../src/lib/session";

/**
 * Which data a request to the app's API may see: without a password there is one household; with one, only a
 * valid session reaches the host's data. Anyone else gets the sample data to
 * read and nothing to change, or is turned away when no demo is offered.
 */
export type Verdict = { scope: DataScope; signedIn: boolean } | { refuse: 401 };

export function decide(method: string, cookie: string | undefined): Verdict {
  const password = appPassword();
  if (!password) return { scope: "real", signedIn: true };
  if (sessionValid(cookie, password)) return { scope: "real", signedIn: true };
  if (!publicDemo()) return { refuse: 401 };
  const reading = method === "GET" || method === "HEAD";
  return { scope: reading ? "demo" : "demo-readonly", signedIn: false };
}

export { SESSION_COOKIE };
