---
paths:
  - '**/_tests/**/*.{ts,tsx}'
  - 'e2e/**/*.spec.ts'
  - '**/vitest.config.*'
  - 'playwright.config.ts'
---

<!-- Auto-loaded when editing tests or their configs. -->
<!-- The full reasoning is docs/guides/shared/checklist.md; keep them in sync. -->

# Tests — running them

## `bun run test`, never `bun test`

Bare `bun test` is Bun's own runner: it collects the same files and fails them
all on `vi.setSystemTime is not a function`, because it is not Vitest.
`bun run test:e2e` runs Playwright over the public routes.
