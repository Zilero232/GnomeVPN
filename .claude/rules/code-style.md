---
paths:
  - "**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"
---

<!-- Compressed editing rules, loaded automatically when a TS/JS file is edited. -->
<!-- The reasoning behind each one lives in CLAUDE.md; keep the two in sync. -->

# Code style — TypeScript

## No comments

The code is expected to read on its own. `apps/client` has zero comments and
stays that way; the reasoning belongs in CLAUDE.md or the commit message. Build scripts under `scripts/` and YAML in `.github/` are the exception —
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
(typed branching), `date-fns`, `motion` (animation), `p-retry`,
`@base-ui/react` (unstyled primitives), `pino` (server logs).

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

## Constants group into objects, and config splits by concern

Values that are read together live in one frozen object rather than side by side
as loose exports. `LINK_CODE.ttlMinutes` says which code it belongs to;
`LINK_CODE_TTL_MINUTES` next to eight other flat constants says only that
somebody had a number.

```ts
// no — a file of unrelated exports, and the reader has to hold the prefixes
export const LINK_CODE_LENGTH = 8;
export const LINK_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const LINK_CODE_TTL_MINUTES = 15;

// yes
export const LINK_CODE = {
  length: 8,
  alphabet: 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
  ttlMinutes: 15
} as const;
```

A `config/` folder holds one file per concern — `link-code.config.ts`,
`webhook.config.ts`, `callback.config.ts` — not one `<module>.config.ts` that
accumulates everything the module ever needed. The barrel re-exports them, so a
call site still imports from `../config` and never learns the file names.

Two things stay flat: a single value with no siblings, and a name that is part
of a package's public API, where grouping would rename it for every consumer.

## Tests sit next to what they test

A Vitest suite lives in a `_tests/` folder beside the source, named after it:
`shared/i18n/_tests/locale-path.test.ts`. Playwright specs live in `e2e/`.
Only pure logic is covered — anything needing a database, a node over SSH or a
live tunnel is verified by running it.

**Assert the relationship, not the business value.** A test that spells out a
price, a discount or a piece of copy breaks every time somebody changes it for a
commercial reason, and catches nothing when the logic breaks. Import the constant
and compute against it, or assert the property: a longer plan never costs more
per month, the cheapest per-month price undercuts every plan, the discount equals
what the table recomputes. The billing suites did the former and had to be edited
by hand on every repricing.

A test whose two sides both come from the code under test cannot fail. Comparing
a component's default render to the same component rendered with the default
value proves nothing.

## Verify before claiming anything works

`bun run verify` — typecheck, ESLint, Prettier, Stylelint. `bun run test` is
separate; bare `bun test` is Bun's own runner and fails the suite. `checks.yml`
runs both on every push and pull request.

Neither catches SSR breakage. `bun --filter @gnomevpn/client build` is the only
check that does — it is where a page that typechecks but throws during prerender
fails, and where a missing translation key surfaces as `MISSING_MESSAGE`.
