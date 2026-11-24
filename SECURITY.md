# Security

Innkeep is self-hosted. One password (`APP_PASSWORD`) protects every page; there
are no separate accounts yet. Set it before the app is reachable from the
internet, or keep the app on a private network. Only these routes are designed
to be reachable without the password, each protected by its own secret:

- `/api/ical/<token>/…` (random per-property token; exposes booked dates, never guest names)
- `/api/mcp` (`MCP_TOKEN` bearer token)
- `/api/ingest/…` (`EXTENSION_TOKEN` bearer token; used by the browser extension)
- `/api/cron` (`CRON_SECRET`; asks Innkeep to sync and send its Telegram messages)

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability
reporting on this repository (Security tab, "Report a vulnerability"). You
will get an answer within a week.

## Supported versions

Only the latest code on `main` receives fixes. There are no maintained older
versions yet.
