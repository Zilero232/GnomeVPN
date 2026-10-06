# GnomeVPN Style Guide

Project code-style conventions for `apps/client/`, `apps/server/` and the shared
packages. Architectural rules live in [`docs/architecture/fsd.md`](../architecture/fsd.md);
the design decisions behind the product are in [`docs/architecture/`](../README.md#architecture).
The compressed editing versions of these guides are the digests in
[`.claude/rules/`](../../.claude/rules/), loaded automatically by path.

Tools:

- **ESLint** (`bun lint` / `bun lint:fix`) — linter + import sorting (`perfectionist/sort-imports`) + `padding-line-between-statements`. Config: the root `eslint.config.mjs`.
- **Prettier** (`bun format` / `bun format:check`) — formatter. Config: `prettier.config.mjs`.
- **Stylelint** (`bun lint:css`) — SCSS modules.
- **TypeScript** `strict`, from the `@siberiacancode/tsconfig` presets. `noUnusedLocals`/`noUnusedParameters` are off there; unused code is ESLint's job (`unused-imports/no-unused-vars`, `unused-imports/no-unused-imports`).
- FSD boundaries and a handful of React conventions are kept by hand and caught at review (the linter does not cover hook order or FSD cross-slice imports).

**Why ESLint + Prettier:** the `@siberiacancode/*` configs already carry a rule set for
React/TS/SCSS, and `perfectionist` plus `padding-line-between-statements` autofix exactly
the two things that would otherwise have to be kept by hand. It all runs under one
command — `bun run verify` (typecheck + ESLint + Prettier + Stylelint).

## Sections

### Client (`apps/client`)

- [Slice structure](client/slices.md) — §1
- [Slice `ui/` and `ui-kit`](client/slice-ui.md) — §2, §2.1
- [`model/hooks` structure](client/model-hooks.md) — §2.2
- [Styles and SCSS](client/styles.md) — §3, §12, breakpoints, animation
- [Component size](client/component-size.md) — §4
- [React conventions](client/react.md) — §10, §9.1–9.3, server and browser, shared feature state
- [The `model/`, `lib/` and `api/` segments](client/segments.md) — §11
- [Component body order](client/component-body.md) — §13.5
- [Forms](client/forms.md) — §15
- [Conditional render](client/conditional-render.md) — §16, §15.1
- [Drill cleanup](client/drill-cleanup.md) — §17
- [i18n and locales](client/i18n.md)

### Server (`apps/server`)

- [Server modules — NestJS](server/nestjs.md) — §18, module convention, environment, errors, outbound calls
- [Data — Prisma and the sweeps](server/data.md) — migrations and indexes, the pg pool, strict parsing on write, revocation and restore

### Shared (TypeScript everywhere)

- [Naming](shared/naming.md) — §5
- [Imports and barrels](shared/imports-and-barrels.md) — §6, §7
- [Types](shared/types.md) — §8, §8.1
- [Functions](shared/functions.md) — §9, §9.5, object parameters
- [Blank lines](shared/blank-lines.md) — §13, let the code breathe
- [Readability](shared/readability.md) — §9.4, destructuring
- [Comments](shared/comments.md)
- [Constants and config](shared/constants-and-config.md)
- [Folders](shared/folders.md) — one concern, not one function
- [Dependencies](shared/dependencies.md) — reuse over reinvention, the catalog
- [Shared schemas](shared/schemas.md) — §14
- [Tests](shared/testing.md)
- [Forbidden](shared/forbidden.md) — §19
- [Checklist before a commit](shared/checklist.md) — §20, verification, the toolchain
