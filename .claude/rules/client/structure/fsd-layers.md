---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/architecture/fsd.md and docs/guides/client/; keep them in sync. -->

# Code style — client: FSD layers and public API

Feature-Sliced Design with two local tweaks: `pages` → `views` and a root `ui-kit`; slices grouped by
business domain. Imports go downward only:
`app → views → widgets → features → entities → shared`.
`ui-kit` sits beside `shared`: every layer may import `@/ui-kit`, and it imports nothing above `shared`.

## Public API

Import the slice (`@/features/vpn/connect-incy`), never the domain group
(`@/features/vpn`) and never past the barrel. The design system has one root
barrel — `@/ui-kit`; primitives live in `atoms/`, `molecules/`, `organisms/`.

`model/` barrels live in subfolders (`model/hooks/index.ts`), never a slice-level
`model/index.ts`.
