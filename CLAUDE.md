# CLAUDE.md

Guidance for Claude Code in this repo. Keep it short, link out for details.

## What this is

GnomeVPN — a commercial VPN built on Hysteria2 (QUIC/UDP). Bun-workspaces monorepo.

- **Web client**: Next.js 16 / React 19 (`apps/client/`)
- **Desktop**: Tauri 2 shell (`apps/tauri/`) + a privileged service on all three OSes (`crates/vpn-service/`)
- **API**: NestJS on Bun + Prisma + Postgres, auth via better-auth (`apps/server/`)
- **Tunnel**: Hysteria2 on the nodes (served by the 3x-ui panel); sing-box owns the TUN adapter on the desktop
- **Shared types**: Zod schemas in `packages/schemas/` (`@gnomevpn/schemas`)

## Why Hysteria2 and not Reality

The project ran on VLESS + XTLS-Reality first. Measured on a Russian ISP in this
repo's history: the TSPU actively fingerprints the REALITY handshake over _any_
TCP port and kills the connection within minutes of real traffic — fresh ports
work, "burnt" ports don't, and switching donor or transport doesn't help. UDP is
not policed the same way (plain WireGuard on UDP/51820 passes on the same
network), so the tunnel moved to Hysteria2: QUIC over UDP, which the TSPU lets
through where it drops REALITY.

Hysteria2 masquerades as an HTTP/3 site (`masquerade: proxy` to `MASQUERADE_HOST`)
and needs a TLS cert on the node — a self-signed cert generated per node, which
clients accept because they run with `insecure: true`. Each client has its own
`auth` password; that password is the tunnel credential, stored per peer.

## Layout

```text
apps/
├── client/          # Next.js — FSD architecture (CLAUDE.md)
├── server/          # NestJS API — modules/, lib/, core/, common/ (CLAUDE.md)
└── tauri/           # Rust shell — src/, capabilities/, tauri.conf.json (CLAUDE.md)
crates/
├── vpn-ipc/         # Wire protocol: types, framing, validation, tunnel configs
└── vpn-service/     # Privileged service: tunnel, routes, DNS (CLAUDE.md)
packages/
├── schemas/         # Zod schemas, imported by client and server
└── scripts/         # shared script layer: reporter, ssh, shell
scripts/
└── provision/       # VPN node setup over SSH — the only local pipeline left
.github/workflows/
├── release.yml      # v* tag → checks → desktop matrix + android → publish
└── deploy.yml       # manual → images to ghcr → pull on the VPS
infra/
├── caddy/           # TLS + reverse proxy
└── xray/            # the 3x-ui compose stack shipped to every node
```

**Releases and deploys are workflows, not local commands.** Building for a
platform means building on it — Tauri cannot meaningfully cross-compile and
macOS cannot be built off a Mac — so the matrix is not a convenience, it is the
only way to ship all four targets. `tauri-action` owns the desktop bundles and
the merged `latest.json`; nothing in this repo hand-rolls an updater manifest.

Provisioning stays local because it talks to nodes over SSH with credentials
that live in `.env.nodes`, and because it is run by a human deciding to add a
node — not by a commit.

What the provision scripts share lives in `@gnomevpn/scripts`, never copied
between them: `reporter` (the `[scope] message` output), `ssh` (one `SshClient`)
and `shell` (build remote commands — `arg()` quotes untrusted values, `quiet()`
keeps stdout while `silent()` drops it).

`nodes.json` and `.env.nodes` sit at the repo root — both gitignored, both
holding secrets; `nodes.example.json` is the committed template.

## The split that shapes everything

**On every desktop OS** the app is two processes:

- `GnomeVPN` — the window. **No administrator rights.**
- `gnomevpn-service` — runs privileged. Spawns `sing-box`, which owns the TUN adapter, the routing table and DNS.

Only the transport under them differs. Windows registers `GnomeVPNService` with
the SCM and talks over a named pipe; macOS and Linux run the same binary as a
launchd daemon / systemd unit and talk over a Unix socket at
`/var/run/gnomevpn/service.sock`. Everything above the socket — the framing, the
request types, the supervisor, the retry loop, the sing-box config — is one
implementation shared by all three.

This is why the app never raises an elevation prompt on launch, and why every
request reaching the service is validated: any local process can open that
socket, and the service can rewrite the system's routes. The pipe is guarded by
an SDDL on Windows and by a peer-uid check (`SO_PEERCRED` / `getpeereid`, via
`UnixStream::peer_cred`) on Unix — the two are the same defence, spelled in each
platform's own vocabulary.

**Never move privileged work back into the GUI crate.** It would bring the
elevation prompt back to every launch.

**On Android the split is by process, not by privilege.** `GnomeVpnService` runs
in `:tunnel` (`android:process`), opens the TUN descriptor _and_ runs the engine
on it — `src/mobile_vpn/` spawns `hysteria` under `tun2proxy` from inside that
process. The descriptor never crosses back to the UI, which is what lets the
tunnel survive the user swiping the app away. `build_hysteria_config` lives in
`vpn-ipc` for that path; every desktop OS uses `build_singbox_config` from the
same crate.

## Per-app guidance

