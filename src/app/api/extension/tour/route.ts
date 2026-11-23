import { consumeRunKey } from "@/features/extension/run";
import { recordExtension } from "@/features/extension/status";
import { tourSteps } from "@/features/extension/tour";
import { hasBearerToken } from "@/lib/auth";

/**
 * The pages a run of the browser extension should go through.
 *
 *   GET /api/extension/tour?scope=reservations|all   (from the extension's popup)
 *   GET /api/extension/tour?key=…                    (from a button in Innkeep)
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
export async function GET(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await recordExtension(request);

  const url = new URL(request.url);
  // A run started from a button in Innkeep carries a one-time key, which also fixes its scope.
  const key = url.searchParams.get("key");
  const keyed = key ? await consumeRunKey(key) : null;
  if (key && !keyed)
    return Response.json({ error: "This link has expired. Press the button again." }, { status: 410 });
  const scope = keyed ?? (url.searchParams.get("scope") === "all" ? "all" : "reservations");
  const origin = process.env.APP_URL?.replace(/\/$/, "") ?? url.origin;
  return Response.json({
    ok: true,
    steps: await tourSteps(scope),
    // Where the run ends: the page that shows what is now up to date.
    doneUrl: `${origin}/${scope === "all" ? "data" : "reservations"}`,
  });
}
