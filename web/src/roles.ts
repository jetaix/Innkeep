import type { NavId } from "@/config/navigation";

/**
 * What each role sees. The server enforces it (see `web/server/scope.ts`);
 * this keeps the menu and the addresses in step, so a visitor is never shown
 * a page that would only answer "not for you".
 */
export type Role = "admin" | "visitor";

/** The pages of the menu a visitor has. */
export const VISITOR_PAGES: readonly NavId[] = ["cleaning", "properties"];

/** Whether someone with this role may open the page at `pathname`. No role means no restriction of this kind. */
export function mayOpen(role: Role | null, pathname: string): boolean {
  if (role !== "visitor") return true;
  // Adding a property is a change: an admin's.
  if (pathname === "/properties/new") return false;
  return VISITOR_PAGES.some((page) => pathname === `/${page}` || pathname.startsWith(`/${page}/`));
}

/** Where a visitor lands, and is sent back to. */
export const VISITOR_HOME = "/cleaning";
