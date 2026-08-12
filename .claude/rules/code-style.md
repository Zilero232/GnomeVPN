---
paths:
  - "**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The reasoning behind each one lives in CLAUDE.md; keep the two in sync. -->

# Code style — TypeScript

## No comments

The code is expected to read on its own. `crates/` and `apps/client` have zero
comments and stay that way; the reasoning belongs in CLAUDE.md or the commit
message. Build scripts under `scripts/` and YAML in `.github/` are the exception —
they already carry comments.

## Two or more parameters → one object

The shape lives in a sibling `*.types.ts` as `<Fn>Input`, so a call site never has
to guess argument order. One-argument functions stay positional.

```ts
connect({ nodeId, country });

// no
connect(nodeId, country);
```

NestJS constructors are not this: injecting collaborators positionally is the
framework's own convention and is used throughout `apps/server`.

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

## Reuse over reinvention

Before writing a helper, check whether an installed library covers it:
`@siberiacancode/reactuse` (React hooks), `remeda` (arrays/objects), `ts-pattern`
(typed branching), `date-fns`, `pretty-bytes`, `motion` (animation), `p-retry`.

Only libraries **already declared** in a `package.json` count. A transitive
dependency used directly is a phantom dependency — it passes locally through
hoisting and fails on a clean CI install.

## Import order

types → builtin/external → internal (`@/`) → relative → styles → side-effects.
`perfectionist/sort-imports` enforces it; `bun lint:fix` sorts.

## Shared versions live in the catalog

A dependency used by more than one workspace is pinned once in
`workspaces.catalog` and referenced as `"remeda": "catalog:"`. Bumping means
editing the catalog, not the packages.

## Folders are one concern, not one function

Each gets its own `index.ts`, `<name>.types.ts` and `<name>.constants.ts` where
it needs them. A helper too small to have its own types belongs in the
`<name>.helpers.ts` of the concern that uses it — a one-line regex behind its own
barrel is three levels of indirection for one statement.

## Verify before claiming anything works

`bun run verify` — typecheck, ESLint, Prettier, Stylelint, `cargo fmt --check`,
`cargo clippy -D warnings`. Nothing in CI checks an ordinary commit, so this is
the first check and the last one.
