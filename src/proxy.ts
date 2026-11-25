import { NextResponse, type NextRequest } from "next/server";
import {
  appPassword,
  DATA_HEADER,
  type DataScope,
  publicDemo,
  SESSION_COOKIE,
  sessionValid,
} from "@/lib/session";

/**
 * Landing-only mode, for publishing the public pages without the app.
 *
 * With `LANDING_ONLY=1` only the landing page and the Alternatives pages are
 * served. The dashboard and every API route answer as if they did not exist:
 * a public host has no database to keep and must never expose a host's data.
 * Without the variable this does nothing and Innkeep runs in full.
 */
const PUBLIC_PAGES = /^\/(?:(?:alternatives|guides)(?:\/[a-z0-9-]+)?|ai|design)?$/;
// Icons, the app manifest and the notes for search engines are fetched without a session: never gate them.
const PUBLIC_FILES =
  /^\/(?:icon\.svg|favicon\.ico|apple-icon(?:\.png)?|icons\/[a-z0-9-]+\.png|manifest\.webmanifest|design\.md|opengraph-image|twitter-image|robots\.txt|sitemap\.xml)$/;

/**
 * With `APP_PASSWORD` every page asks for it first. API routes are left to
 * their own tokens (the extension, MCP, the calendar links), so
 * the machines that call them keep working.
 */
function passwordGate(request: NextRequest, password: string) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_FILES.test(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return withData(request, machineScope(request));
  const signedIn = sessionValid(request.cookies.get(SESSION_COOKIE)?.value, password);
  if (pathname === "/login") {
    return signedIn
      ? NextResponse.redirect(new URL("/overview", request.url), 307)
      : withData(request, visitorScope(request));
  }
  return signedIn ? withData(request, "real") : NextResponse.redirect(new URL("/login", request.url), 307);
}

/** Lets the request through, saying which data it may see. Whatever the browser sent in that header is replaced. */
function withData(request: NextRequest, scope: DataScope) {
  const headers = new Headers(request.headers);
  headers.set(DATA_HEADER, scope);
  return NextResponse.next({ request: { headers } });
}

/**
 * The API routes that exist, each guarded by its own token. Only these reach
 * the host's data without a session: any other address under `/api/` is a
 * page that does not exist, and a page can be asked to run a server action.
 * A new API route must be added here, or it will be handed the demo.
 */
const API_ROUTES =
  /^\/api\/(?:cron|mcp|extension\/(?:tour|events)|ingest\/(?:listing|page|preview|prices|quote|reservations|reviews)|ical\/[^/]+\/[^/]+)$/;

const machineScope = (request: NextRequest): DataScope =>
  API_ROUTES.test(request.nextUrl.pathname) ? "real" : visitorScope(request);

/** Someone who is not signed in: the sample data to read, and nothing to change. */
const visitorScope = (request: NextRequest): DataScope =>
  request.method === "GET" || request.method === "HEAD" ? "demo" : "demo-readonly";

// Pages that would show how this Innkeep is set up; the demo has nothing to show there.
const HOST_ONLY = /^\/(?:settings|extension|properties\/new)(?:\/|$)/;

/**
 * With `PUBLIC_DEMO` a visitor is not asked for the password: they get the
 * public pages and a dashboard on sample data, which they may read but not
 * change. The host signs in at `/login` and sees their own.
 */
function demoGate(request: NextRequest, password: string) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_FILES.test(pathname)) return NextResponse.next();
  // Machines carry their own token; what they send and read is the host's.
  if (pathname.startsWith("/api/")) return withData(request, machineScope(request));
  const signedIn = sessionValid(request.cookies.get(SESSION_COOKIE)?.value, password);
  if (signedIn) {
    return pathname === "/login"
      ? NextResponse.redirect(new URL("/overview", request.url), 307)
      : withData(request, "real");
  }
  if (HOST_ONLY.test(pathname)) return NextResponse.redirect(new URL("/overview", request.url), 307);
  return withData(request, visitorScope(request));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (process.env.LANDING_ONLY !== "1") {
    const password = appPassword();
    if (password && publicDemo()) return demoGate(request, password);
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
