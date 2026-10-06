---
paths:
  - 'apps/server/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/server/nestjs.md; keep them in sync. -->

# Code style — server: errors

## Errors

Throw the app exceptions from `common/exceptions` with a code from
`@gnomevpn/schemas`. The client matches on the code, so the message is free text
but the code is a contract.

```ts
throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'node has no reality endpoint');
```
