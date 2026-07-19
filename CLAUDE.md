# CLAUDE.md

Guidance for Claude Code in this repo. Keep it short, link out for details.

## What this is

GnomeVPN — a commercial WireGuard VPN. Bun-workspaces monorepo.

- **Web client**: Next.js 16 / React 19 (`apps/client/`)
- **Desktop**: Tauri 2 shell (`apps/tauri/`) + a privileged Windows service (`crates/vpn-service/`)
- **API**: NestJS on Bun + Prisma + Postgres, auth via better-auth (`apps/server/`)
- **Tunnel**: boringtun (userspace WireGuard), wintun adapter on Windows
- **Shared types**: Zod schemas in `packages/schemas/` (`@gnomevpn/schemas`)

## Layout

```text
apps/
├── client/          # Next.js — FSD architecture (CLAUDE.md)
├── server/          # NestJS API — modules/, lib/, core/, common/ (CLAUDE.md)
└── tauri/           # Rust shell — src/, capabilities/, tauri.conf.json (CLAUDE.md)
crates/
├── vpn-ipc/         # Wire protocol: types, framing, validation
└── vpn-service/     # Privileged service: tunnel, routes, kill switch (CLAUDE.md)
packages/schemas/    # Zod schemas, imported by client and server
infra/
├── caddy/           # TLS + reverse proxy
└── provision/       # VPN node setup over SSH
```

## The split that shapes everything

The desktop app is two processes:

- `GnomeVPN.exe` — the window. **No administrator rights.**
- `GnomeVPNService` — runs as LocalSystem. Owns wintun, the routing table, DNS, firewall rules.

They talk over a named pipe. This is why the app never shows a UAC prompt, and why every request reaching the service is validated — any local process can open that pipe, and the service can rewrite the system's routes.

**Never move privileged work back into the GUI crate.** It would bring UAC back for every launch.

## Per-app guidance

- **[apps/client/CLAUDE.md](apps/client/CLAUDE.md)** — FSD layers, public-API rules, i18n, `shared/ui`
- **[apps/server/CLAUDE.md](apps/server/CLAUDE.md)** — module convention, error handling, Prisma, wg-easy
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

- No comments unless the *why* is genuinely non-obvious — and then in English
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
- **wg-easy's `/api/release` answers 200 without auth.** Health checks must probe an authenticated endpoint or a broken node looks online.
- **Docker compose interpolates `$` inside `.env`.** A bcrypt hash must be written with `$$`.
- **Tauri plugins need an entry in `capabilities/`** or the call fails silently in the webview.
