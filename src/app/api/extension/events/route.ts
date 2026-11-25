import { z } from "zod";
import { recordExtension } from "@/features/extension/status";
import { latestEventId, notificationsAfter } from "@/features/notifications/queries";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { MESSAGES } from "@/i18n/messages";
import { hasBearerToken } from "@/lib/auth";

/**
 * What the browser extension should notify the host about.
 *
 *   GET /api/extension/events?lang=fr            where to start from, and the "notifications are on" text
 *   GET /api/extension/events?after=12&lang=fr   what happened since event 12
 *   Authorization: Bearer $EXTENSION_TOKEN
 */
const query = z.object({
  after: z.coerce.number().int().min(0).optional(),
  lang: z.string().optional(),
});

export async function GET(request: Request) {
  const token = process.env.EXTENSION_TOKEN;
  if (!token) return Response.json({ error: "Set EXTENSION_TOKEN to enable the extension" }, { status: 503 });
  if (!hasBearerToken(request, token)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await recordExtension(request);

  const parsed = query.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return Response.json({ error: "Invalid query" }, { status: 400 });
  const lang = parsed.data.lang?.slice(0, 2).toLowerCase();
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;

  if (parsed.data.after == null) {
    return Response.json({
      ok: true,
      last: await latestEventId(),
      notifications: [],
      test: MESSAGES[locale].notifications.test,
    });
  }
  return Response.json({ ok: true, ...(await notificationsAfter(parsed.data.after, locale)) });
}
