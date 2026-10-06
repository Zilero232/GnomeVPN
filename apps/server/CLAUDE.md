# CLAUDE.md — apps/server

Guidance for the API. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**NestJS on Bun** + Prisma 7 + Postgres. Bun runs the TypeScript directly — no build step.

## Layout

```text
src/
├── modules/         # one folder per domain
│   ├── auth/        # better-auth wiring, the account (deletion) — services/
│   ├── billing/     # YooKassa checkout and webhooks — config/ dto/ guards/ lib/ services/
│   ├── devices/     # the device registry and the account's device limit — config/ dto/ lib/ services/
│   ├── health/      # /health — also probes the database
│   ├── peers/       # xray clients the subscription issues — config/ lib/ services/
│   ├── platforms/   # the INCY download links, cached — config/ dto/ services/
│   ├── scheduler/   # the seven cron jobs — config/ jobs/ lib/
│   ├── subscription/# plan status, the trial and the access guard — dto/ guards/ lib/ services/
│   ├── subscription-link/  # the INCY feed and its token — config/ dto/ lib/ services/
│   └── telegram/    # the bot — a second door to the same account
├── lib/             # external integrations: auth, email, xray, yookassa
├── core/            # Prisma (service, base client, pg pool), logger, serializable retry
├── common/          # exceptions, filters, decorators, shared lib (node credentials, period…)
└── config/          # env schema (Zod), config service, CORS
```

## Where to read more

| Topic                                                                | Doc                                                                                    |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Module shape, services, barrels, DTOs, environment, errors, timeouts | [docs/guides/server/nestjs.md](../../docs/guides/server/nestjs.md)                     |
| Prisma, the pg pool, strict parsing on write, revocation and restore | [docs/guides/server/data.md](../../docs/guides/server/data.md)                         |
| The subscription feed: routes, token, headers, URIs, announce        | [docs/architecture/subscription-feed.md](../../docs/architecture/subscription-feed.md) |
| `XrayClient`, the 3x-ui panel, device limits, liveness, releasing    | [docs/architecture/nodes-and-peers.md](../../docs/architecture/nodes-and-peers.md)     |
| Billing, renewal, pending payments, the trial, deleting an account   | [docs/architecture/billing.md](../../docs/architecture/billing.md)                     |
| The cron jobs                                                        | [docs/architecture/scheduler.md](../../docs/architecture/scheduler.md)                 |
| The Telegram bot                                                     | [docs/architecture/telegram-bot.md](../../docs/architecture/telegram-bot.md)           |
| Provisioning nodes                                                   | [docs/architecture/provisioning.md](../../docs/architecture/provisioning.md)           |
| Logging and redaction                                                | [docs/architecture/logging.md](../../docs/architecture/logging.md)                     |

## Conventions that bite

- **One service per domain of work** in `services/<domain>.service.ts`, never a fat `x.service.ts`; no facade — a consumer injects the specific service it uses. Controllers validate, delegate, return.
- **Nothing but the class in a service or controller file.** Constants go to `config/`, pure functions to `lib/<concern>/`, types to `x.types.ts`.
- **Import another module through its barrel**, never into its files. The one deliberate exception is the Telegram notify import from billing and the scheduler — see [telegram-bot.md](../../docs/architecture/telegram-bot.md).
- **DTOs wrap a schema from `@gnomevpn/schemas`** (`createZodDto(platformSchema)`), so the client validates against the same one.
- **Errors** are the app exceptions from `common/exceptions` with a code from `@gnomevpn/schemas`; the code is a contract, the message is free text.
- **`config/env.schema.ts` throws on boot** on a missing variable. Node panel API tokens are the exception: the `node` table stores the env var's _name_ (`apiTokenEnvVar`), and the values live in `.env.nodes`, written by `bun run provision:nodes`.
- **Every outbound `fetch` carries `AbortSignal.timeout(MS)`.**
- **`XrayClient` talks to the 3x-ui panel, not to Xray-core**: a client change needs an explicit `restartCore()`, batched once per pass.
- **A revocation needs a restore in the same sweep**, and every write path parses settings strictly.
- **Use a raw cron string when the interval has no `CronExpression` constant** — an invented one crashes the server at boot.

## Verification

```bash
bun --filter @gnomevpn/server typecheck
bun run dev:server     # env validation only fires at boot
curl localhost:4000/health
```
