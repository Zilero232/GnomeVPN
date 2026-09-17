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
│   ├── nodes/       # node list with health status (auth-gated) — config/ lib/
│   ├── peers/       # xray clients the subscription issues — config/ lib/
│   ├── platforms/   # the INCY download links, cached — config/ dto/ services/
│   ├── scheduler/   # cron jobs — config/ jobs/
│   ├── sessions/    # live tunnels, one slot per device — config/ dto/
│   ├── subscription/# plan status and the access guard — guards/
│   └── subscription-link/  # the INCY feed and its token — config/ dto/ lib/
├── lib/             # external integrations: auth, xray, yookassa
├── core/            # Prisma service
├── common/          # exceptions, filters, decorators
└── config/          # env schema (Zod)
```

## Module convention

A module is `x.module.ts` + `x.controller.ts` + `services/`, plus `dto/`, `guards/`, `lib/`, `config/` as needed. Controllers stay thin: validate, delegate, return. Business logic lives in `services/`.

**Business logic lives in `services/<domain>.service.ts`, one service per domain of work** — never a single fat `x.service.ts` at the module root. `billing/services/` holds `checkout`, `webhook`, `auto-renew`, `card` and a shared `billing-shared` for what several of them need; a single-domain module (`nodes`, `peers`) still gets a `services/` folder with one service inside, for a predictable shape. There is **no facade**: the controller and any cross-module consumer inject the specific domain service they use, and the module `exports` only those that other modules legitimately call. Services collaborate by injecting one another (e.g. `session-connect` injects `session-access` for `releaseAll`); shared helpers used by 2+ domains go into a `*-shared` service, not duplicated.

**Nothing but the class lives in a service or controller file.** Constants, lookup tables and pure functions go elsewhere, so the file reads as behaviour rather than a mix of data and logic:

| What                               | Where                                                                             |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| Constants, timeouts, lookup tables | `config/x.config.ts`, or `<name>.constants.ts` inside the folder that owns them   |
| Pure functions                     | `lib/<name>/` — one folder per **concern**, with `index.ts` and `<name>.types.ts` |
| Types                              | `x.types.ts` next to the file that owns them                                      |

**A folder is one concern, not one function.** Each gets its own `index.ts`,
`<name>.types.ts` and `<name>.constants.ts` where it needs them, so a reader
opens `vless/` and finds every VLESS thing and nothing else.

The unit is the concern because the alternative was tried: `lib/xray` once held
seven folders and fifteen files for a handful of lines — `strip-cidr-mask/` was a
single regex behind its own barrel, `generate-auth/` a single `randomBytes` call.
Reaching either meant `lib/xray/lib/<name>/<name>.ts`, three levels of
indirection to arrive at one statement. A helper too small to have its own types
belongs in the `<name>.helpers.ts` of the concern that uses it.

```ts
// no — a service file holding data
const CACHE_TTL_MS = 10 * 60_000;
const EXTENSION_TO_PLATFORM = { exe: 'windows' };

// yes
import { CACHE_TTL_MS, EXTENSION_TO_PLATFORM } from './config';
```

Every module has an `index.ts` — its public API. **Import from the barrel across module boundaries**, never reach into another module's files:

```ts
import { SubscriptionGuard } from '../subscription'; // yes
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

Node panel passwords are the exception. The `node` table stores the _name_ of an env var (`apiTokenEnvVar`), never the password:

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

- **`YOOKASSA_RECURRING`** — whether the shop _can_ charge recurrently at all. YooKassa enables this per shop by hand, on request to support; there is no dashboard toggle. Until they do, `save_payment_method` and `POST /v3/payment_methods` both answer `forbidden`, so checkout fails outright. It defaults to `false`.
- **`subscription.cancelAtPeriodEnd`** — whether _this user_ wants renewal. Theirs to flip.

Renewal also needs a card on file (`savedCardId`). Without one the job has nothing to charge, so `resumeAutoRenew` refuses rather than promising a renewal that never happens — the client offers `bindCard` instead.

Webhooks are the only thing that activates a subscription; the browser returning to `YOOKASSA_RETURN_URL` proves nothing. `handleWebhook` never trusts the request body either — it re-reads the payment or payment method from the API, because a webhook is just JSON somebody posted. It answers `200` even when it does nothing: any other status makes YooKassa retry for a day.

