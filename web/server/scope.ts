import type { Role } from "../../src/db";
import { withData } from "../../src/db";
import { findMember } from "../../src/features/members/queries";
import {
  appPassword,
  claimedMember,
  type DataScope,
  memberSessionValid,
  publicDemo,
  SESSION_COOKIE,
  sessionValid,
} from "../../src/lib/session";

/**
 * Who a request to the app's API comes from, and so which data it may see.
 * Without a password there is one household, all admins. With one, the owner
 * signs in with it and the members an admin invited sign in with their own:
 * both reach the host's data, a member within what their role allows. Anyone
 * else gets the sample data to read and nothing to change, or is turned away
 * when no demo is offered.
 */
export type Verdict =
  | { scope: DataScope; signedIn: boolean; role: Role | null; member: { id: number; name: string } | null }
  | { refuse: 401 };

const OWNER = { scope: "real", signedIn: true, role: "admin", member: null } as const;

export async function decide(method: string, cookie: string | undefined): Promise<Verdict> {
  const password = appPassword();
  if (!password) return OWNER;
  if (sessionValid(cookie, password)) return OWNER;
  const claimed = claimedMember(cookie);
  if (claimed != null) {
    // The members are the host's own data, whoever is asking.
    const member = await withData("real", () => findMember(claimed));
    if (member && memberSessionValid(cookie, password, member)) {
      return {
        scope: "real",
        signedIn: true,
        role: member.role,
        member: { id: member.id, name: member.name },
      };
    }
  }
  if (!publicDemo()) return { refuse: 401 };
  const reading = method === "GET" || method === "HEAD";
  return { scope: reading ? "demo" : "demo-readonly", signedIn: false, role: null, member: null };
}

/**
 * What a member with the visitor role may ask for: the cleaning schedule and
 * the properties, to read, and one change: saying a cleaning is done, skipped
 * or to do again (the handler takes nothing else from them). Everything else
 * is an admin's. Paths are the API's own, after `/api/app`.
 */
const VISITOR_READS = /^\/(?:session|nav|cleaning|stays|properties(?:\/\d+(?:\/preview)?)?)$/;
const VISITOR_CLEANING = /^\/cleanings\/\d+\/\d{4}-\d{2}-\d{2}$/;

export const visitorMay = (method: string, path: string) =>
  method === "GET" || method === "HEAD"
    ? VISITOR_READS.test(path)
    : method === "PUT" && VISITOR_CLEANING.test(path);

export { SESSION_COOKIE };
