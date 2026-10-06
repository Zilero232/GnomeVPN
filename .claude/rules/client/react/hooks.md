---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/react.md; keep them in sync. -->

# Code style — client: hooks, queries and render branches

## Hooks

The React Compiler is on — `useMemo`/`useCallback` only for a semantically
stable ref. Hook groups, a blank line between them: navigation → store/context →
data (queries) → state → ref → memo/callbacks → effects → derived consts. Effect
deps hold what should retrigger the effect plus the stable refs
`exhaustive-deps` asks for (`router`, `t`) — never a whole mutation object; call
`mutate` through a ref synced every render. Load data with `useQuery` and a key,
never `useEffect` + `mutate`.

Destructure a query result on the spot and rename `data` (`data: status`); keep a
`useMutation` result whole.

## Render branches

Three or more branches → `match` from `ts-pattern`, never nested
`if (...) return <X />` or chained ternaries. One branch → `cond && <X />`, with
a boolean condition (`apps.length > 0`, not `apps.length`). Forms are
react-hook-form + `zodResolver` with the schema from `@gnomevpn/schemas` and a
module-level `DEFAULT_VALUES`. A leaf that can call a global hook does so rather
than taking drilled props.
