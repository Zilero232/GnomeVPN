# Tests

Part of the [style guide](../README.md).

## Tests sit next to what they test

A Vitest suite lives in a `_tests/` folder beside the source, named after it:
`shared/i18n/locale-path/_tests/locale-path.test.ts`. Playwright specs live in `e2e/`.
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

`isolate: false` lives in each project's own `vitest.config.ts`, never in the
root one — projects listed by file path do not inherit the root `test` block, so
a setting put there is silently ignored. It is safe because the client's
`vitest.setup.ts` calls `cleanup()` in `afterEach`; a suite that starts leaking
state between files fails under `--sequence.shuffle` before it fails in CI.

## How Vitest is wired

**`bun run test`, never `bun test`.** Bare `bun test` is Bun's own runner, which
claims the name before the script does — it collects the same files, then fails
them all on `vi.setSystemTime is not a function`, because it is not Vitest.

Vitest is wired as projects: `packages/schemas`, `packages/logger`,
`packages/scripts`, `apps/server`, `apps/client` and `scripts/` (the provision
pipeline) each own a `vitest.config.ts`, and the root one lists them.
