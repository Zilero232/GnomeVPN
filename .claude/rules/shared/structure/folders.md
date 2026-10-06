---
paths:
  - '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The full reasoning is docs/guides/shared/folders.md; keep them in sync. -->

# Structure — folders

## Folders are one concern, not one function

Each gets its own `index.ts`, `<name>.types.ts` and `<name>.constants.ts` where
it needs them. A helper too small to have its own types belongs in the
`<name>.helpers.ts` of the concern that uses it — a one-line regex behind its own
barrel is three levels of indirection for one statement.
