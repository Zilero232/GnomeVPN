<p align="center">
  <img src="apps/client/public/brand/logo-mark.svg" width="88" height="88" alt="GnomeVPN" />
</p>

<h1 align="center">GnomeVPN</h1>

<p align="center">
  <strong>A tunnel in one tap — no logs, no ads, no config files.</strong><br/>
  Next.js client · Tauri desktop & Android · NestJS API · Self-hosted nodes
</p>

<p align="center">
  <img src="https://img.shields.io/badge/runtime-Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=000" alt="Bun" />
  <img src="https://img.shields.io/badge/protocol-Hysteria2-35f0a0?style=for-the-badge&logoColor=fff" alt="Hysteria2" />
  <img src="https://img.shields.io/badge/desktop-Tauri%202-24c8db?style=for-the-badge&logo=tauri&logoColor=fff" alt="Tauri" />
  <img src="https://img.shields.io/badge/mobile-Android-3ddc84?style=for-the-badge&logo=android&logoColor=fff" alt="Android" />
</p>

<br/>

## Why this exists

Most VPN protocols announce themselves. WireGuard's handshake is a fixed-size UDP
packet; OpenVPN has a recognisable header. Where traffic is inspected, that is
enough to drop the connection.

GnomeVPN runs on **Hysteria2** — QUIC over UDP, masquerading as an HTTP/3 site.
The choice was measured, not assumed: this repository first shipped VLESS +
XTLS-Reality, and Russian DPI equipment fingerprinted the REALITY handshake over
_any_ TCP port, killing sessions within minutes of real traffic. Plain WireGuard
on UDP/51820 passed on the same network. UDP is policed differently, so the
tunnel moved.

<table>
<tr>
<td width="33%" valign="top">

**No UAC prompts**

A LocalSystem service owns the privileged work. The window you see runs without
administrator rights and never triggers a prompt.

</td>
<td width="33%" valign="top">

**Per-app split tunneling**

Pick the applications that go through the VPN. Everything else takes the direct
route — no kernel driver, no certificate.

</td>
<td width="33%" valign="top">

**Yours to host**

Docker Compose, Caddy, PostgreSQL, and one command that provisions a new country
over SSH.

</td>
</tr>
</table>

<br/>

## Features

<table>
<tr>
<td width="50%" valign="top">

**Hysteria2 tunnel** — QUIC on 443/UDP, masqueraded as HTTP/3

**Split tunneling** — per-application rules, Windows

**Auto-reconnect** — exponential backoff after a dropped link

**LAN stays reachable** — printers and NAS keep working

</td>
<td width="50%" valign="top">

**Two devices, one subscription** — phone and desktop at once

**Live device sync** — connect on one, the other updates instantly over SSE

**Node health** — unreachable countries are greyed out, not offered

**Signed updates** — proxied through the API, verified on the client

</td>
</tr>
</table>

<br/>

## How the tunnel is built

Two platforms, two shapes — because the operating systems disagree about who may
own a network interface.

**Windows.** Creating an adapter and editing routes needs administrator rights,
so that work lives in a service. The service spawns `sing-box`, which owns the
adapter, the routing table and the Hysteria2 connection:

```text
┌──────────────┐   named pipe    ┌─────────────────────┐
│ GnomeVPN.exe │ ──────────────► │ GnomeVPNService     │
│ (no rights)  │ ◄────────────── │ (LocalSystem)       │
│ UI, tray     │     events      │ spawns sing-box.exe │
└──────────────┘                 └──────────┬──────────┘
                                            │ Hysteria2 · 443/UDP
                                            ▼
                                   ┌────────────────┐
                                   │ VPN node (VPS) │
                                   │ 3x-ui panel    │
                                   └────────────────┘
```

Any local process can open that pipe, and the service can rewrite the system
routing table — so every request crossing it is validated before it is acted on.

**Android.** `VpnService` hands the app a TUN descriptor once the user consents,
so there is nothing to elevate: the tunnel runs inside the app process, with
`hysteria` under `tun2proxy`.

### Split tunneling, and why it took a rewrite

Routing by _destination_ is ordinary work — a route table does it. Routing by
_process_ is not: Windows will not let user space redirect a connection based on
who opened it. That needs a callout driver at `FWPM_LAYER_ALE_BIND_REDIRECT`,
which needs an EV certificate.

Four user-space approaches were built and tested against a live tunnel — WFP
`Block`/`Permit` filters, dropping packets on the TUN, rewriting the interface
index, NAT on the physical adapter. All four broke connectivity, each for its own
reason.

sing-box solves it by never redirecting at all: it pulls every packet into the
TUN and opens the outgoing connection itself, so the choice between `proxy` and
`direct` is a plain userspace decision made per connection.

```jsonc
"route": {
  "rules": [
    { "process_path": ["…/chrome.exe"], "outbound": "proxy" }
  ],
  "final": "direct"
}
```

