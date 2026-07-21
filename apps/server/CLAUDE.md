# CLAUDE.md — apps/server

Guidance for the API. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**NestJS on Bun** + Prisma 7 + Postgres. Bun runs the TypeScript directly — no build step.

## Layout

```text
src/
├── modules/         # one folder per domain
│   ├── auth/        # better-auth module wiring
│   ├── billing/     # YooKassa checkout and webhooks — config/ guards/ lib/
│   ├── health/      # /health — also probes the database
│   ├── nodes/       # public node list with health status — config/ lib/
│   ├── release/     # desktop release + updater manifest, proxied from GitHub — config/ lib/
│   ├── scheduler/   # cron jobs — config/ jobs/
│   ├── subscription/# guards/
│   └── tunnel/      # tunnel sessions and downloadable configs — config/ lib/
├── lib/             # external integrations: auth, wg-easy, yookassa
├── core/            # Prisma service
├── common/          # exceptions, filters, decorators
└── config/          # env schema (Zod)
```

## Module convention

A module is `x.module.ts` + `x.controller.ts` + `x.service.ts`, plus `dto/`, `guards/`, `lib/`, `config/` as needed. Controllers stay thin: validate, delegate, return. Business logic lives in the service.

**Nothing but the class lives in a service or controller file.** Constants, lookup tables and pure functions go elsewhere, so the file reads as behaviour rather than a mix of data and logic:

| What | Where |
| --- | --- |
| Constants, timeouts, lookup tables | `config/x.config.ts` |
| Pure functions | `lib/` |
| Types | `x.types.ts` |

```ts
// no — a service file holding data
const CACHE_TTL_MS = 10 * 60_000;
const EXTENSION_TO_PLATFORM = { exe: 'windows' };

// yes
import { CACHE_TTL_MS, EXTENSION_TO_PLATFORM } from './config';
```

Every module has an `index.ts` — its public API. **Import from the barrel across module boundaries**, never reach into another module's files:

```ts
import { SubscriptionGuard } from '../subscription';       // yes
import { SubscriptionGuard } from '../subscription/guards/subscription.guard'; // no
```

Inside a module, relative paths are fine. The barrel exports only what other modules legitimately need — a controller or a DTO has no business being imported elsewhere.

The better-auth instance lives in `lib/auth/`, not in `modules/auth/`: it is configuration for an external library, and `modules/auth/` only wires it into Nest.

DTOs come from shared schemas:

```ts
export class NodeDto extends createZodDto(nodeSchema) {}
```

The schema itself belongs in [`packages/schemas`](../../packages/schemas) — the client imports the same one.

## Environment

`config/env.schema.ts` validates on boot and **throws** on a missing variable. That is deliberate: a server that starts without `DATABASE_URL` fails later, in a harder-to-read way.

Node panel passwords are the exception. The `node` table stores the *name* of an env var (`wgEasyApiKeyEnvVar`), never the password:

```ts
const key = process.env[node.wgEasyApiKeyEnvVar];
```

So credentials stay out of the database, and adding a country means adding one `WG_KEY_XX` to `.env`.

## Errors

Throw the app exceptions from `common/exceptions` with a code from `@gnomevpn/schemas`:

```ts
throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'wg-easy node unreachable');
```

The client matches on the code, so the message is free text but the code is a contract.

## Billing

Prices live in `PLANS` ([`packages/schemas`](../../packages/schemas)), not in the environment: the server charges from that list and the landing page renders from it, so an advertised price cannot drift from a billed one.

Two flags decide what auto-renewal does, and they are not the same thing:

- **`YOOKASSA_RECURRING`** — whether the shop *can* charge recurrently at all. YooKassa enables this per shop by hand, on request to support; there is no dashboard toggle. Until they do, `save_payment_method` and `POST /v3/payment_methods` both answer `forbidden`, so checkout fails outright. It defaults to `false`.
- **`subscription.cancelAtPeriodEnd`** — whether *this user* wants renewal. Theirs to flip.

Renewal also needs a card on file (`savedCardId`). Without one the job has nothing to charge, so `resumeAutoRenew` refuses rather than promising a renewal that never happens — the client offers `bindCard` instead.

Webhooks are the only thing that activates a subscription; the browser returning to `YOOKASSA_RETURN_URL` proves nothing. `handleWebhook` never trusts the request body either — it re-reads the payment or payment method from the API, because a webhook is just JSON somebody posted. It answers `200` even when it does nothing: any other status makes YooKassa retry for a day.

## Cron jobs

`modules/scheduler` runs four: node health, peer garbage collection, expired access, recurring charges.

Use a raw cron string when the interval has no `CronExpression` constant. Inventing one that doesn't exist crashes the server at boot, and only at boot — nothing catches it earlier.

## Prisma

Schema is split across `prisma/schema/`. The generated client lands in `generated/` and is gitignored, so `prisma generate` must run before typecheck — CI does this explicitly.

**There is no migration history yet** (development used `db push`). Deployment needs one — see [DEPLOY.md](../../DEPLOY.md).

## Verification

```bash
bunx tsc --noEmit
bun run dev            # env validation only fires at boot
curl localhost:4000/health
```