**Re-enabling access happens outside the claiming transaction, so it must be recoverable.** `settlePayment` claims the payment row and grants the subscription atomically, then calls `setEnabledAll` — a separate write that can fail, or never run at all if the process dies right after the commit. That used to leave a paying user with every peer `disabled` and nothing in the system able to turn them back on: `expired-access` only ever revoked. The sweep now runs a third pass over `disabled` config peers whose owner has a live period (`activeSince`) and re-enables them, so the post-commit call is an optimisation and the job is the guarantee. Do not make `setEnabledAll` the only path back.

## Three modules, one xray client

`peers` owns everything that talks to the node's panel — creating a client,
releasing it, building the tunnel config. `sessions` and `subscription-link` sit on top and
never touch `XrayClient` directly, which is why the same "create → persist →
roll back on failure" dance is written once instead of twice.

`XrayClient` itself is a **facade over four concerns**, each its own folder:

```text
lib/xray/
├── panel-client/   # the 3x-ui HTTP API, and nothing above it
├── inbounds/       # find/create an inbound, shape its payload — used by both protocols
├── hysteria/       # Hysteria2 clients: create, delete, enable
├── vless/          # VLESS + Reality clients, in their own inbound
└── xray.ts         # the facade the rest of the server calls
```

The name is historical and misleads: `XrayClient` talks to the **3x-ui panel**,
not to Xray-core. The panel runs the core; Hysteria2 is an inbound inside it,
which is why a fix released for the standalone `apernet/hysteria` server does not
reach these nodes.

It was one 300-line class holding every protocol, and that is how a restart bug
hid in it: each inbound needs the core restarted after its own kind of change,
and with the paths interleaved one was easy to miss. Splitting by protocol makes
each rule visible where it applies.

Both protocols are ordinary panel clients, so one `deleteClient` removes either.
`peerClientNames` still derives the pre-protocol name alongside the current one,
so a peer written before the protocol became part of the key can still be found
on its node.

**Every write path parses settings strictly.** `readSettings` returns `null` on
malformed JSON and the caller refuses to rewrite; `parseJson` returns `{}` and is
for reads only. Mixing them up is what once erased a node's clients: a tolerant
parse produced an empty settings object, which was then written back over the
real one. `ensureInbound` and `write` both use the strict parser now.

## The subscription feed

`subscription-link/` is how the VPN actually reaches a user. Three routes:

| Route                            | Auth     | Purpose                                             |
| -------------------------------- | -------- | --------------------------------------------------- |
| `GET /subscription-link`         | session  | the user's URL plus its `incy://crypt1/…` deep link |
| `POST /subscription-link/rotate` | session  | mint a new token; the old URL dies immediately      |
| `GET /sub/:token`                | **none** | what the INCY app fetches                           |

**The token is the credential.** INCY cannot log in, so the URL is all the
authentication there is: 32 random bytes, `base64url`, one row per user. That is
why rotation exists, and why the route sits on `/sub` rather than
`/subscription` — `/subscription/status` already lives there, and a token whose
value happened to be `status` would have shadowed it.

`SubscriptionFeedService.build` ensures one `kind: 'config'` peer named `incy`
per **node and protocol**, reusing `PeersService.issueAndPersist`, then renders
each as a `hy2://` or `vless://` URI. **A node that fails to issue is logged and
skipped** — one unreachable node must not empty the user's whole server list.

`protocolsFor` decides what a node advertises. Hysteria2 always; VLESS only when
the node carries `realityPublicKey` and `realityShortId`, which provisioning
writes. A node provisioned before Reality existed keeps serving Hysteria2 alone
rather than advertising a server the client can never reach.

**A Reality client is a UUID, not a password**, and needs `flow` alongside the
rest of the mandatory field set — `PanelClient.addVlessClient` writes all of it
for the same reason `addClient` does.

**`ensureVlessInbound` refuses to rewrite an inbound whose clients it cannot
read**, exactly like `updateInbound`. A re-provision that overwrote the client
list from the template would wipe every subscriber on that node.

`SubscriptionPeersService` owns the peer rows; `SubscriptionFeedService` owns
the response. Splitting them keeps the transaction and the retry out of the
path that only renders URIs.

`lib/` under the module is split the same way, one folder per concern:

```text
lib/
├── client-platform/   # what the User-Agent says the caller is
├── incy-headers/      # the response headers, with header-value/ and userinfo/
├── incy-uri/          # the server list, with hysteria2/ and vless/ beside it
├── server-name/       # the flag-and-country label both protocols share
└── subscription-token/
```

