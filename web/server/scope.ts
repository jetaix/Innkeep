import type { Role, SpaceRef } from "../../src/db";
import { findAccount } from "../../src/features/members/queries";
import { serverSecret } from "../../src/features/members/secret";
import {
  claimedMember,
  type DataScope,
  memberSessionValid,
  publicDemo,
  SESSION_COOKIE,
} from "../../src/lib/session";

/**
 * Who a request to the app's API comes from, and so which data it may see.
 * Someone signed in reaches their own space, within what their role allows.
 * Anyone else gets the sample data to read and nothing to change, or is
 * turned away when no demo is offered.
 */
export type Member = { id: number; name: string; email: string };
export type Verdict =
  | { scope: DataScope; signedIn: boolean; role: Role | null; member: Member | null; space: SpaceRef | null }
  | { refuse: 401 };

export async function decide(method: string, cookie: string | undefined): Promise<Verdict> {
  const claimed = claimedMember(cookie);
  if (claimed != null) {
    const account = await findAccount(claimed);
    if (account && memberSessionValid(cookie, await serverSecret(), account.user)) {
      const { user, space } = account;
      return {
        scope: "real",
        signedIn: true,
        role: user.role,
        member: { id: user.id, name: user.name, email: user.email },
        space: { id: space.id, store: space.store },
      };
    }
  }
  if (!publicDemo()) return { refuse: 401 };
  const reading = method === "GET" || method === "HEAD";
  return {
    scope: reading ? "demo" : "demo-readonly",
    signedIn: false,
    role: null,
    member: null,
    space: null,
  };
}

/**
 * What a member with the visitor role may ask for: the cleaning schedule and
 * the properties, to read, and two changes: saying a cleaning is done, skipped
 * or to do again (the handler takes nothing else from them), and their own
 * password. Everything else is an admin's. Paths are the API's own, after
 * `/api/app`.
 */
const VISITOR_READS = /^\/(?:session|nav|cleaning|stays|properties(?:\/\d+(?:\/preview)?)?)$/;
const VISITOR_CLEANING = /^\/cleanings\/\d+\/\d{4}-\d{2}-\d{2}$/;

export const visitorMay = (method: string, path: string) =>
  method === "GET" || method === "HEAD"
    ? VISITOR_READS.test(path)
    : method === "PUT" && (VISITOR_CLEANING.test(path) || path === "/account/password");

export { SESSION_COOKIE };
