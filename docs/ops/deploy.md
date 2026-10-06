# Deploying GnomeVPN

The VPS side of a deploy: DNS, the server's `.env`, the Telegram bot, the first
run and migrations. Backups and moving the database are in
[backups.md](backups.md); adding a VPN node is
[provisioning-a-node.md](provisioning-a-node.md). Part of the
[documentation index](../README.md).

## What runs where

| Component     | Where          | How it updates            |
| ------------- | -------------- | ------------------------- |
| Site, Next.js | VPS, Docker    | CI: `deploy.yml`          |
| API           | VPS, Docker    | CI: `deploy.yml`          |
| Caddy (TLS)   | VPS, Docker    | CI: `deploy.yml`          |
| Database      | VPS, Docker    | same place                |
| VPN client    | on the user    | INCY, from their store    |
| VPN nodes     | separate VPSes | `bun run provision:nodes` |

Everything but node provisioning is built in GitHub Actions. Images are pushed
to ghcr.io; **the VPS builds nothing** — it only pulls ready-made images.

## Secrets

Settings → Secrets and variables → Actions:

| Secret                      | What it is                                                    |
| --------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | API address, baked into the browser bundle at build time      |
| `DEPLOY_SSH_HOST` / `_USER` | control VPS                                                   |
| `DEPLOY_SSH_KEY`            | private key, preferred                                        |
| `DEPLOY_SSH_PASSWORD`       | used only when no key is set                                  |
| `DEPLOY_SSH_PORT`           | optional, defaults to 22                                      |
| `DEPLOY_PATH`               | directory holding docker-compose.yml, usually `/opt/gnomevpn` |

No signing keys: nothing here ships a binary. The VPN client is INCY, installed
from the user's own app store.

`deploy.yml` runs by hand (`workflow_dispatch`). It runs every check, builds both
images and pushes them to ghcr.io, copies `docker-compose.yml` and the
`Caddyfile` to the VPS, then over SSH pulls `web` and `server`, runs migrations,
`up -d`, and waits for both containers to report healthy.

---

## 1. Domain and DNS

`example.com` stands in for the real domain everywhere in this file. The real
one is written down in exactly two places, both outside the docs:
`infra/caddy/Caddyfile`, where Caddy needs it to issue certificates, and the
`.env` on the VPS.

Changing the canonical host means every subscription URL already handed out
points at the old one, so every subscriber has to add the new link once.

DNS is hosted at Cloudflare, on the free plan. Only `bot` is proxied (orange
cloud); the site and `api` resolve straight to this VPS — why is in
[architecture/telegram-bot.md](../architecture/telegram-bot.md).

**Pointing the domain at Cloudflare**

1. Cloudflare → _Add a site_ → `example.com` → **Free**.
2. It returns two nameservers, `x.ns.cloudflare.com`.
3. Dynadot → the domain → _Nameservers_ → replace both with them.

Propagation takes minutes to a few hours.

**Records** — four `A` records at the VPS: `@`, `www`, `api`, `bot`.

**The orange cloud stays OFF until Caddy has its certificates.** Let's Encrypt
validates over HTTP-01, which has to reach this server; with the proxy on,
Cloudflare answers the challenge instead and the issue never completes.

Once the site serves HTTPS, turn the cloud on for `bot` only (see the Telegram
section for why) and set SSL/TLS to **Full (strict)** — a lower mode has
Cloudflare and Caddy redirect each other in a loop.

---

## 2. Preparing the VPS

```bash
curl -fsSL https://get.docker.com | sh

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

mkdir -p /opt/gnomevpn
```

Log in to the image registry (a token with the `read:packages` scope):

```bash
echo "<GITHUB_TOKEN>" | docker login ghcr.io -u <username> --password-stdin
```

---

## 3. The .env file on the server

Create `/opt/gnomevpn/.env`. It is not in git — it lives only on the VPS.

```env
NODE_ENV=production
PORT=4000

# Postgres reads these three variables directly when it creates the database,
# and the backup container reads the same three to reach it
POSTGRES_USER=gnomevpn
POSTGRES_PASSWORD=<long random password>
POSTGRES_DB=gnomevpn

# Optional: the backup container defaults to these when they are absent
# (see backups.md)
BACKUP_SCHEDULE=0 0 */6 * * *
BACKUP_KEEP_DAYS=14

# postgres is the service name in docker-compose, not localhost
DATABASE_URL=postgresql://gnomevpn:<password>@postgres:5432/gnomevpn
DIRECT_URL=postgresql://gnomevpn:<password>@postgres:5432/gnomevpn

BETTER_AUTH_SECRET=<32+ random characters>
API_URL=https://api.example.com

CORS_ORIGINS=https://example.com


YOOKASSA_SHOP_ID=<from the YooKassa dashboard>
YOOKASSA_SECRET_KEY=<from the same place>
YOOKASSA_RETURN_URL=https://example.com/account
# YooKassa enables recurring charges by hand, on request to support.
YOOKASSA_RECURRING=false

# Mail: address confirmation, email change, password reset.
# The address in EMAIL_FROM must match SMTP_USER, or the provider rejects the
# message with "Sender address rejected: not owned by auth user".
SMTP_HOST=smtp.timeweb.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@example.com
SMTP_PASSWORD=<mailbox password>
EMAIL_FROM=GnomeVPN <noreply@example.com>

# Where the links in the emails lead.
CLIENT_URL=https://example.com

# Optional: sent to INCY as the support-url header.
SUPPORT_URL=

# Telegram bot — optional. Leave the token empty and the bot never starts.
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=https://bot.example.com

```