The two URI builders were one file once, which hid that they share nothing but
the server label — and that label is what keeps `🇳🇱 Netherlands` apart from
`🇳🇱 Netherlands · TCP` in the app's list.

**A self-signed node is pinned, not trusted blindly.** `hysteria2Uri` emits
`pinSHA256` from the node's `certFingerprint`; `insecure=1` survives only as the
fallback for a node provisioned before the fingerprint was captured. A current
xray core refuses to start at all on `allowInsecure`, so a node without a
fingerprint is a node nobody can reach over Hysteria2 — reprovision it.

`clientEnabledByEmail` must list **every** protocol the subscription issues.
It once listed Hysteria2 and WireGuard, and when WireGuard was removed a VLESS
client looked to `reconcile-peers` like a peer that had vanished from its node.

## Platform downloads

`GET /platforms` is the INCY download list: anonymous, because the landing page
renders it before anyone signs up, and cached for a day through
`CacheInterceptor` because it is a constant rather than a query.

The URLs point at `releases/latest`, so they follow INCY's current release
without a redeploy. Only a renamed artifact forces a change here.

**Every non-ASCII header value must be `base64:<…>`.** HTTP headers cannot carry
UTF-8: a raw Cyrillic `profile-title` or `announce` does not merely render wrong,
it breaks the response. `incyHeaderValue` decides per value.

`subscription-userinfo` carries the expiry as a Unix timestamp in seconds. When
there is no period to report it must be the literal `0`, which tells the app to
hide the traffic block entirely rather than render zeros.

The format is documented at https://incy.gitbook.io/docs/docs-en — the pages
that matter are `subscription-format` (headers, body) and `share-links`
(the exact `hy2://` query parameters).

## Session slots

A subscription covers `DEFAULT_DEVICE_LIMIT` (2) live tunnels at once. The web
client sends a `deviceId` it generates once and keeps in `localStorage`; that id
becomes the peer's `name`, which makes the xray client email unique per device
(`app-<userId>-<deviceId>`).

**Live tunnels and subscription peers are counted separately.** `deviceLimit`
bounds `kind: 'session'` peers, `configLimit` bounds `kind: 'config'` ones — the
peers the INCY subscription issues, one per node — and `resolveLimits` derives
both from the same purchased `extraDevices`. The two never compete for the same
budget.

Reconnecting from a known device reuses its slot. A third device evicts an idle
one rather than being refused — `freeSlot` orders by `createdAt` and frees space
_before_ the new client is created. Only peers the node reports as **not** online
are eligible; if every slot is genuinely in use it throws
`DEVICE_LIMIT_REACHED` instead of cutting someone off.

**Liveness comes from the Xray core.** `onlineEmails()` reads
`/panel/api/clients/onlines` — the sessions the core itself proxies. A node that
does not answer leaves every peer _unknown_, not _idle_, and `onlinePeerIds`
folds that into `assumeOnlineWhenNodeSilent`: left `true`, an unknown peer holds
its slot rather than being evicted on no evidence.

**The client email is scoped by protocol, and it has to be.** The database is
unique on `(userId, kind, name, nodeId, protocol)` — five fields — while the
email was built from four. One user issuing two protocols under the same name on
the same node therefore produced two rows and one email, and
`clientEnabledByEmail` merges every protocol into a single map keyed on it: one
client overwrote the other, and `syncEnabled` then disabled a live config against
the wrong client's state.

**Disconnecting deletes the row first and releases the panel client afterwards.**
`release()` is an HTTP call to the node, so waiting for it means a slow or
unreachable panel holds up the response — and the device counter in the UI keeps
showing a session the user just closed. `releaseAll` removes the rows, then fires
the panel calls detached; a leaked client is collected by `peer-gc` anyway, while
a stuck disconnect is visible immediately.

## Cron jobs

`modules/scheduler` runs four: node health, peer garbage collection, expired access, recurring charges.

`expired-access` sweeps in both directions — it revokes sessions and subscription peers whose subscription lapsed (`lapsedBefore`), and restores peers left `disabled` while the subscription is live (`activeSince`). The two predicates are complements and are tested as such; a gap between them either strands a paying user or keeps serving an expired one. `kind: 'config'` peers get `CONFIG_GRACE_HOURS` before revocation, sessions do not.

