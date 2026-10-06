---
paths:
  - '**/package.json'
---

<!-- Loaded automatically when a package.json is edited. -->
<!-- The full reasoning is docs/guides/shared/dependencies.md; keep them in sync. -->

# Dependencies — catalog versions

## Shared versions live in the catalog

A dependency used by more than one workspace is pinned once in
`workspaces.catalog` of the root `package.json` and referenced as
`"remeda": "catalog:"`. Bumping means editing the catalog, not the packages;
adding a shared dependency means the catalog **and** `catalog:` in every consumer.

A package that must move in lockstep with a catalogued one is catalogued too,
even with one consumer — `react` without `react-dom` put two Reacts in the tree.
A peer dependency matches its host's major: `@nestjs/swagger@12` beside NestJS 11
installs cleanly and fails at runtime.
