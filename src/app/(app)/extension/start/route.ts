import { createRunKey } from "@/features/extension/run";

/**
 * Where the "Refresh" buttons of Innkeep point. Makes a one-time key and
 * sends the browser to the page the extension watches for.
 *
 * Only a click inside Innkeep counts: a link from another site is refused,
 * so no other page can set a run going.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("sec-fetch-site") !== "same-origin") {
    return Response.redirect(new URL("/data", url), 303);
  }
  const scope = url.searchParams.get("scope") === "all" ? "all" : "reservations";
  const target = new URL("/extension/run", url);
  target.searchParams.set("scope", scope);
  target.searchParams.set("key", createRunKey(scope));
  return Response.redirect(target, 303);
}