Use a raw cron string when the interval has no `CronExpression` constant. Inventing one that doesn't exist crashes the server at boot, and only at boot — nothing catches it earlier.

## Provisioning nodes

`bun provision` reads `nodes.json` from the repo root (gitignored — it holds root SSH passwords; `nodes.example.json` next to it is the committed template) and sets each host up over SSH: install Docker, ship the 3x-ui compose stack, open 443/udp, configure the panel, generate the TLS cert, register the node.

The script is staged: `prepareHost` (docker, firewall, port hopping, compose) → `startPanel` (configure, wait for the api) → `installInbounds` (cert, Hysteria2, Reality) → `registerNode` (env secrets, database row). Remote commands are composed through `@gnomevpn/scripts/shell` rather than written as strings — `arg()` quotes anything untrusted, and `quiet()`/`silent()` are distinct on purpose: `quiet` hides stderr but keeps stdout, which is what reading a remote key needs.

The node runs a **Hysteria2 inbound** (`protocol: hysteria`, `version: 2`) built in `scripts/provision/hysteria-inbound`, served by the 3x-ui panel — no separate hysteria process. It listens on **443/UDP** (QUIC), so `openTunnelPort` opens udp, not tcp. `ensureCert` generates a self-signed EC cert inside the container (`/etc/gnomevpn/{cert,key}.pem`); clients accept it with `insecure: true`.

Each client has its own `auth` password, generated in `XrayClient.createClient` and stored as the peer's tunnel credential (in the `xrayUserId` column, reused as-is). `ensureInbound` **updates** an existing inbound rather than replacing it, and `updateInbound` preserves the current client list so a re-provision does not strand live sessions.

**Adding a client goes through `POST /panel/api/clients/add`, never a rewrite of
the inbound.** The old path read the whole client array, appended to it and wrote
it back, which races with itself — two connects at once and the first client is
lost. The panel's endpoint takes one client and owns that read-modify-write
itself.

The `auth` is still generated here rather than left to the panel: it mints one
when the field is omitted, but it does not return it, and the credential has to
be known to be handed to the device.

**The explicit `restartCore()` afterwards is load-bearing.** The panel only calls
`SetToNeedRestart()`, which sets a flag — nothing acts on it on its own, and
`CheckXrayRunningJob` restarts on a crash, not on that flag. `updateInbound`
behaves identically, which is why the old path called `restartCore()` too. Drop
it and the client sits in the database while the running core has never heard of
it, so the very first connection fails auth with a 404.

The masquerade target is `MASQUERADE_HOST` in `scripts/provision/hysteria-inbound` — the SNI the tunnel disguises itself as, and the CN of the self-signed cert. Unlike REALITY it is not a real reverse-proxy donor, so it does not need to answer anything; it only has to look like a plausible HTTPS host.

**Verify a node end-to-end, never by "the panel returned 200".** A Hysteria2 client written without its full field set is stored by the panel but dropped from the running core (`clients: null`), and every connection then fails auth with a 404. The only trustworthy check is to run a real hysteria client against the node and confirm a request returns the node's own IP — ideally from the target network, since the whole reason for Hysteria2 is a TSPU that treats UDP/QUIC differently from TCP.

## Prisma

Schema is split across `prisma/schema/`. The generated client lands in `generated/` and is gitignored, so `prisma generate` must run before typecheck — CI does this explicitly.

**There is no migration history yet** (development used `db push`). Deployment needs one — see [DEPLOY.md](../../DEPLOY.md).

Both Prisma clients (`PrismaService` for the API, `basePrisma` for better-auth)
build their pool through `core/pg-pool.ts` — one place, with a `pool.on('error')`
listener (pg _requires_ one, or a dropped idle connection crashes the process)
and `maxLifetimeSeconds: 300`. A pooled connection left open for hours eventually
gets reset by the network in between, and the next query on it throws
`Connection terminated unexpectedly` — which surfaced from the scheduler jobs
that reuse connections every minute. Capping the lifetime recycles connections
before they age into that window; verified with `pg_backend_pid()` changing after
the lifetime elapses. Idle-drop was ruled out first — a held connection survived
60s idle through the Docker Desktop port-proxy, so the cause was age, not idleness.

## Verification

```bash
bunx tsc --noEmit
bun run dev            # env validation only fires at boot
curl localhost:4000/health
```
