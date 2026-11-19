# Security

Innkeep is self-hosted and has no login yet: anyone who can reach the app can
use it. Run it on a private network or behind a reverse proxy that
authenticates. Only these routes are designed to be reachable from the
internet, each protected by a secret:

- `/api/ical/<token>/…` (random per-property token; exposes booked dates, never guest names)
- `/api/webhooks/messages` (`WEBHOOK_SECRET` bearer token)
- `/api/mcp` (`MCP_TOKEN` bearer token)
- `/api/ingest/reservations` and `/api/ingest/listing` (`EXTENSION_TOKEN` bearer token)

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability
reporting on this repository (Security tab, "Report a vulnerability"). You
will get an answer within a week.
