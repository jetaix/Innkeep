import { HTTPException } from "hono/http-exception";
import type { Role, SpaceRef } from "../../src/db";
import type { Member } from "./scope";

/** What the scope middleware leaves for the handlers. */
export type Env = {
  Variables: {
    signedIn: boolean;
    role: Role | null;
    member: Member | null;
    /** The signed-in person's space; null for a visitor of the demo. */
    space: SpaceRef | null;
  };
};

export const notFound = (what: string) => new HTTPException(404, { message: `${what} was not found.` });
export const badRequest = (message: string) => new HTTPException(400, { message });
export const hostOnly = () => new HTTPException(403, { message: "Only the host can see this." });
export const adminOnly = () => new HTTPException(403, { message: "Only an admin can do this." });
