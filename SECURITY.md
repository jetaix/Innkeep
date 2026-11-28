# Security

Innkeep is self-hosted. Every page of the dashboard needs an account: people
sign in with an email and a password of their own (kept as a salted scrypt
hash), and the session cookie is signed by the server. Each account that signs
up has its own space, kept in a database of its own, so one space's requests
cannot read another's rows; the people invited into a space have a role, which
the server enforces for every request. The first account created owns the main
database (`OWNER_EMAIL` reserves it for one address); after it, only addresses
the host approved can sign up unless `SIGN_UP` says otherwise. Innkeep does
not verify email addresses. Only these routes are
designed to be reachable without a session, each protected by its own secret:

- `/api/ical/<token>/…` (random per-property token; exposes booked dates, never guest names)
- `/api/mcp` (`MCP_TOKEN` bearer token, or the token of one space shown in its Settings)
- `/api/ingest/…` (`EXTENSION_TOKEN` bearer token, or one space's own; used by the browser extension)
- `/api/cron` (`CRON_SECRET`; asks Innkeep to sync and send its Telegram messages)

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability
reporting on this repository (Security tab, "Report a vulnerability"). You
will get an answer within a week.

## Supported versions

Only the latest code on `main` receives fixes. There are no maintained older
versions yet.
