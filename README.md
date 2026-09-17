<p align="center">
  <img src="apps/client/public/brand/logo-mark.svg" width="88" height="88" alt="GnomeVPN" />
</p>

<h1 align="center">GnomeVPN</h1>

<p align="center">
  <strong>A tunnel in one link — no logs, no ads, no config files.</strong><br/>
  Next.js site · NestJS API · Self-hosted Hysteria2 nodes · INCY as the client
</p>

<p align="center">
  <img src="https://img.shields.io/badge/runtime-Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=000" alt="Bun" />
  <img src="https://img.shields.io/badge/protocol-Hysteria2-35f0a0?style=for-the-badge&logoColor=fff" alt="Hysteria2" />
  <img src="https://img.shields.io/badge/web-Next.js%2016-000?style=for-the-badge&logo=nextdotjs&logoColor=fff" alt="Next.js" />
  <img src="https://img.shields.io/badge/api-NestJS-e0234e?style=for-the-badge&logo=nestjs&logoColor=fff" alt="NestJS" />
</p>

<br/>

## Why this exists

Most VPN protocols announce themselves. WireGuard's handshake is a fixed-size UDP
packet; OpenVPN has a recognisable header. Where traffic is inspected, that is
enough to drop the connection.

GnomeVPN leads with **Hysteria2** — QUIC over UDP, masquerading as an HTTP/3
site. The choice was measured, not assumed: this repository first shipped VLESS +
XTLS-Reality, and Russian DPI equipment fingerprinted the REALITY handshake over
_any_ TCP port, killing sessions within minutes of real traffic. Plain WireGuard
on UDP/51820 passed on the same network. UDP is policed differently, so the
tunnel moved.

QUIC is still UDP, though, and some networks drop UDP wholesale — office Wi-Fi,
hotels, a few carriers. So every node also serves **VLESS + Reality** on TCP/443,
and the subscription lists both. The two share the port because one is UDP and
the other TCP.

## One link, every platform

There is no GnomeVPN app to install. The client is
**[INCY](https://incy.cc/)** — a free third-party app that exists on iOS,
Android, Windows, Linux, Android TV and Apple TV.

You copy one URL from your account and paste it into INCY. The app fetches the
server list, the traffic counters and the renewal date from that URL, and keeps
them up to date on its own.

This repository used to carry a Tauri desktop shell, a privileged Rust service
for three operating systems and an Android tunnel — roughly 2,500 files of
platform-specific code. All of it was deleted in favour of a subscription
endpoint that fits in one NestJS module.

**What that bought.** iOS and TV support, which never existed and could not have
been shipped cheaply. Years of somebody else's bug reports on five platforms.

**What it cost.** The app is not ours and carries someone else's name in the
store. The site says so plainly rather than hiding it.

The subscription URL is a standard format, so it also works in Hiddify, v2rayNG,
Streisand and others. That is deliberate — a user who dislikes INCY is not stuck
with it.

## How a connection happens

```text
  Browser                     API                          Node
     │                         │                             │
     │  GET /subscription-link │                             │
     ├────────────────────────►│                             │
     │  url + incy:// deeplink │                             │
     │◄────────────────────────┤                             │
     │                         │                             │
  INCY app                     │                             │
     │  GET /sub/<token>       │                             │
     ├────────────────────────►│  a peer per node, per       │
     │                         │  protocol                   │
     │                         ├────────────────────────────►│
     │  base64 list of         │                             │
     │  hy2:// and vless://    │                             │
     │  + subscription headers │                             │
     │◄────────────────────────┤                             │
     │                                                       │
     │      QUIC/UDP 443, or TCP/443 where UDP is blocked    │
     ├──────────────────────────────────────────────────────►│
```

The token in the URL is the credential — INCY cannot log in, so 32 random bytes
are all the authentication there is. Rotating it in the account kills every copy
of the old link at once.

## Architecture

```text
apps/
├── client/          # Next.js 16, server-rendered, FSD layers + ui-kit
└── server/          # NestJS on Bun, Prisma, Postgres, better-auth
packages/
├── schemas/         # Zod schemas shared by both
└── scripts/         # reporter, ssh, shell — used by provisioning
scripts/provision/   # node setup over SSH
infra/caddy/         # TLS termination and reverse proxy
```

| Layer      | Stack                                           |
| ---------- | ----------------------------------------------- |
| Web        | Next.js 16, React 19, next-intl, TanStack Query |
| API        | NestJS 11 on Bun, Prisma 7, Postgres 17         |
| Auth       | better-auth, bearer tokens                      |
| Payments   | YooKassa, recurring by saved card               |
| Tunnel     | Hysteria2 via the 3x-ui panel                   |
| Client app | INCY (third party)                              |
| Delivery   | Caddy, Docker Compose, ghcr.io                  |

The site is localised into Russian and English, with the locale in the URL
(`/faq`, `/en/faq`) and server-rendered metadata for both.

## Running it locally

```bash
bun install
cp .env.example .env          # fill in DATABASE_URL and BETTER_AUTH_SECRET
bun run dev:infra             # Postgres in Docker
bun --filter @gnomevpn/server db:deploy
bun run dev                   # API on :4000, site on :3000
```

| Command                               | What it does                             |
| ------------------------------------- | ---------------------------------------- |
| `bun run dev`                         | API and site together                    |
| `bun run verify`                      | typecheck, ESLint, Prettier, Stylelint   |
| `bun run fix`                         | every autofixer, same order              |
| `bun run test`                        | Vitest across every workspace            |
| `bun run test:e2e`                    | Playwright against the public routes     |
| `bun --filter @gnomevpn/client build` | the only check that catches SSR breakage |
| `bun run provision:nodes`             | set up VPN nodes over SSH                |

`bun run test`, never bare `bun test` — the latter is Bun's own runner and fails
the whole suite on the first Vitest-specific API it meets.

## Deployment

Two GitHub Actions, no local build steps:

- **`checks.yml`** runs on every push and pull request: typecheck, lint, tests,
  then a client build.
- **`deploy.yml`** is manual. It pushes the web and server images to ghcr.io,
  copies `docker-compose.yml` and the Caddyfile to the VPS, runs migrations
  **before** bringing the new containers up, and waits on both healthchecks.

Adding a VPN node stays a local command: it talks to the machine over SSH with
credentials that never enter CI, and it is a decision a human makes, not a commit.

See [DEPLOY.md](DEPLOY.md) for the VPS side.

## Status

Working: the subscription feed, billing with recurring payments, device limits,
node provisioning, the localised site.

Not done: per-app routing (INCY has it on Android; we do not drive it from the
subscription yet), a Telegram bot, referral codes.

## License

See [LICENSE](LICENSE).
