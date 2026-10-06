---
paths:
  - '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The full reasoning is docs/guides/shared/comments.md; keep them in sync. -->

# Code style — TypeScript: comments

## No comments

The code is expected to read on its own. `apps/client` has no comments beyond
lint directives (`// eslint-disable-next-line <rule> -- <reason>`), and stays that way; the reasoning belongs in `docs/` or the commit message.
Build scripts under `scripts/` and YAML in `.github/` are the exception — they
already carry comments.
