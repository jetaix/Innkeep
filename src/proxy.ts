import { NextResponse, type NextRequest } from "next/server";

/**
 * Landing-only mode, for publishing the public pages without the app.
 *
 * With `LANDING_ONLY=1` only the landing page and the Alternatives pages are
 * served. The dashboard and every API route answer as if they did not exist:
 * a public host has no database to keep and must never expose a host's data.
 * Without the variable this does nothing and Innkeep runs in full.
 */
const PUBLIC_PAGES = /^\/(?:alternatives(?:\/[a-z0-9-]+)?)?$/;
const PUBLIC_FILES = /^\/(?:icon\.svg|opengraph-image|favicon\.ico|robots\.txt)$/;

export function proxy(request: NextRequest) {
  if (process.env.LANDING_ONLY !== "1") return NextResponse.next();
  const { pathname } = request.nextUrl;
  if (PUBLIC_PAGES.test(pathname) || PUBLIC_FILES.test(pathname)) return NextResponse.next();
  // Machines get a plain "not found"; a person following an old link lands on the home page.
  if (pathname.startsWith("/api/")) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(new URL("/", request.url), 307);
}

export const config = {
  // Everything except the framework's own assets.
  matcher: ["/((?!_next/).*)"],
};
