# Dependencies

Part of the [style guide](../README.md).

## Reuse over reinvention

Before writing a helper by hand, check whether an installed library already covers it.

1. Generic React hooks → **`@siberiacancode/reactuse`** (`useLocalStorage`, `useClickOutside`, …)
2. Array / object manipulation → **`remeda`**
3. Typed branching → **`ts-pattern`** (`match`, `.with`, `.exhaustive`)
4. Dates and durations → **`date-fns`**
5. Animation → **`motion`**, presets in `shared/lib/motion`
6. Retries with backoff → **`p-retry`**
7. Unstyled primitives → **`@base-ui/react`** — every `ui-kit` molecule wraps one
8. Logs → **`@gnomevpn/logger`** — one `createLogger`, never a second `pino()` call

Only libraries **already declared** in a `package.json` count. A transitive
dependency used directly is a phantom dependency — it passes locally through
hoisting and fails on a clean CI install.

## Shared versions live in the catalog

A dependency used by more than one workspace is pinned once, in the
`workspaces.catalog` block of the root `package.json`, and referenced as
`"remeda": "catalog:"` from each package that needs it. That is what keeps the
client and the server from drifting apart — `remeda` was already shipping as two
copies (`2.17` and `2.39`) before the catalog existed.

Bumping a shared version means editing the catalog, not the packages. Adding a
new shared dependency means adding it to the catalog **and** pointing each
consumer at `catalog:`.

**A package that must move in lockstep with a catalogued one belongs in the
catalog too, even with a single consumer.** `react` was catalogued and `react-dom`
was not, so bumping `react` to 19.3 left `react-dom` on 19.2 and put two copies of
React in the tree — every component test died on `Cannot read properties of null
(reading 'useState')`, because hooks resolved against a different React than the
renderer used.

**A peer dependency must match its host's major.** `@nestjs/swagger@12` installs
cleanly next to NestJS 11 and then fails at runtime with
`Export named 'loadPackageSync' not found` — `nestjs-zod` catches that as "swagger
is not installed" and every `@ZodResponse` controller refuses to load.
