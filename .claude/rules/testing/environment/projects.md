---
paths:
  - '**/vitest.config.*'
  - 'apps/client/vitest.setup.ts'
---

<!-- Auto-loaded when editing tests or their configs. -->
<!-- The full reasoning is docs/guides/shared/testing.md; keep them in sync. -->

# Tests — Vitest projects

## Projects

Vitest is wired as projects: `packages/schemas`, `packages/logger`,
`packages/scripts`, `apps/server`, `apps/client` and `scripts/` each own a
`vitest.config.ts`, and the root one lists them.

`isolate: false` lives in each project's own `vitest.config.ts`, never in the
root one — projects listed by file path do not inherit the root `test` block, so
a setting put there is silently ignored. It is safe because the client's
`vitest.setup.ts` calls `cleanup()` in `afterEach`; a suite that starts leaking
state between files fails under `--sequence.shuffle` before it fails in CI.
