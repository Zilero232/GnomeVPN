# CLAUDE.md

Guidance for Claude Code in this repo. Keep it short, link out for details.

## What this is

GnomeVPN — a commercial VPN built on Hysteria2 (QUIC/UDP). Bun-workspaces monorepo.

- **Web client**: Next.js 16 / React 19 (`apps/client/`)
- **Desktop**: Tauri 2 shell (`apps/tauri/`) + a privileged Windows service (`crates/vpn-service/`)
- **API**: NestJS on Bun + Prisma + Postgres, auth via better-auth (`apps/server/`)
- **Tunnel**: Hysteria2 on the nodes (served by the 3x-ui panel), wintun adapter on Windows
- **Shared types**: Zod schemas in `packages/schemas/` (`@gnomevpn/schemas`)

## Why Hysteria2 and not Reality

The project ran on VLESS + XTLS-Reality first. Measured on a Russian ISP in this
repo's history: the TSPU actively fingerprints the REALITY handshake over *any*
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
packages/schemas/    # Zod schemas, imported by client and server
infra/
├── caddy/           # TLS + reverse proxy
└── provision/       # VPN node setup over SSH
```

## The split that shapes everything

**On Windows** the desktop app is two processes:

- `GnomeVPN.exe` — the window. **No administrator rights.**
- `GnomeVPNService` — runs as LocalSystem. Spawns `sing-box.exe`, which owns wintun, the routing table and DNS.

They talk over a named pipe. This is why the app never shows a UAC prompt, and why every request reaching the service is validated — any local process can open that pipe, and the service can rewrite the system's routes.

**Never move privileged work back into the GUI crate.** It would bring UAC back for every launch.

**On Android there is no such split.** `VpnService` hands the app a TUN descriptor
once the user consents, so the tunnel runs inside `apps/tauri` itself — see
`src/mobile_vpn/`, which spawns `hysteria` under `tun2proxy` because a separate
process cannot own a descriptor granted to the app. `build_hysteria_config` lives
in `vpn-ipc` for that path; Windows uses `build_singbox_config` from the same
crate.

## Per-app guidance

- **[apps/client/CLAUDE.md](apps/client/CLAUDE.md)** — FSD layers, public-API rules, i18n, `shared/ui`
- **[apps/server/CLAUDE.md](apps/server/CLAUDE.md)** — module convention, error handling, Prisma, node provisioning
- **[apps/tauri/CLAUDE.md](apps/tauri/CLAUDE.md)** — Tauri commands, capabilities, service client
- **[crates/vpn-service/CLAUDE.md](crates/vpn-service/CLAUDE.md)** — tunnel engine, routing, security boundary

## Reuse over reinvention

Before writing a helper by hand, check whether an installed library already covers it.

1. Generic React hooks → **`@siberiacancode/reactuse`** (`useLocalStorage`, `useClickOutside`, …)
2. Array / object manipulation → **`remeda`**
3. Typed branching → **`ts-pattern`** (`match`, `.with`, `.exhaustive`)
4. Dates and durations → **`date-fns`**
5. Byte sizes → **`pretty-bytes`**
6. Retries with backoff → **`backon`** (Rust)
7. Named pipes → **`interprocess`** (Rust). No hand-rolled `unsafe`.

The repo has no `unsafe` blocks. Keep it that way.

## Style

- **No comments.** The code is expected to read on its own.
- **Two or more parameters → one object.** `connect({ nodeId, country })`, never
  `connect(nodeId, country)`. The shape lives in a sibling `*.types.ts` as
  `<Fn>Input`, so a call site never has to guess argument order.
- No tests in this repo (removed deliberately); verify by building and running
- Everything user-visible goes through i18n, both `en.json` and `ru.json`
- Import order: node → external → workspace → `@/` → relative → types last

## Verification

Run before claiming anything works:

```bash
bun run typecheck         # all three TS packages
bun lint                  # Biome
bunx stylelint "apps/client/**/*.scss"
cargo clippy --workspace  # Rust
cargo fmt --all --check
```

CI runs the same set — see `.github/workflows/check-code.yml`.

## Things that have already bitten us

- **Per-app split cannot be done from user space.** Redirecting a connection by the process that opened it needs a kernel callout at `FWPM_LAYER_ALE_BIND_REDIRECT`, and that needs an EV-signed driver. WFP `Block`/`Permit`, dropping packets on the TUN, rewriting `IfIdx` and NAT on the physical interface were all tried against a live tunnel and all broke connectivity. sing-box solves it by never redirecting: it pulls everything into the TUN and opens the outgoing connection itself.
- **`route delete 0.0.0.0`** wipes the physical default route and kills the user's internet. Half-routes (`0.0.0.0/1` + `128.0.0.0/1`) are what sing-box installs instead, and nothing in this repo should touch the routing table by hand.
- **A running service holds its own binary.** `cargo build` then silently keeps the old file — `scripts/build-service.mjs` checks for this.
- **Health checks must probe an authenticated endpoint.** An unauthenticated 200 only proves something is listening, not that the tunnel subsystem works.
- **A Hysteria2 client needs its full field set.** Writing `{email, auth}` alone leaves the panel storing the client but generating `clients: null` in the running core, so every connection fails auth with a 404. `enable/limitIp/totalGB/expiryTime/tgId/reset` must all be present — see `XrayClient.newClient`.
- **The panel reports traffic counters, not handshakes.** A peer counts as alive only when its byte count *grows*; treating "has traffic" as "active now" means stale peers are never collected.
- **Tauri plugins need an entry in `capabilities/`** or the call fails silently in the webview. Desktop-only and mobile-only permissions live in separate files — listing `updater` or `autostart` in the shared one breaks the Android build.
- **`env(safe-area-inset-*)` is empty in the Android webview.** The values come from `tauri-plugin-safe-area-insets-css`, which `MobileInsets` writes into `--safe-area-inset-*`; the CSS variables fall back to `env()` for the browser.
