# CLAUDE.md

Guidance for Claude Code in this repo. Keep it short, link out for details.

## What this is

GnomeVPN — a commercial VPN built on VLESS + XTLS-Reality. Bun-workspaces monorepo.

- **Web client**: Next.js 16 / React 19 (`apps/client/`)
- **Desktop**: Tauri 2 shell (`apps/tauri/`) + a privileged Windows service (`crates/vpn-service/`)
- **API**: NestJS on Bun + Prisma + Postgres, auth via better-auth (`apps/server/`)
- **Tunnel**: Xray-core on the nodes, wintun adapter on Windows
- **Shared types**: Zod schemas in `packages/schemas/` (`@gnomevpn/schemas`)

## Why Reality and not WireGuard

WireGuard's handshake is a fixed 148-byte UDP packet, which DPI matches on sight — in Russia that means the tunnel simply fails for a large share of users. Reality completes a *real* TLS handshake proxied to a genuine third-party site, so traffic on 443/TCP is not distinguishable from ordinary HTTPS. Anything reaching the port without a valid key is forwarded to that site, so an active probe sees its real certificate.

The donor site is the `realityServerName` on each node. It must answer TLS 1.3 over HTTP/2 without redirecting, and it must not be blocked where the node lives.

## Layout

```text
apps/
├── client/          # Next.js — FSD architecture (CLAUDE.md)
├── server/          # NestJS API — modules/, lib/, core/, common/ (CLAUDE.md)
└── tauri/           # Rust shell — src/, capabilities/, tauri.conf.json (CLAUDE.md)
crates/
├── vpn-ipc/         # Wire protocol: types, framing, validation, xray config
└── vpn-service/     # Privileged service: tunnel, routes, DNS (CLAUDE.md)
packages/schemas/    # Zod schemas, imported by client and server
infra/
├── caddy/           # TLS + reverse proxy
└── provision/       # VPN node setup over SSH
```

## The split that shapes everything

**On Windows** the desktop app is two processes:

- `GnomeVPN.exe` — the window. **No administrator rights.**
- `GnomeVPNService` — runs as LocalSystem. Owns wintun, the routing table, DNS, firewall rules.

They talk over a named pipe. This is why the app never shows a UAC prompt, and why every request reaching the service is validated — any local process can open that pipe, and the service can rewrite the system's routes.

**Never move privileged work back into the GUI crate.** It would bring UAC back for every launch.

**On Android there is no such split.** `VpnService` hands the app a TUN descriptor
once the user consents, so the tunnel runs inside `apps/tauri` itself — see
`src/mobile_vpn/`. Only the descriptor differs: xray and `tun2proxy` above it are
the same code, which is why `build_xray_config` lives in `vpn-ipc` rather than in
the service.

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

- **`route delete 0.0.0.0`** wipes the physical default route and kills the user's internet. The tunnel uses half-routes (`0.0.0.0/1` + `128.0.0.0/1`) instead.
- **A running service holds its own binary.** `cargo build` then silently keeps the old file — `scripts/build-service.mjs` checks for this.
- **Health checks must probe an authenticated endpoint.** An unauthenticated 200 only proves something is listening, not that the tunnel subsystem works.
- **Xray reports traffic counters, not handshakes.** A peer counts as alive only when its byte count *grows*; treating "has traffic" as "active now" means stale peers are never collected.
- **Tauri plugins need an entry in `capabilities/`** or the call fails silently in the webview. Desktop-only and mobile-only permissions live in separate files — listing `updater` or `autostart` in the shared one breaks the Android build.
- **`env(safe-area-inset-*)` is empty in the Android webview.** The values come from `tauri-plugin-safe-area-insets-css`, which `MobileInsets` writes into `--safe-area-inset-*`; the CSS variables fall back to `env()` for the browser.