- **[apps/client/CLAUDE.md](apps/client/CLAUDE.md)** — FSD layers, public-API rules, i18n, `shared/ui`
- **[apps/server/CLAUDE.md](apps/server/CLAUDE.md)** — module convention, error handling, Prisma, node provisioning
- **[apps/tauri/CLAUDE.md](apps/tauri/CLAUDE.md)** — Tauri commands, capabilities, service client
- **[crates/vpn-service/CLAUDE.md](crates/vpn-service/CLAUDE.md)** — tunnel engine, routing, security boundary

## Shared versions live in the catalog

A dependency used by more than one workspace is pinned once, in the
`workspaces.catalog` block of the root `package.json`, and referenced as
`"remeda": "catalog:"` from each package that needs it. That is what keeps the
client and the server from drifting apart — `remeda` was already shipping as two
copies (`2.17` and `2.39`) before the catalog existed.

Bumping a shared version means editing the catalog, not the packages. Adding a
new shared dependency means adding it to the catalog **and** pointing each
consumer at `catalog:`.

The Rust side works the same way: `[workspace.dependencies]` in the root
`Cargo.toml` owns the version of anything two crates share (`serde`, `tokio`,
`thiserror`, …), and each crate writes `serde.workspace = true`. Per-crate
feature flags still go on the crate — features are additive, so
`tokio = { workspace = true, features = ["fs"] }` is the normal shape.

## Reuse over reinvention

Before writing a helper by hand, check whether an installed library already covers it.

1. Generic React hooks → **`@siberiacancode/reactuse`** (`useLocalStorage`, `useClickOutside`, …)
2. Array / object manipulation → **`remeda`**
3. Typed branching → **`ts-pattern`** (`match`, `.with`, `.exhaustive`)
4. Dates and durations → **`date-fns`**
5. Byte sizes → **`pretty-bytes`**
6. Animation → **`motion`**, presets in a sibling `<Component>.motion.ts`
7. Retries with backoff → **`p-retry`** (TypeScript), **`backon`** (Rust)
8. Named pipes → **`interprocess`** (Rust). No hand-rolled `unsafe`.

The repo has no `unsafe` blocks. Keep it that way.

## Style

- **No comments.** The code is expected to read on its own.
- **Two or more parameters → one object.** `connect({ nodeId, country })`, never
  `connect(nodeId, country)`. The shape lives in a sibling `*.types.ts` as
  `<Fn>Input`, so a call site never has to guess argument order.
- No tests in this repo (removed deliberately); verify by building and running
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
  grouped on purpose — `log.step(...)` belongs directly above the `await` it
  announces. No blank line _inside_ a tight group of related assignments, and
  never two blank lines in a row.

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
bun run verify            # everything below, in one command
```

That is the whole set — typecheck (all three TS packages), ESLint, Prettier,
Stylelint, `cargo fmt --check` and `cargo clippy -D warnings`. `bun run fix`
is its counterpart: every autofixer in the same order.

The individual scripts (`typecheck`, `lint`, `format:check`, `lint:css`,
`format:rust:check`, `lint:rust`) still exist when you want one of them alone.

**Nothing in CI checks an ordinary commit.** There is no workflow watching master
or pull requests — the only automated run is the `checks` job in `release.yml`,
which gates a `v*` tag. So this command is the first check and the last one:
a broken commit reaches master silently and surfaces at release time.

`verify` needs a Rust toolchain (`rustup toolchain install`, pinned by
`rust-toolchain.toml`). Without it `cargo fmt` and `cargo clippy` cannot run and
the command stops at that step — the TypeScript half having already passed.

## Things that have already bitten us

- **Per-app split cannot be done from user space.** Redirecting a connection by the process that opened it needs a kernel callout at `FWPM_LAYER_ALE_BIND_REDIRECT`, and that needs an EV-signed driver. WFP `Block`/`Permit`, dropping packets on the TUN, rewriting `IfIdx` and NAT on the physical interface were all tried against a live tunnel and all broke connectivity. sing-box solves it by never redirecting: it pulls everything into the TUN and opens the outgoing connection itself.
- **`route delete 0.0.0.0`** wipes the physical default route and kills the user's internet. Half-routes (`0.0.0.0/1` + `128.0.0.0/1`) are what sing-box installs instead, and nothing in this repo should touch the routing table by hand.
- **A running service holds its own binary.** `cargo build` then silently keeps the old file — `scripts/build-service.mjs` checks for this.
- **Health checks must probe an authenticated endpoint.** An unauthenticated 200 only proves something is listening, not that the tunnel subsystem works.
- **A Hysteria2 client needs its full field set.** Writing `{email, auth}` alone leaves the panel storing the client but generating `clients: null` in the running core, so every connection fails auth with a 404. `enable/limitIp/totalGB/expiryTime/tgId/reset` must all be present — see `PanelClient.addClient`. 3x-ui v3.6.0 fixed a neighbouring bug (an inbound whose clients are _all_ filtered out now serialises as `[]` rather than `null`) but explicitly left this one open, so the full set is still required.
- **The panel reports traffic counters, not handshakes.** A peer counts as alive only when its byte count _grows_; treating "has traffic" as "active now" means stale peers are never collected.
- **Tauri plugins need an entry in `capabilities/`** or the call fails silently in the webview. Desktop-only and mobile-only permissions live in separate files — listing `updater` or `autostart` in the shared one breaks the Android build.
- **`env(safe-area-inset-*)` is empty in the Android webview.** The values come from `tauri-plugin-safe-area-insets-css`, which `MobileInsets` writes into `--safe-area-inset-*`; the CSS variables fall back to `env()` for the browser.
