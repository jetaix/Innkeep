import { HTTPException } from "hono/http-exception";

/** What the scope middleware leaves for the handlers. */
export type Env = { Variables: { signedIn: boolean } };

export const notFound = (what: string) => new HTTPException(404, { message: `${what} was not found.` });
export const badRequest = (message: string) => new HTTPException(400, { message });
export const hostOnly = () => new HTTPException(403, { message: "Only the host can see this." });
