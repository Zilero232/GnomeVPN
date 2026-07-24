# CLAUDE.md — apps/server

Guidance for the API. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**NestJS on Bun** + Prisma 7 + Postgres. Bun runs the TypeScript directly — no build step.

## Layout

```text
src/
├── modules/         # one folder per domain
│   ├── auth/        # better-auth module wiring
│   ├── billing/     # YooKassa checkout and webhooks — config/ guards/ lib/
│   ├── configs/     # downloadable Hysteria2 configs (hy2:// links) — config/ dto/ lib/
│   ├── health/      # /health — also probes the database
│   ├── nodes/       # public node list with health status — config/ lib/
│   ├── peers/       # xray clients shared by sessions and configs — config/ lib/
│   ├── release/     # desktop release + updater manifest, proxied from GitHub — config/ lib/
│   ├── scheduler/   # cron jobs — config/ jobs/
│   ├── sessions/    # live tunnels, one slot per device — config/ dto/
│   └── subscription/# guards/
├── lib/             # external integrations: auth, xray, yookassa
├── core/            # Prisma service
├── common/          # exceptions, filters, decorators
└── config/          # env schema (Zod)
```

## Module convention

A module is `x.module.ts` + `x.controller.ts` + `services/`, plus `dto/`, `guards/`, `lib/`, `config/` as needed. Controllers stay thin: validate, delegate, return. Business logic lives in `services/`.

**Business logic lives in `services/<domain>.service.ts`, one service per domain of work** — never a single fat `x.service.ts` at the module root. `billing/services/` holds `checkout`, `webhook`, `auto-renew`, `card` and a shared `billing-shared` for what several of them need; a single-domain module (`nodes`, `peers`) still gets a `services/` folder with one service inside, for a predictable shape. There is **no facade**: the controller and any cross-module consumer inject the specific domain service they use, and the module `exports` only those that other modules legitimately call. Services collaborate by injecting one another (e.g. `session-connect` injects `session-access` for `releaseAll`); shared helpers used by 2+ domains go into a `*-shared` service, not duplicated.

**Nothing but the class lives in a service or controller file.** Constants, lookup tables and pure functions go elsewhere, so the file reads as behaviour rather than a mix of data and logic:

| What | Where |
| --- | --- |
| Constants, timeouts, lookup tables | `config/x.config.ts` |
| Pure functions | `lib/<name>/` — one folder per function, with its own `index.ts` and `<name>.types.ts` |
| Types | `x.types.ts` next to the file that owns them |

`lib/` is never a pile of loose files: each helper gets a folder, so its types
sit beside it and the barrel re-exports both.

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

Node panel passwords are the exception. The `node` table stores the *name* of an env var (`apiTokenEnvVar`), never the password:

```ts
const key = process.env[node.apiTokenEnvVar];
```

So credentials stay out of the database. `bun provision` writes those lines itself, into **`.env.nodes`** — a separate gitignored file holding `XRAY_KEY_<CC>` and `XRAY_PANEL_<CC>` per node. The server loads it alongside `.env`, which keeps the hand-written file hand-written and the generated secrets out of it.

## Errors

Throw the app exceptions from `common/exceptions` with a code from `@gnomevpn/schemas`:

```ts
throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'xray node unreachable');
```

The client matches on the code, so the message is free text but the code is a contract.

## Billing

Prices live in `PLANS` ([`packages/schemas`](../../packages/schemas)), not in the environment: the server charges from that list and the landing page renders from it, so an advertised price cannot drift from a billed one.

Two flags decide what auto-renewal does, and they are not the same thing:

- **`YOOKASSA_RECURRING`** — whether the shop *can* charge recurrently at all. YooKassa enables this per shop by hand, on request to support; there is no dashboard toggle. Until they do, `save_payment_method` and `POST /v3/payment_methods` both answer `forbidden`, so checkout fails outright. It defaults to `false`.
- **`subscription.cancelAtPeriodEnd`** — whether *this user* wants renewal. Theirs to flip.

Renewal also needs a card on file (`savedCardId`). Without one the job has nothing to charge, so `resumeAutoRenew` refuses rather than promising a renewal that never happens — the client offers `bindCard` instead.

