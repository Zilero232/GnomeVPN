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

## Why Hysteria2

Most VPN protocols announce themselves — WireGuard's handshake is a fixed-size
UDP packet, OpenVPN has a recognisable header. Where traffic is inspected, that
is enough to drop the connection.

The choice here was measured, not assumed. This repository first shipped
VLESS + XTLS-Reality; Russian DPI fingerprinted the REALITY handshake over _any_
TCP port and killed sessions within minutes. Plain WireGuard on UDP passed on the
same network, so the tunnel moved to **Hysteria2** — QUIC over UDP, masquerading
as an HTTP/3 site.

QUIC is still UDP, and some networks drop UDP wholesale. So every node also
serves **VLESS + Reality** on TCP/443 and the subscription lists both; the two
share the port because one is UDP and the other TCP. The user picks whichever
connects.

## One link, every platform

There is no GnomeVPN app. The client is **[INCY](https://incy.cc/)** — a free
third-party app on iOS, Android, Windows, Linux, Android TV and Apple TV. You
paste one URL into it and it keeps the server list, traffic counters and renewal
date up to date on its own.

That URL is a standard subscription format, so Hiddify, v2rayNG, Streisand and
others read it too — deliberately, so nobody is stuck with INCY.

This bought iOS and TV support, which never existed here and could not have been
shipped cheaply; it cost ~2,500 files of Tauri, Rust and Android code, and the
app now carries someone else's name. The site says so plainly rather than hiding
it.

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

The token is the credential — INCY cannot log in, so 32 random bytes are the
whole of the authentication. Rotating it kills every copy of the old link at once.

## Architecture

```text
apps/
├── client/          # Next.js 16, server-rendered, FSD layers + ui-kit
└── server/          # NestJS on Bun, Prisma, Postgres, better-auth
packages/
├── schemas/         # Zod schemas shared by both
├── logger/          # one pino config: levels, redaction, transport
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
| Tunnel     | Hysteria2 and VLESS + Reality via 3x-ui         |
| Client app | INCY (third party)                              |
| Bot        | grammY on a webhook, Russian and English        |
| Delivery   | Caddy, Docker Compose, ghcr.io                  |

The site is localised into Russian and English, with the locale in the URL
(`/faq`, `/en/faq`) and server-rendered metadata for both. The Telegram bot is a
second door to the same account: it reads the subscription, the link and the
checkout through the services that already own them.

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

One GitHub Action, no local build steps. **`deploy.yml`** is manual: it runs
typecheck, lint, tests, the client build and Playwright over the public routes,
then pushes both images to ghcr.io, copies `docker-compose.yml` and the Caddyfile
to the VPS, runs migrations **before** bringing the new containers up, and waits
on both healthchecks.

Adding a VPN node stays a local command: it talks to the machine over SSH with
credentials that never enter CI, and it is a decision a human makes, not a commit.

See [DEPLOY.md](DEPLOY.md) for the VPS side.

## Status

Working: the subscription feed, billing with recurring payments, a free trial
day, device limits, node provisioning, the localised site, and a Telegram bot
that covers everything the account page does except card management.

Not done: per-app routing (INCY has it on Android; the subscription does not
drive it yet), referral codes, and real certificates on the nodes — until those
exist, sing-box clients skip verification where xray clients pin.

## License

See [LICENSE](LICENSE).