<br/>

## Stack

| Layer        | Choice                                         |
| ------------ | ---------------------------------------------- |
| Web client   | Next.js 16, React 19, Feature-Sliced Design    |
| Desktop      | Tauri 2, Rust, wintun                          |
| Mobile       | Tauri 2 on Android, `VpnService` + `tun2proxy` |
| Tunnel core  | sing-box (Windows), hysteria (Android)         |
| API          | NestJS on Bun, Prisma 7, better-auth           |
| Realtime     | Server-Sent Events                             |
| Database     | PostgreSQL                                     |
| Shared types | Zod schemas in `packages/schemas`              |
| Payments     | YooKassa                                       |
| Delivery     | Docker, Caddy, GitHub Actions                  |

<br/>

## Layout

```text
apps/
├── client/          # Next.js — landing, account area, app UI
├── server/          # NestJS API — modules/, lib/, core/, common/
└── tauri/           # Desktop shell + Android tunnel
crates/
├── vpn-ipc/         # Wire protocol and tunnel configs
└── vpn-service/     # Privileged Windows service
packages/schemas/    # Zod schemas (@gnomevpn/schemas)
infra/
├── caddy/           # TLS, reverse proxy
└── provision/       # VPN node setup over SSH
```

Each app carries its own `CLAUDE.md` with the conventions that bite — layer
rules for the client, module shape for the server, the security boundary for the
service.

<br/>

## Getting started

**Requirements** — Bun 1.3+, Rust stable, Docker, PostgreSQL.

```bash
bun install
bun run setup        # .env from the example, database up, schema pushed

bun run dev          # client + API
bun run tauri:dev    # desktop app
bun run android:dev  # android, needs a device or emulator
```

`bun run setup` is idempotent — it never overwrites an existing `.env`, and it
stops rather than dropping data if the local database disagrees with the schema.
The steps it wraps are still available on their own:

```bash
cp .env.example .env                      # one env for the whole monorepo
bun run dev:infra                         # database, waits until it is healthy
bun --filter @gnomevpn/server db:push
```

The desktop app needs `wintun.dll` and `sing-box.exe` next to the service — both
are fetched by hand, see [apps/tauri/bin/README.md](apps/tauri/bin/README.md).

<br/>

## VPN nodes

Adding a country is one command. It installs Docker, brings up the 3x-ui panel
with a Hysteria2 inbound, generates a self-signed certificate, opens 443/UDP and
registers the node:

```bash
bun run provision:nodes
```

The node list lives in `nodes.json` at the repo root — gitignored, since it holds
root SSH passwords. Copy `nodes.example.json` to start. Provisioning runs by hand
from a machine that can reach the nodes; it is not part of CI.

Verify a new node by running a real client against it, never by "the panel
returned 200" — a Hysteria2 client written without its full field set is stored
by the panel but dropped from the running core, and every connection then fails
auth with a 404.

<br/>

## Deployment

Push to `master` runs the checks, then builds images and ships them to the VPS.
Bumping the version in `package.json` cuts a desktop release.

Full walkthrough — domain, secrets, `.env`, first launch — in
**[DEPLOY.md](DEPLOY.md)**.

<br/>

## Scripts

| Command                   | What it does                                 |
| ------------------------- | -------------------------------------------- |
| `bun run setup`           | first run: env, database, schema             |
| `bun run dev`             | client + API in watch mode                   |
| `bun run dev:infra`       | database only, waits until healthy           |
| `bun run tauri:dev`       | desktop app                                  |
| `bun run android:dev`     | Android app                                  |
| `bun run verify`          | every check below, in one command            |
| `bun run fix`             | every autofixer, in one command              |
| `bun run typecheck`       | types across all packages                    |
| `bun lint`                | ESLint                                       |
| `bun run format`          | Prettier                                     |
| `bun run lint:css`        | Stylelint                                    |
| `bun run lint:rust`       | clippy across the Rust workspace             |
| `bun run tauri:build`     | installers                                   |
| `bun run android:build`   | APK / AAB                                    |
| `bun run release`         | build, sign & publish desktop + Android      |
| `bun run deploy:web`      | build images, push to ghcr, deploy web + API |
| `bun run provision:nodes` | set up VPN nodes                             |

Rust is checked with `cargo clippy --workspace` and `cargo fmt --all --check`.
There is no CI — run the checks locally before every commit.

<br/>

## Status

Working: tunnel on Windows and Android, split tunneling, subscriptions, device
sync, node health, autostart, auto-updates.

**Windows and Android only.** macOS and Linux would each need their own
privileged helper — the tunnel is not portable, the UI already is.

Not there yet: split tunneling on Android (the platform exposes
`addAllowedApplication`, it is simply not wired up), IPv6 inside the tunnel,
multi-hop.