Webhooks are the only thing that activates a subscription; the browser returning to `YOOKASSA_RETURN_URL` proves nothing. `handleWebhook` never trusts the request body either — it re-reads the payment or payment method from the API, because a webhook is just JSON somebody posted. It answers `200` even when it does nothing: any other status makes YooKassa retry for a day.

## Three modules, one xray client

`peers` owns everything that talks to the node's panel — creating a client,
releasing it, building the tunnel config. `sessions` and `configs` sit on top and
never touch `XrayClient` directly, which is why the same "create → persist →
roll back on failure" dance is written once instead of twice.

## Session slots

A subscription covers `SESSION_LIMIT` (2) live tunnels at once, so a phone and a
desktop can both stay connected. The client sends a `deviceId` it generates once
and keeps in `plugin-store`; that id becomes the peer's `name`, which makes the
xray client email unique per device (`app-<userId>-<deviceId>`).

Reconnecting from a known device reuses its slot. A third device evicts the least
recently used one rather than being refused — `freeSlot` orders by
`lastActiveAt` and frees space *before* the new client is created.

Order matters: `createClient` deletes any client with the same email first,
because the panel rejects duplicates. Releasing the old peer *after* creating the
new one would delete the client that was just handed out — that bug cost a
"NODE_UNAVAILABLE" that had nothing to do with the node being down.

**Disconnecting deletes the row first and releases the panel client afterwards.**
`release()` is an HTTP call to the node, so waiting for it means a slow or
unreachable panel holds up the response — and the device counter in the UI keeps
showing a session the user just closed. `releaseAll` removes the rows, then fires
the panel calls detached; a leaked client is collected by `peer-gc` anyway, while
a stuck disconnect is visible immediately.

## Cron jobs

`modules/scheduler` runs four: node health, peer garbage collection, expired access, recurring charges.

Use a raw cron string when the interval has no `CronExpression` constant. Inventing one that doesn't exist crashes the server at boot, and only at boot — nothing catches it earlier.

## Provisioning nodes

`bun provision` reads `apps/server/nodes.json` (gitignored — it holds root SSH passwords) and sets each host up over SSH: install Docker, ship the 3x-ui compose stack, open 443/udp, configure the panel, generate the TLS cert, register the node.

The node runs a **Hysteria2 inbound** (`protocol: hysteria`, `version: 2`) built in `scripts/lib/hysteria-inbound`, served by the 3x-ui panel — no separate hysteria process. It listens on **443/UDP** (QUIC), so `openTunnelPort` opens udp, not tcp. `ensureCert` generates a self-signed EC cert inside the container (`/etc/gnomevpn/{cert,key}.pem`); clients accept it with `insecure: true`.

Each client has its own `auth` password, generated in `XrayClient.createClient` and stored as the peer's tunnel credential (in the `xrayUserId` column, reused as-is). `ensureInbound` **updates** an existing inbound rather than replacing it, and `updateInbound` preserves the current client list so a re-provision does not strand live sessions.

The masquerade target is `MASQUERADE_HOST` in `scripts/lib/hysteria-inbound` — the SNI the tunnel disguises itself as, and the CN of the self-signed cert. Unlike REALITY it is not a real reverse-proxy donor, so it does not need to answer anything; it only has to look like a plausible HTTPS host.

**Verify a node end-to-end, never by "the panel returned 200".** A Hysteria2 client written without its full field set is stored by the panel but dropped from the running core (`clients: null`), and every connection then fails auth with a 404. The only trustworthy check is to run a real hysteria client against the node and confirm a request returns the node's own IP — ideally from the target network, since the whole reason for Hysteria2 is a TSPU that treats UDP/QUIC differently from TCP.

## Prisma

Schema is split across `prisma/schema/`. The generated client lands in `generated/` and is gitignored, so `prisma generate` must run before typecheck — CI does this explicitly.

**There is no migration history yet** (development used `db push`). Deployment needs one — see [DEPLOY.md](../../DEPLOY.md).

## Verification

```bash
bunx tsc --noEmit
bun run dev            # env validation only fires at boot
curl localhost:4000/health
```
