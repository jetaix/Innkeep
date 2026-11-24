import { NextResponse, type NextRequest } from "next/server";
import { appPassword, SESSION_COOKIE, sessionValid } from "@/lib/session";

/**
 * Landing-only mode, for publishing the public pages without the app.
 *
 * With `LANDING_ONLY=1` only the landing page and the Alternatives pages are
 * served. The dashboard and every API route answer as if they did not exist:
 * a public host has no database to keep and must never expose a host's data.
 * Without the variable this does nothing and Innkeep runs in full.
 */
const PUBLIC_PAGES = /^\/(?:(?:alternatives|guides)(?:\/[a-z0-9-]+)?|ai)?$/;
// Icons, the app manifest and the notes for search engines are fetched without a session: never gate them.
const PUBLIC_FILES =
  /^\/(?:icon\.svg|favicon\.ico|apple-icon(?:\.png)?|icons\/[a-z0-9-]+\.png|manifest\.webmanifest|opengraph-image|twitter-image|robots\.txt|sitemap\.xml)$/;

/**
 * With `APP_PASSWORD` every page asks for it first. API routes are left to
 * their own tokens (the extension, MCP, the calendar links), so
 * the machines that call them keep working.
 */
function passwordGate(request: NextRequest, password: string) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/") || PUBLIC_FILES.test(pathname)) return NextResponse.next();
  const signedIn = sessionValid(request.cookies.get(SESSION_COOKIE)?.value, password);
  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/overview", request.url), 307) : NextResponse.next();
  }
  return signedIn ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url), 307);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (process.env.LANDING_ONLY !== "1") {
    const password = appPassword();
    if (password) return passwordGate(request, password);
    // A public host with no password would hand the dashboard to anyone who finds the address.
    if (process.env.VERCEL && !pathname.startsWith("/api/") && !PUBLIC_FILES.test(pathname)) {
      return new NextResponse("Innkeep is not configured: set APP_PASSWORD, then redeploy.", { status: 503 });
    }
    // Nothing to sign in to: the page would only confuse.
    if (pathname === "/login") return NextResponse.redirect(new URL("/overview", request.url), 307);
    return NextResponse.next();
  }
  if (PUBLIC_PAGES.test(pathname) || PUBLIC_FILES.test(pathname)) return NextResponse.next();
  // Machines get a plain "not found"; a person following an old link lands on the home page.
  if (pathname.startsWith("/api/")) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(new URL("/", request.url), 307);
}

export const config = {
  // Everything except the framework's own assets.
  matcher: ["/((?!_next/).*)"],
};
