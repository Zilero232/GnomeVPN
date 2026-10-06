---
paths:
  - 'apps/server/**/*.ts'
  - 'scripts/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/server/data.md; keep them in sync. -->

# Code style — server: strict parsing on write

## Parse strictly on a write path

`readSettings` and `readClients` (`lib/xray/xray.helpers.ts`) return `null` on
malformed JSON so the caller can refuse — `XrayClient` throws `NODE_UNAVAILABLE`
rather than rewrite an inbound whose clients it could not read. A tolerant parse
on a write path turns unreadable settings into an empty object, which then
overwrites the real one — that is how a node's clients were erased once already.
