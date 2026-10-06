---
paths:
  - 'apps/server/**/*.ts'
  - 'scripts/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/server/nestjs.md; keep them in sync. -->

# Code style — server: outbound calls

## Outbound calls

Every `fetch` carries a timeout — `AbortSignal.timeout(MS)`, not a hand-rolled
`AbortController`. A payment call without one holds the connection indefinitely.
