---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/react.md; keep them in sync. -->

# Code style — client: shared feature state

## Shared feature state

Once more than two components read a feature's hook, put it behind a context.
Threading `ReturnType<typeof useX>` down as a prop leaks the hook's whole shape
into every signature below it.
