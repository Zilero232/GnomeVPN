# Data — Prisma and the sweeps

Part of the [style guide](../README.md).

## Prisma

The schema is `prisma/base.prisma` (generator and datasource) plus one file per model group under `prisma/schema/`; `prisma.config.ts` points Prisma at the whole `prisma/` folder. The generated client lands in `generated/` and is gitignored, so `prisma generate` must run before typecheck — the server's `postinstall` runs it, which is why CI installs with placeholder `DATABASE_URL`/`DIRECT_URL`: `prisma.config.ts` resolves `DIRECT_URL` through `env()`, though `generate` never connects.

**The migration history lives in `apps/server/prisma/migrations`.** Development
started on `db push`; the first migration is a baseline for a database built that
way, and `deploy.yml` applies the history before the new containers come up — see
[ops/deploy.md](../../ops/deploy.md#6-database-migrations).

**Index the columns something looks up by.** Prisma adds no index for a
foreign key on its own. better-auth reads `session` and `account` by `user_id`
and `verification` by `identifier`, and deleting a user cascades through both
foreign keys, but none of those columns was indexed until
`20261006120000_lookup_indexes`. The same migration adds
`payment(status, created_at)` for the pending-payment sweep, because the
per-user index cannot serve a filter on status and age. A new query that
filters or joins on an unindexed column needs an `@@index` in its `prisma/schema/*.prisma` file and the migration that creates it.

Both Prisma clients (`PrismaService` for the API, `basePrisma` for better-auth)
build their pool through `createPool` in `core/prisma/pg-pool.ts` — one place, with a `pool.on('error')`
listener (pg _requires_ one, or a dropped idle connection crashes the process)
and `maxLifetimeSeconds: 300`. A pooled connection left open for hours eventually
gets reset by the network in between, and the next query on it throws
`Connection terminated unexpectedly` — which surfaced from the scheduler jobs
that reuse connections every minute. Capping the lifetime recycles connections
before they age into that window; verified with `pg_backend_pid()` changing after
the lifetime elapses. Idle-drop was ruled out first — a held connection survived
60s idle through the Docker Desktop port-proxy, so the cause was age, not idleness.

## Parse strictly on a write path

`readSettings` and `readClients` (`lib/xray/xray.helpers.ts`) return `null` on
malformed JSON so the caller can refuse — `XrayClient` throws `NODE_UNAVAILABLE`
rather than rewrite an inbound whose clients it could not read. A tolerant parse
on a write path turns unreadable settings into an empty object, which then
overwrites the real one — that is how a node's clients were erased once already.

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