Node keys are not written here. `bun run provision:nodes` puts them in a
separate `.env.nodes` file next to `docker-compose.yml` — one pair per node:
`XRAY_KEY_<country code>` (the name from the `node.api_token_env_var` column)
and `XRAY_PANEL_<country code>`. The container picks up both files, so `.env`
stays hand-written; the deploy creates an empty `.env.nodes` if none exists yet.
To check which variables are needed:
`SELECT country, api_token_env_var FROM node;`

Plan prices are not set in `.env` — they live in `PLANS` (`packages/schemas`),
where both the server reads them when charging and the landing page reads them
when rendering.

**If the password contains a `$`, it has to be doubled: `$$`.** Docker Compose
substitutes variables inside `.env`, and a single `$` gets eaten.

Mail will not work until the domain has **SPF, DKIM and DMARC** records — Gmail
and mail.ru send such messages to spam or reject them outright. The values come
from the mail provider. Until SMTP is filled in, sign-up and sign-in work while
the emails silently fail to send (the error is written to the log).

Passwords are generated like this:

```bash
openssl rand -base64 32
```

**`CORS_ORIGINS` is the site's origin and nothing else.** The browser is the only caller; anything extra widens the surface for no gain.

---

## Creating the Telegram bot

The bot is optional — an empty `TELEGRAM_BOT_TOKEN` switches it off and the
deploy still works. To turn it on:

