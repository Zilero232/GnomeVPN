---
paths:
  - 'apps/server/**/*.ts'
  - 'apps/client/**/*.{ts,tsx}'
  - 'scripts/**/*.ts'
  - 'packages/**/*.ts'
---

<!-- Compressed editing rules, loaded automatically on edit. -->
<!-- The full reasoning is docs/architecture/logging.md; keep them in sync. -->

# Code style — logging

## One logger

`@gnomevpn/logger` holds the only `pino()` call; every app gets a child logger by
service name and never configures levels, redaction or transport again.
`REDACTED_PATHS` is the one list of secrets.

## A node's URL is a secret

`node.apiUrl` embeds the panel's random web path. Redaction strips object keys,
not interpolated strings, so a log line names `node.id` (or the bare host in
`XrayClient`), never the URL.
