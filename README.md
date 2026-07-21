<p align="center">
  <img src="apps/client/public/brand/logo-mark.svg" width="88" height="88" alt="GnomeVPN" />
</p>

<h1 align="center">GnomeVPN</h1>

<p align="center">
  <strong>A tunnel in one tap — no logs, no ads, no provider account.</strong><br/>
  Next.js client · Tauri desktop shell · NestJS API · Self-hosted nodes
</p>

<p align="center">
  <img src="https://img.shields.io/badge/runtime-Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=000" alt="Bun" />
  <img src="https://img.shields.io/badge/protocol-VLESS%20%2B%20Reality-35f0a0?style=for-the-badge&logoColor=fff" alt="VLESS + Reality" />
  <img src="https://img.shields.io/badge/desktop-Tauri%202-24c8db?style=for-the-badge&logo=tauri&logoColor=fff" alt="Tauri" />
  <img src="https://img.shields.io/badge/status-in%20development-f59e0b?style=for-the-badge" alt="Status" />
</p>

<br/>

## What is GnomeVPN?

A commercial VPN service built on **VLESS + XTLS-Reality**. Subscribe, pick a country, press connect — the app raises the tunnel locally and credentials are issued per session.

Reality completes a genuine TLS handshake proxied to a real third-party site, so the traffic on 443/TCP looks like ordinary HTTPS rather than a VPN. That matters where WireGuard's fixed-size UDP handshake is fingerprinted and dropped.

<table>
<tr>
<td width="33%" valign="top">

**No UAC prompts**

A Windows service owns the privileged work, so the app itself launches without administrator rights.

</td>
<td width="33%" valign="top">

**Nothing to configure**

No config files to import. Sign in, choose a node, connect.

</td>
<td width="33%" valign="top">

**Yours to host**

Docker Compose, Caddy, PostgreSQL and a provisioning script for the VPN nodes.

</td>
</tr>
</table>

<br/>

## Features

<table>
<tr>
<td>

**Reality tunnel** — indistinguishable from HTTPS on 443/TCP

**Auto-reconnect** — exponential backoff after a dropped link

**LAN stays reachable** — printers and NAS keep working while connected

</td>
<td>

**Autostart & autoconnect** — up and protected after login

**Node health** — unreachable countries are greyed out, not offered

**Live stats** — uptime and traffic counters

**Signed updates** — proxied through the API, signature verified on the client

</td>
</tr>
</table>

<br/>

## Architecture

The desktop app is split in two processes. Everything that needs administrator rights lives in a service; the window that users see has none.

```text
┌──────────────┐   named pipe    ┌────────────────────┐
│ GnomeVPN.exe │ ──────────────► │ GnomeVPNService    │
│ (no rights)  │ ◄────────────── │ (LocalSystem)      │
│ UI, tray     │     events      │ wintun, routes, DNS│
└──────────────┘                 └─────────┬──────────┘
                                           │ VLESS + Reality (443/TCP)
                                           ▼
                                  ┌────────────────┐
                                  │ VPN node (VPS) │
                                  │ Xray + 3x-ui   │
                                  └────────────────┘
```

The service validates every request it receives: any local process can open the pipe, and the service can rewrite the system routing table.

<br/>

## Stack

| Layer | Choice |
|---|---|
| Web client | Next.js 16, React 19, FSD architecture |
| Desktop | Tauri 2, Rust |
| Tunnel | Xray-core (VLESS + XTLS-Reality), wintun |
| API | NestJS on Bun, Prisma 7, better-auth |
| Database | PostgreSQL |
| Shared types | Zod schemas in `packages/schemas` |
| Payments | YooKassa |
| Delivery | Docker, Caddy, GitHub Actions |

<br/>

## Layout

```text
apps/
├── client/          # Next.js — landing, account area, desktop UI
├── server/          # NestJS API — modules/, lib/, core/, common/
└── tauri/           # Desktop shell — talks to the service
crates/
├── vpn-ipc/         # Wire protocol shared by the shell and the service
└── vpn-service/     # Privileged Windows service: tunnel, routes, DNS
packages/schemas/    # Zod schemas (@gnomevpn/schemas)
infra/
├── caddy/           # TLS, reverse proxy
└── provision/       # One-command VPN node setup over SSH
```

<br/>

## Getting started

**Requirements** — Bun 1.3+, Rust stable, Docker, PostgreSQL.

```bash
bun install

cp apps/server/.env.example apps/server/.env   # fill in the values
docker compose -f docker-compose.dev.yml up -d # database

bun --filter @gnomevpn/server db:push

bun run dev          # client + API
bun run tauri:dev    # desktop app
```

On Windows the desktop app needs `wintun.dll` — see [apps/tauri/bin/README.md](apps/tauri/bin/README.md).

<br/>

## VPN nodes

Adding a country is one command. It installs Docker, brings up Xray, generates a fresh Reality key pair, opens 443 and registers the node in the database:

```bash
bun run provision:nodes
```

Node list lives in `apps/server/nodes.json` — gitignored, since it holds root SSH passwords. Provisioning is run by hand from a machine that can reach the nodes over SSH; it is not part of CI.

Each node carries a `realityServerName`: the site Reality impersonates. It has to answer TLS 1.3 over HTTP/2 without redirecting, so popular suggestions like `dl.google.com` do not actually work.

<br/>

## Deployment

Push to `master` runs the checks, then builds images and ships them to the VPS. Bumping the version in `package.json` cuts a desktop release.

Full walkthrough — domain, secrets, `.env`, first launch — in **[DEPLOY.md](DEPLOY.md)**.

<br/>

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | client + API in watch mode |
| `bun run tauri:dev` | desktop app |
| `bun run typecheck` | types across all packages |
| `bun lint` | Biome |
| `bun run tauri:build` | installers |
| `bun run provision:nodes` | set up VPN nodes |
| `bun run release:patch` | bump the version and trigger a release |

<br/>

## Status

In development. Working: tunnel, subscriptions, node health, autostart, auto-updates.

Windows only for now — the tunnel runs in a LocalSystem service, and macOS/Linux would each need their own privileged helper. Also not there yet: mobile apps, per-app split tunneling (needs a signed kernel driver), DPI evasion.
