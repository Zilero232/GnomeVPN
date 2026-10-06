---
paths:
  - '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The full reasoning is docs/guides/shared/types.md; keep them in sync. -->

# Code style — TypeScript: types

## `type`, never `interface`

Everything through `type` — Props, unions, aliases, DTOs (`ts/consistent-type-definitions`).
`unknown` instead of `any`; a non-null `!` or an `as` cast needs a reason that
survives review. `import type` / `export type` are enforced and autofixed.

Props live in `<Name>.types.ts` beside the component, in one order in the type
and the destructuring: data → `id`/`className`/`style` → `on<Event>` handlers. At
the JSX call site `perfectionist/sort-jsx-props` sorts alphabetically with
callbacks last; `bun lint:fix` applies it.
