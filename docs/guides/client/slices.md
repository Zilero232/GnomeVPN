# Slice structure

Part of the [style guide](../README.md).

## 1. Slice structure

Every slice is a folder of segments. The minimum is `ui/` + `index.ts`:

```
features/billing/checkout/
  index.ts          ← public API (barrel)
  ui/               ← React components
  model/            ← hooks, contexts, state types
  lib/              ← pure slice utilities
  api/              ← the I/O boundary: subscriptions, mappers, service wrappers (when there are any)
  config/           ← constants, configuration
```

Slices are grouped by business domain (`account`, `app`, `auth`, `billing`, `site`, `vpn`) — a layer on top
of canonical FSD, see [`docs/architecture/fsd.md`](../../architecture/fsd.md) §2. Always import down to the slice level:
`@/features/billing/checkout`, not `@/features/billing`.
