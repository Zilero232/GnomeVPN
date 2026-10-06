---
paths:
  - '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The full reasoning is docs/guides/shared/checklist.md; keep them in sync. -->

# Verification

## Verify before claiming anything works

`bun run verify` — typecheck, ESLint, Prettier, Stylelint. `bun run test` is
separate; bare `bun test` is Bun's own runner and fails the suite. `deploy.yml`
runs both before it builds an image.

Neither catches SSR breakage. `bun --filter @gnomevpn/client build` is the only
check that does — it is where a page that typechecks but throws during prerender
fails, and where a missing translation key surfaces as `MISSING_MESSAGE`.
