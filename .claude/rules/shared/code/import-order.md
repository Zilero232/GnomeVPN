---
paths:
  - '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The full reasoning is docs/guides/shared/imports-and-barrels.md; keep them in sync. -->

# Code style — TypeScript: imports and barrels

## Import order

`perfectionist/sort-imports` sorts imports into groups, with a blank line
between them: external types → external values (packages, `node:` builtins,
`@gnomevpn/*`) → internal types (`@/`) → internal values → relative types →
relative values → styles → side-effect imports.
`bun lint:fix` sorts; don't strip the blank lines by hand.

## Barrels

Import a slice, a module or `@/ui-kit` through its barrel, never past it. A
barrel uses explicit named re-exports — `export * from` is forbidden — and
exports only what the outside needs.
