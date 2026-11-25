import { getRequestListener } from "@hono/node-server";
import { server } from "./app";

/**
 * The API as one Vercel function. The pages are files Vercel serves itself;
 * `scripts/vercel-output.ts` writes the table that sends `/api/…` here.
 *
 * That table passes the address that was asked for in `__path`, because a
 * function is told its own name and not the visitor's.
 */
export default getRequestListener((request) => {
  const url = new URL(request.url);
  const asked = url.searchParams.get("__path");
  if (asked === null) return server.fetch(request);
  url.searchParams.delete("__path");
  url.pathname = `/${asked}`;
  return server.fetch(new Request(url, request));
});
