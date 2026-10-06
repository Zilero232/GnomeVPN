# Server modules — NestJS

Part of the [style guide](../README.md).

## 18. Server routes — NestJS

The API is NestJS on Bun, not a route-definition framework. The shape at a
glance, taken from `billing` — the full convention follows in "Module convention":

```text
apps/server/src/modules/billing/
  billing.module.ts
  billing.controller.ts   ← thin: validate, delegate, return
  services/               ← the business logic, one service per domain of work
  dto/                    ← createZodDto(...) wrappers
  guards/                 ← WebhookIpGuard
  lib/                    ← pure functions, one folder per concern
  config/                 ← constants, one file per concern
  index.ts                ← the module's public API
```

## Module convention

A module is `x.module.ts` + `x.controller.ts` + `services/`, plus `dto/`, `guards/`, `lib/`, `config/` as needed. Controllers stay thin: validate, delegate, return. Business logic lives in `services/`.

**Business logic lives in `services/<domain>.service.ts`, one service per domain of work** — never a single fat `x.service.ts` at the module root. `billing/services/` holds `checkout`, `webhook`, `auto-renew`, `card` and a shared `billing-shared` for what several of them need; a single-domain module (`peers`, `platforms`) still gets a `services/` folder with one service inside, for a predictable shape. There is **no facade**: the controller and any cross-module consumer inject the specific domain service they use, and the module `exports` only those that other modules legitimately call. Services collaborate by injecting one another (e.g. `subscription-feed` injects `subscription-peers`, `webhook` injects `card`); shared helpers used by 2+ domains go into a `*-shared` service, not duplicated.

**Nothing but the class lives in a service or controller file.** Constants, lookup tables and pure functions go elsewhere, so the file reads as behaviour rather than a mix of data and logic:

| What                               | Where                                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| Constants, timeouts, lookup tables | `config/<concern>.config.ts`, or `<name>.constants.ts` inside the folder that owns them |
| Pure functions                     | `lib/<name>/` — one folder per **concern**, with `index.ts` and `<name>.types.ts`       |
| Types                              | `x.types.ts` next to the file that owns them                                            |

```ts
// no — a controller file holding data
const PLATFORMS_CACHE_TTL_MS = milliseconds({ days: 1 });

// yes — platforms/config/platforms.config.ts holds it
import { PLATFORMS_CACHE_TTL_MS } from './config';
```

Every module has an `index.ts` — its public API. **Import from the barrel across module boundaries**, never reach into another module's files:

```ts
import { SubscriptionGuard } from '../subscription'; // yes
import { SubscriptionGuard } from '../subscription/guards/subscription.guard'; // no
```

Inside a module, relative paths are fine. The barrel exports only what other modules legitimately need — a controller or a DTO has no business being imported elsewhere. The one deliberate exception is `TelegramNotifyService`, which billing and the scheduler import by file — see [telegram-bot.md](../../architecture/telegram-bot.md).

The better-auth instance lives in `lib/auth/`, not in `modules/auth/`: it is configuration for an external library, and `modules/auth/` only wires it into Nest beside the account endpoints.

DTOs wrap a shared schema:

```ts
export class PlatformDto extends createZodDto(platformSchema) {}
```

The schema itself belongs in [`packages/schemas`](../../../packages/schemas) — the client imports the same one, so both validate against one definition.

## Environment

`config/env.schema.ts` validates on boot and **throws** on a missing variable. That is deliberate: a server that starts without `DATABASE_URL` fails later, in a harder-to-read way.

Node panel API tokens are the exception. The `node` table stores the _name_ of an env var (`apiTokenEnvVar`), never the token; `xrayClientForNode` in `common/lib/node-credentials` resolves it at call time:

```ts
const key = process.env[ref];
```

So credentials stay out of the database. `bun run provision:nodes` writes those lines itself, into **`.env.nodes`** — a separate gitignored file holding `XRAY_KEY_<CC>` and `XRAY_PANEL_<CC>` per node. The server loads it alongside `.env`, which keeps the hand-written file hand-written and the generated secrets out of it.

## Errors

Throw the app exceptions from `common/exceptions` with a code from `@gnomevpn/schemas`:

```ts
throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'node has no reality endpoint');
```

The client matches on the code, so the message is free text but the code is a contract.

## Outbound calls

Every `fetch` carries a timeout — `AbortSignal.timeout(MS)`, not a hand-rolled
`AbortController`. A payment call without one holds the connection indefinitely.
