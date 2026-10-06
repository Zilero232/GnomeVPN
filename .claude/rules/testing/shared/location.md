---
paths:
  - '**/_tests/**/*.{ts,tsx}'
  - 'e2e/**/*.spec.ts'
  - '**/vitest.config.*'
  - 'playwright.config.ts'
---

<!-- Auto-loaded when editing tests or their configs. -->
<!-- The full reasoning is docs/guides/shared/testing.md; keep them in sync. -->

# Tests — where they live

## Tests sit next to what they test

A Vitest suite lives in a `_tests/` folder beside the source, named after it:
`shared/i18n/locale-path/_tests/locale-path.test.ts`. Not `__tests__`, not a bare
test file beside the source. Playwright specs live in the root `e2e/`.
