import { signUp } from "../../src/features/members/mutations";
import { serverSecret } from "../../src/features/members/secret";
import { memberSessionValue, SESSION_COOKIE } from "../../src/lib/session";

/**
 * For tests: creates an account and answers with the cookie its browser would
 * send. The first one made owns the main database, where tests put their rows.
 */
export async function signedUp(email = "host@example.com", name = "The host") {
  const { user, space } = await signUp({ name, email, password: "a long enough password" });
  return { user, space, cookie: `${SESSION_COOKIE}=${memberSessionValue(await serverSecret(), user)}` };
}