**1. Create it.** Message [@BotFather](https://t.me/BotFather), send `/newbot`,
give it a display name and then a username ending in `bot`
(`gnomevpn_bot`). He answers with the token.

**2. Fill in the four variables** in `/opt/gnomevpn/.env`:

```env
TELEGRAM_BOT_TOKEN=<what BotFather sent>
TELEGRAM_BOT_USERNAME=gnomevpn_bot
TELEGRAM_WEBHOOK_SECRET=<generated>
TELEGRAM_WEBHOOK_URL=https://bot.example.com
```

**`bot.example.com` is the one name that goes through Cloudflare.** Point an
`A` record at the VPS and turn the orange cloud **on**; an `AAAA` beside it is
fine. Leave the site and `api` on grey clouds. Why the callback host needs
Cloudflare's IPv4 and nothing else should pay for it:
[architecture/telegram-bot.md](../architecture/telegram-bot.md#telegram-is-a-second-door-to-the-same-account).

After a DNS change Telegram keeps answering for the old address for a few
minutes. `setWebhook` failing right afterwards usually means its cache, not the
records — wait and let the boot retry.

`bun run secrets` fills in `TELEGRAM_WEBHOOK_SECRET` and `BETTER_AUTH_SECRET`
when they are still empty — in the root `.env` of the machine it runs on, and it
leaves anything already set alone. `--force` overwrites, which for
`BETTER_AUTH_SECRET` signs every live session out.

`TELEGRAM_BOT_USERNAME` carries no `@`: the account page builds
`t.me/<username>?start=<code>` out of it, and a wrong value makes the connect
button lead nowhere.

**3. Restart the server.** Everything else happens on boot, in both languages:
the bot's name, its description, its short description, its command list, the
menu button — and the webhook, pointed at `TELEGRAM_WEBHOOK_URL`. The bot
answers `/start` from then on. Nothing is registered by hand.

The webhook needs `TELEGRAM_WEBHOOK_URL` to be https and
`TELEGRAM_WEBHOOK_SECRET` to be set; without either, the server logs that it
skipped it and the rest still applies.

`docker compose logs server | grep telegram` is where to look when the bot goes
quiet: the boot reports the webhook it found, whatever Telegram last failed to
deliver to it, and how many updates are waiting.

BotFather holds exactly one thing the API cannot set: the bot's photo. Send him
`/setuserpic` once. Everything else edited there is overwritten on the next
restart, because the locale files under
`apps/server/src/modules/telegram/config/locales/` are the source.

---

## 4. Credentials that stay local

Deploys go through Actions, so almost everything lives in the repository
secrets. Only provisioning stays on a workstation:

- **SSH to the nodes** — root credentials per host in `nodes.json`.
- **SSH to this VPS** — `PROVISION_SSH_*` in the workstation's root `.env`, which
  provisioning uses to ship `.env.nodes` and the node rows here.
- **`.env.nodes`** — one `XRAY_KEY_<CC>` / `XRAY_PANEL_<CC>` pair per node,
  written by `bun run provision:nodes` and shipped to the VPS over SSH.

The steps are in [provisioning-a-node.md](provisioning-a-node.md).

---

## Backups

The `backup` container dumps the database on a schedule with no setup. How to
read, copy off and restore the dumps, and how to move the database to another
VPS: [backups.md](backups.md).

---

## 5. First run

```bash
cd /opt/gnomevpn
docker compose pull
docker compose up -d
docker compose logs -f
```

Check:

```bash
curl https://api.example.com/health   # {"status":"ok"}
curl -I https://example.com           # 200
```

---

## 6. Database migrations

The migration history lives in `apps/server/prisma/migrations`. `deploy.yml`
applies it itself, in a one-off `server` container before `up -d`: first
`migrate resolve --applied 20260723000000_baseline` (marks the baseline as
applied on a database built earlier with `db push`; it fails harmlessly once
that is recorded), then `migrate deploy`.

Create a new migration like this:

```bash
cd apps/server
bunx prisma migrate dev --name <name>
```

The next `deploy.yml` run will apply it.

### Connecting a GUI to the production database

Postgres binds to loopback, so there is no port to reach from outside — a
desktop client tunnels in over SSH instead. Every one of them can do this on its
own; in TablePlus it is the "Over SSH" tab of the connection dialog:

| Field                      | Value                                  |
| -------------------------- | -------------------------------------- |
| SSH host                   | the VPS address                        |
| SSH user                   | `root`                                 |
| SSH password / key         | the same one you log in with           |
| Database host              | `127.0.0.1`                            |
| Database port              | `5432`                                 |
| User / password / database | `POSTGRES_*` from `/opt/gnomevpn/.env` |

The database host stays `127.0.0.1` because the tunnel makes the server's own
loopback local to you.

From a terminal the same thing is one command, after which `localhost:5432` is
the production database for as long as it runs:

```bash
ssh -L 5432:127.0.0.1:5432 root@<vps>
```

`docker compose exec postgres psql -U gnomevpn gnomevpn` needs no tunnel at all
when a shell is enough.

---

## Useful commands

```bash
docker compose logs -f server     # API logs
docker compose restart server     # restart
docker compose pull && docker compose up -d   # manual update
```

Dumping, restoring and copying the database off the host: [backups.md](backups.md).

---

## Checking the images locally

```bash
docker build -f apps/server/Dockerfile -t gnomevpn-server .
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t gnomevpn-web .
```

---

## What the workflows assume

[.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) is shaped by
the reasons below.

**Deploys are a workflow, not a local command.** There are no binaries to build
or sign any more: `deploy.yml` pushes two images to ghcr and the VPS pulls them.

**`deploy.yml` is the only workflow.** It is manual, and it runs every check
this repository has before either image is built — typecheck, lint, tests, the
client build, and Playwright over the public routes — so an image is never
pushed from a tree that would have failed. `checks` and `e2e` run beside each
other: a lint error and a broken route are worth learning about in the same run.

The client build is separate from typecheck because it is the only thing that
catches a page which typechecks but throws during prerender.
Migrations run **before** `docker compose up -d`: doing it after means the new
build serves traffic against the old schema and can query a column its migration
has not added yet. `up -d` returns when the container starts, not when the app
answers, so the deploy waits on the compose healthchecks for both `server` and
`web`.

`docker-compose.yml` and `infra/caddy/Caddyfile` are copied to the VPS on every
deploy and land flat next to each other — the compose file bind-mounts
`./Caddyfile`, so a nested path would mount a directory.

**A copied Caddyfile does nothing until Caddy restarts.** A single-file bind
mount pins the inode it saw at container start; `scp` writes a new file, so the
container keeps reading the old one, and `up -d` does not recreate a container
whose spec did not change. The deploy therefore ends with
`docker compose restart caddy` — `caddy reload` would re-read the stale inode.

**The API also answers on `api.gnomevpn.ru`.** The project lived on
`gnomevpn.ru` before moving, and a subscription link imported then still names
the old host. When the Caddyfile dropped it, every such INCY refresh got a TLS
`internal_error` alert (`TLSV1_ALERT_INTERNAL_ERROR` in its log) — Caddy's
answer to an SNI it holds no certificate for — while the same account worked in
a browser on the new domain. The old DNS records still point at the VPS, so
Caddy issues a certificate for the old name too; the old site names redirect to
`gnome-vpn.com`. `default_sni`/`fallback_sni` hand the API certificate to a
ClientHello without SNI or with an unknown name instead of the bare alert.
Never drop a domain that subscription links were ever issued on.

The workflow and its composite actions in `.github/actions/` pin every action to a commit SHA rather than a tag — a tag can be
moved, and these jobs hold production SSH. `DATABASE_URL`/`DIRECT_URL` are set to
placeholders because the server postinstall runs `prisma generate`, which
resolves `DIRECT_URL` through `env()` but never connects.

The toolchain is pinned in `mise.toml` — bun, and node 22 for serving the
standalone build the way the web image does. CI installs it through
`jdx/mise-action` in `.github/actions/setup`, so bumping a version is one edit
there (plus `packageManager` and the Dockerfiles' `oven/bun` tag, which mise
does not read).
