---
paths:
  - '**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The full reasoning is docs/guides/shared/blank-lines.md; keep them in sync. -->

# Code style — TypeScript: blank lines

## Let the code breathe

A function body reads as paragraphs. Prettier only preserves blank lines and
never inserts them, so `padding-line-between-statements` does it and
`bun lint:fix` applies it.

Blank line between the `const`/`let` setup block and the logic acting on it;
before every `return`/`throw`/`continue`/`break`; around every block (`if`, `for`,
`try`, `switch`) and every **multiline** call. Consecutive one-line statements
stay grouped on purpose. Never two blank lines in a row.

```ts
const url = new URL(`hy2://${config.server}`);

url.username = config.auth;
url.pathname = '/';

return url.toString();
```
