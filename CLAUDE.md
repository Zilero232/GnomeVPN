# CLAUDE.md

Guidance for Claude Code in this repo. Keep it short, link out for details.

## What this is

GnomeVPN — a commercial VPN built on Hysteria2 (QUIC/UDP). Bun-workspaces monorepo.

- **Web client**: Next.js 16 / React 19, server-rendered (`apps/client/`)
- **API**: NestJS on Bun + Prisma + Postgres, auth via better-auth (`apps/server/`)
- **Tunnel**: Hysteria2 (QUIC/UDP) and VLESS + Reality (TCP) on the nodes, both
  served by the 3x-ui panel
- **VPN client**: [INCY](https://incy.cc/) — a third-party app the user installs; we
  ship a subscription link, not a binary
- **Shared types**: Zod schemas in `packages/schemas/` (`@gnomevpn/schemas`)

## Why Hysteria2 leads

The project ran on VLESS + XTLS-Reality first. Measured on a Russian ISP in this
repo's history: the TSPU actively fingerprints the REALITY handshake over _any_
TCP port and kills the connection within minutes of real traffic — fresh ports
work, "burnt" ports don't, and switching donor or transport doesn't help. UDP is
not policed the same way (plain WireGuard on UDP/51820 passes on the same
network), so the tunnel moved to Hysteria2: QUIC over UDP, which the TSPU lets
through where it drops REALITY.

Hysteria2 masquerades as an HTTP/3 site (`masquerade: proxy` to `MASQUERADE_HOST`)
and needs a TLS cert on the node — a self-signed cert generated per node. The
subscription pins its SHA-256 as `pinSHA256`, read off the node at provisioning
and stored as `certFingerprint`. **`insecure=1` is not an option any more**: newer
xray cores reject the parameter outright with `The feature "allowInsecure" has
been removed`, and the tunnel refuses to start. Pinning is also stricter than
what it replaces — it names one certificate rather than accepting any.

Each client has its own `auth` password; that password is the tunnel credential,
stored per peer.

The Reality inbound is different on both counts: it borrows a real site's
certificate rather than presenting its own, so its entries are never marked
insecure, and its credential is a UUID rather than a password.

## Two protocols, one subscription

Hysteria2 is the default: QUIC holds up under packet loss where TCP collapses,
which is what makes it good on mobile. But QUIC is UDP, and some networks —
corporate Wi-Fi, a few carriers, most hotels — drop UDP wholesale. There the
tunnel cannot come up at all.

VLESS + Reality is the way out: TCP on 443, wearing the TLS handshake of a real
third-party site. The two share port 443 without conflict because one is UDP and
the other TCP.

Both ride in the same subscription. The user sees `🇳🇱 Netherlands` and
`🇳🇱 Netherlands · TCP` and picks whichever connects; nothing has to be
configured.

**This repo has measured REALITY failing before.** The TSPU fingerprinted the
handshake over any TCP port and killed sessions within minutes — that is why the
project left it in the first place. It is here as a fallback for blocked UDP, not
as a claim that it survives active probing. If it turns out dead again, the
Hysteria2 entry is still first in the list.

A node only advertises VLESS when `realityPublicKey` and `realityShortId` are
set, which happens at provisioning. A node provisioned before this existed keeps
serving Hysteria2 alone rather than advertising a server the client cannot reach.

## Why INCY and not our own client

The repo used to carry a Tauri desktop shell, a privileged Rust service on three
operating systems and an Android tunnel — around 2,500 files of platform code.
All of it is gone. The client is now INCY, a free third-party app that exists on
iOS, Android, Windows, Linux, Android TV and Apple TV.

We give it one URL. It fetches a base64 list of `hy2://` URIs, reads the traffic
counters and the renewal date out of the response headers, and renders our name,
our support link and our servers. Nothing about the tunnel changed — the nodes,
the panel and the peer model are the same.

What this bought: iOS and TV, which we never had and could not have shipped
cheaply. What it cost: the client is not ours, and the user installs an app with
someone else's name. The site says so plainly rather than hiding it — see the
`about` and `faq` namespaces in the locales.

The subscription URL is a standard format, so it also works in Hiddify, v2rayNG,
Streisand and the rest. That is deliberate: a user who dislikes INCY is not stuck.

## Layout

```text
apps/
├── client/          # Next.js — FSD architecture (CLAUDE.md)
└── server/          # NestJS API — modules/, lib/, core/, common/ (CLAUDE.md)
packages/
├── schemas/         # Zod schemas, imported by client and server
└── scripts/         # shared script layer: reporter, ssh, shell
scripts/
└── provision/       # VPN node setup over SSH — the only local pipeline left
.github/workflows/
├── checks.yml       # push/PR → typecheck, lint, tests, prerender
└── deploy.yml       # manual → images to ghcr → pull on the VPS
infra/
└── caddy/           # TLS + reverse proxy, bind-mounted on the VPS
```

**Deploys are a workflow, not a local command.** There are no binaries to build
or sign any more: `deploy.yml` pushes two images to ghcr and the VPS pulls them.

Provisioning stays local because it talks to nodes over SSH with credentials
that live in `.env.nodes`, and because it is run by a human deciding to add a
node — not by a commit.

What the provision scripts share lives in `@gnomevpn/scripts`, never copied
between them: `reporter` (the `[scope] message` output), `ssh` (one `SshClient`)
and `shell` (build remote commands — `arg()` quotes untrusted values, `quiet()`
keeps stdout while `silent()` drops it).

`nodes.json` and `.env.nodes` sit at the repo root — both gitignored, both
holding secrets; `nodes.example.json` is the committed template.

## The subscription is the product surface

`apps/server/src/modules/subscription-link/` is the whole delivery path:

- `GET /subscription-link` and `POST /subscription-link/rotate` — authenticated,
  hand the user their URL and its `incy://crypt1/…` deep link.
- `GET /sub/:token` — **unauthenticated**, this is what INCY fetches. The token
  is the credential: 32 random bytes, one row per user, rotatable.

It lives on `/sub` and not `/subscription` because `/subscription/status` already
exists — a token named `status` would have shadowed it.

Each request ensures one `kind: 'config'` peer named `incy` per available node,
reusing `PeersService.issueAndPersist`, and renders them as `hy2://` URIs. A node
that fails to issue is logged and skipped: one dead node must not empty the
user's server list.

**Headers carry everything the app displays.** `subscription-userinfo` holds the
expiry, `profile-title` the name, `profile-web-page-url` the account link. Any
non-ASCII value must be sent as `base64:<…>` — HTTP headers cannot carry UTF-8,
and a raw Cyrillic title silently breaks the whole response. `headerValue`
decides that per value, so nothing has to remember it at the call site.

`subscription-userinfo: 0` is not "no traffic used" — it tells the app to hide
the traffic block entirely, which is what a user without a period should see.

`@incy/link-encoder` builds the deep link. Its AES key ships inside every INCY
client, so the encryption hides the URL from scanners, not from people.

**`hide-url: 1` is set, and it costs the account-page button.** It keeps the
token out of INCY's Share/Copy/QR, which is the point; the same flag also
suppresses whatever `profile-web-page-url` would render, so the button that
opens the account page does nothing while it is on. The header stays because
not handing a user a one-tap way to forward their own credential is worth more
than the link. Do not "fix" the dead button by dropping the flag.

**Any client that takes a subscription link works, not only INCY.** The feed is a
standard base64 list, so Hiddify, v2rayNG, Streisand, NekoBox and Clash Meta read
it unchanged. `CLIENT_REGISTRY` in `packages/schemas/src/clients/` is the single
source: download URL, platforms, and an import scheme where one is **documented**
— `hiddify://import/<url>` takes the URL raw in the path, `v2rayng://install-sub`
and `clash://install-config` take it percent-encoded in a query. Streisand and
NekoBox publish no scheme, so they carry `importUrl: null` and the user pastes by
hand; inventing a scheme yields a button that opens nothing.

The server renders those into `clients` on `GET /subscription-link`. The client
only draws them — it holds icons and copy, never a URL.

**An import scheme only resolves on a touch device.** `hiddify://` and `clash://`
are registered by the mobile apps, so a desktop browser does nothing with them
and the button looks broken. `OtherAppsList` gates the import link behind
`(pointer: coarse)` and falls back to copying the URL — width is the wrong test,
because a tablet at any width resolves the scheme and a narrow desktop window
does not.

**`pinSHA256` is 64 lowercase hex characters, and `openssl` does not print it
that way.** `openssl x509 -fingerprint -sha256` returns `AA:BB:CC:…` — uppercase,
colon-separated — and that is what `certFingerprint` holds, because provisioning
stores the command's output verbatim. A core compares the pin as a string, so the
colons alone make every match fail; 3x-ui shipped the same bug by sending base64.
`pinnedFingerprint` normalises on read rather than in the column, so nodes
provisioned before this keep working without a re-provision, and a value that is
not a sha-256 falls back to the `insecure` flag instead of pinning something no
client can match.

**sing-box does not implement `pinSHA256` at all**, so Hiddify ignores it and then
refuses the node's self-signed certificate. A pinned entry therefore connects in
INCY and fails in Hiddify — the fix for that is a certificate Hiddify already
trusts, not a wider `insecure`.

**A builder that cannot produce a URI returns `null`, never `''`.** `vlessUri`
returned an empty string for a node without reality keys, and `serverUris`
filters on `isNonNullish` — so the empty string survived into the feed and a
client parsing the list hit a blank entry.

The docs are at https://incy.gitbook.io/docs/docs-en — `subscription-format`
and `share-links` are the two pages that matter.

## What the workflows assume

**`checks.yml`** — runs on pushes to master, on pull requests and on a `v*` tag.
Typecheck, lint, tests, then a client build. The build is last because it is the
only thing that catches a page which typechecks but throws during prerender.

A tag additionally asserts that it matches the root `package.json` version.

**`deploy.yml`** — manual only, images to ghcr then a pull on the VPS.
Migrations run **before** `docker compose up -d`: doing it after means the new
build serves traffic against the old schema and can query a column its migration
has not added yet. `up -d` returns when the container starts, not when the app
answers, so the deploy waits on the compose healthchecks for both `server` and
`web`.

`docker-compose.yml` and `infra/caddy/Caddyfile` are copied to the VPS on every
deploy and land flat next to each other — the compose file bind-mounts
`./Caddyfile`, so a nested path would mount a directory.

Both files pin every action to a commit SHA rather than a tag — a tag can be
moved, and these jobs hold production SSH. `DATABASE_URL`/`DIRECT_URL` are set to
placeholders because the server postinstall runs `prisma generate`, which
resolves `DIRECT_URL` through `env()` but never connects.

## Indexed pages are a set, not a page

A public page is only indexed when it is in `INDEXED_ROUTES` (`shared/constants/routes.ts`).
That one list drives the sitemap, `robots.txt` and the `llms.txt` page list, so a
page added to the app and not to the list is invisible to every crawler and to
the site's own footer.

Adding an indexed page means five places, not one: the route in `ROUTES`, an
entry in `INDEXED_ROUTES` and `PUBLIC_ROUTES`, `FOOTER_NAV` (internal links are
what stop it being an orphan), `LLMS_PAGES`, and a `meta.title`/`meta.description`
pair in **both** locales. `bun run test` catches the missing translation — a
`servers.rows.label` left as `''` failed the messages suite — and
`bun --filter @gnomevpn/client build` catches the rest.

The structured data is one graph in `shared/seo/json-ld`: `Organization`,
`WebSite` and `SoftwareApplication` ship on every page, `Product` only on
pricing, `FAQPage` on the FAQ and `HowTo` on `/setup`. `siteJsonLd`'s test
asserts the graph's exact node list, so adding a node means updating it there
too — deliberately, because a silently growing graph is how duplicate entities
reach a crawler.

## Per-app guidance

- **[apps/client/CLAUDE.md](apps/client/CLAUDE.md)** — FSD layers, public-API rules, i18n, `ui-kit`
- **[apps/server/CLAUDE.md](apps/server/CLAUDE.md)** — module convention, error handling, Prisma, node provisioning

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

## Reuse over reinvention

Before writing a helper by hand, check whether an installed library already covers it.

1. Generic React hooks → **`@siberiacancode/reactuse`** (`useLocalStorage`, `useClickOutside`, …)
2. Array / object manipulation → **`remeda`**
3. Typed branching → **`ts-pattern`** (`match`, `.with`, `.exhaustive`)
4. Dates and durations → **`date-fns`**
5. Animation → **`motion`**, presets in `shared/lib/motion`
6. Retries with backoff → **`p-retry`**
7. Unstyled primitives → **`@base-ui/react`** — every `ui-kit` molecule wraps one
8. Server-side logs → **`pino`** via `shared/lib/server-logger`

## Style

- **No comments.** The code is expected to read on its own.
- **Two or more parameters → one object.** `connect({ nodeId, country })`, never
  `connect(nodeId, country)`. The shape lives in a sibling `*.types.ts` as
  `<Fn>Input`, so a call site never has to guess argument order.
- Tests cover pure logic only — Vitest in `_tests/` folders beside the source,
  Playwright for public routes. Anything that needs a database, a node over SSH
  or a live tunnel is verified by building and running, not by a mock.
- Everything user-visible goes through i18n, both `en.json` and `ru.json`
- Import order: types → builtin/external → internal (`@/`) → relative → styles →
  side-effects. `perfectionist/sort-imports` enforces it; `bun lint:fix` sorts.
- **Let the code breathe — group statements, don't write a wall.** A function
  body reads as paragraphs, not one block. Prettier only preserves blank lines
  and never inserts them, so `padding-line-between-statements` does it instead
  and `bun lint:fix` applies it. Blank line between: the `const`/`let` setup
  block and the logic that acts on it; before every
  `return`/`throw`/`continue`/`break`; around every block (`if`, `for`, `try`,
  `switch`) and every **multiline** call. Consecutive one-line statements stay
  grouped on purpose. No blank line _inside_ a tight group of related
  assignments, and never two blank lines in a row.

  ```ts
  // no — monolithic
  const url = new URL(`hy2://${config.server}`);
  url.username = config.auth;
  url.pathname = '/';
  return url.toString();

  // yes — setup, then the block that mutates it, then the result
  const url = new URL(`hy2://${config.server}`);

  url.username = config.auth;
  url.pathname = '/';

  return url.toString();
  ```

## Verification

Run before claiming anything works:

```bash
bun run verify            # typecheck, ESLint, Prettier, Stylelint
bun run test              # Vitest, every workspace in one run
bun --filter @gnomevpn/client build   # the only check that catches SSR breakage
```

`bun run fix` is verify's counterpart: every autofixer in the same order.

**`bun run test`, never `bun test`.** Bare `bun test` is Bun's own runner, which
claims the name before the script does — it collects the same files, then fails
them all on `vi.setSystemTime is not a function`, because it is not Vitest.

Vitest is wired as projects: `packages/schemas`, `packages/scripts`,
`apps/server` and `apps/client` each own a `vitest.config.ts`, and the root one
lists them. A test lives in a `_tests/` folder next to what it tests.

`checks.yml` runs all of the above on every push and pull request. It is the
only automation that looks at a commit, so a red local run is a red CI run.

## Things that have already bitten us

- **A Hysteria2 client needs its full field set.** Writing `{email, auth}` alone leaves the panel storing the client but generating `clients: null` in the running core, so every connection fails auth with a 404. `enable/limitIp/totalGB/expiryTime/tgId/reset` must all be present — see `PanelClient.addClient`. 3x-ui fixed a neighbouring bug in v3.6.0 (an inbound whose clients are _all_ filtered out now serialises as `[]` rather than `null`) but explicitly left this one open — nothing up to v3.8.5 changes it, so the full set is still required.
- **Xray-core cannot close a live session, so the panel restarts the core to end one.** Its API has `AddUser` and `RemoveUser` and nothing that disconnects anybody, so `restartXrayOnClientDisable` is how 3x-ui makes a revoked client stop working — and that restart drops every tunnel on the node. Provisioning turns the setting off: a revoked client keeps the session it already has and simply cannot open a new one, which is what `reconcile-peers` already assumes. Leaving it on is what made the tunnel drop roughly once a minute.
- **The panel reports traffic counters, not handshakes.** A peer counts as alive only when its byte count _grows_; treating "has traffic" as "active now" means stale peers are never collected.
- **A state a job can only enter is a state nothing can leave.** `expired-access` disabled configs and only the payment webhook re-enabled them, so a webhook that failed after its transaction committed stranded a paying user permanently. Any revocation needs a matching restore in the same sweep — `SubscriptionAccessService` is both halves.
- **A count of hours is not a calendar duration.** `intervalToDuration` splits an interval into months **and** days, so `days * 24 + hours` silently dropped a whole month: a 31-day tunnel rendered as `72:00:00`. Compute elapsed time from the millisecond difference.
- **Tolerant parsing on a write path erases data.** `readSettings` returns `null` on malformed JSON so the caller can refuse; a forgiving parse turned unreadable settings into `{}` and overwrote a node's real client list once already.
- **A peer's client name must carry its protocol.** The email the panel stores is unique per `(user, kind, name, node, protocol)`; leaving the protocol out made a WireGuard peer collide with a Hysteria2 one and reconcile disabled live configs.
- **`next/root-params` needs the root layout inside the dynamic segment.** With an
  outer `app/layout.tsx` present, `next typegen` reports "No root params detected"
  and every `rootParams.locale()` import fails to resolve. The locale layout must
  be the only root layout.
- **next-intl falls back to a default environment without an explicit `timeZone`.**
  Static generation then logs `ENVIRONMENT_FALLBACK` for every page that formats a
  date. Both `getRequestConfig` and `NextIntlClientProvider` pass `TIME_ZONE`.
