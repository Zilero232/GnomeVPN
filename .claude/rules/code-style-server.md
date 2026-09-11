---
paths:
  - "apps/server/**/*.ts"
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- Full module convention in apps/server/CLAUDE.md; keep the two in sync. -->

# Code style — server

NestJS on Bun + Prisma 7 + Postgres. Bun runs the TypeScript directly, no build
step.

## Module shape

`x.module.ts` + `x.controller.ts` + `services/`, plus `dto/`, `guards/`, `lib/`,
`config/` as needed. Controllers validate, delegate, return — logic lives in
`services/<domain>.service.ts`, **one service per domain of work**, never a fat
`x.service.ts` at the module root.

There is no facade: a consumer injects the specific domain service it uses, and
the module `exports` only what other modules legitimately call. Helpers shared by
2+ domains go into a `*-shared` service rather than being duplicated.

## Nothing but the class in a service or controller file

| What                               | Where                                                     |
| ---------------------------------- | --------------------------------------------------------- |
| Constants, timeouts, lookup tables | `config/x.config.ts` or `<name>.constants.ts` in its folder |
| Pure functions                     | `lib/<name>/` — one folder per **concern**                  |
| Types                              | `x.types.ts` next to the file that owns them                |

Import from a module's barrel across boundaries, never reach into its files.
Inside a module, relative paths are fine.

## Errors

Throw the app exceptions from `common/exceptions` with a code from
`@gnomevpn/schemas`. The client matches on the code, so the message is free text
but the code is a contract.

```ts
throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
```

## Environment

`config/env.schema.ts` validates on boot and **throws** on a missing variable.
Node panel passwords are the exception: the `node` table stores the _name_ of an
env var (`apiTokenEnvVar`), never the secret.

## Outbound calls

Every `fetch` carries a timeout — `AbortSignal.timeout(MS)`, not a hand-rolled
`AbortController`. A payment call without one holds the connection indefinitely.

## A revocation needs a restore

Any job that moves rows into a blocked state must have a pass that moves them
back when the reason is gone, in the same sweep. `expired-access` disabled
configs on a lapsed subscription while only the payment webhook re-enabled them,
so a webhook failing after its transaction committed left a paying user with
nothing able to restore access. The predicates are complements — `lapsedBefore`
and `activeSince` — and a gap between them either strands a payer or keeps
serving an expired account.

Work that must happen after a transaction commits is best-effort by definition.
Log it and make a sweep the guarantee; never let it be the only path.

## Parse strictly on a write path

`readSettings` returns `null` on malformed JSON so the caller can refuse;
`parseJson` returns `{}` and belongs to reads. A tolerant parse on a write path
turns unreadable settings into an empty object, which then overwrites the real
one — that is how a node's clients were erased once already.

## The panel does not restart its own core

`XrayClient` talks to the **3x-ui panel**, not to Xray-core. Every mutating
endpoint ends in `SetToNeedRestart()`, which only sets a flag — nothing acts on
it. Any change to clients needs an explicit `restartCore()`, or the running core
never learns about it.

That restart drops every live session on the node, so batch it: one restart at
the end of a pass, only when something actually changed.
