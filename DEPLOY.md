# Deploying GnomeVPN

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

---

## Secrets

Settings → Secrets and variables → Actions:

| Secret                                    | What it is                                                    |
| ----------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                     | API address, baked into the browser bundle at build time      |
| `DEPLOY_SSH_HOST` / `_USER` / `_PASSWORD` | control VPS                                                   |
| `DEPLOY_SSH_KEY`                          | private key, preferred over the password                      |
| `DEPLOY_PATH`                             | directory holding docker-compose.yml, usually `/opt/gnomevpn` |

There are no signing keys any more: nothing in this repository ships a binary to
a user. The VPN client is INCY, installed from the user's own app store.

## Deploying web + API

`deploy.yml` fires on a push to master (or manually). It builds the web and
server images, pushes them to ghcr.io, SSHes into the VPS, copies
`docker-compose.yml`, runs `pull && up -d` and applies migrations. The VPS stays
the same — it only pulls the images.

---

## 1. Domain

Register `gnomevpn.ru` and create A records pointing at the server's IP:

```
gnomevpn.ru        A    <IP>
www.gnomevpn.ru    A    <IP>
api.gnomevpn.ru    A    <IP>
```

Without them Caddy will not issue a certificate.

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

# Postgres reads these three variables directly when it creates the database
POSTGRES_USER=gnomevpn
POSTGRES_PASSWORD=<long random password>
POSTGRES_DB=gnomevpn

# postgres is the service name in docker-compose, not localhost
DATABASE_URL=postgresql://gnomevpn:<password>@postgres:5432/gnomevpn
DIRECT_URL=postgresql://gnomevpn:<password>@postgres:5432/gnomevpn

BETTER_AUTH_SECRET=<32+ random characters>
API_URL=https://api.gnomevpn.ru

CORS_ORIGINS=https://gnomevpn.ru


YOOKASSA_SHOP_ID=<from the YooKassa dashboard>
YOOKASSA_SECRET_KEY=<from the same place>
YOOKASSA_RETURN_URL=https://gnomevpn.ru/account
# YooKassa enables recurring charges by hand, on request to support.
YOOKASSA_RECURRING=false

# Mail: address confirmation, email change, password reset.
# The address in EMAIL_FROM must match SMTP_USER, or the provider rejects the
# message with "Sender address rejected: not owned by auth user".
SMTP_HOST=smtp.timeweb.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@gnomevpn.ru
SMTP_PASSWORD=<mailbox password>
EMAIL_FROM=GnomeVPN <noreply@gnomevpn.ru>

# Where the links in the emails lead.
CLIENT_URL=https://gnomevpn.ru

```

Node keys are not written here. `bun provision` puts them in a separate
`.env.nodes` file next to `docker-compose.yml` — one pair per node:
`XRAY_KEY_<country code>` (the name from the `node.api_token_env_var` column)
and `XRAY_PANEL_<country code>`. The container picks up both files, so `.env`
stays hand-written. To check which variables are needed:
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

## 4. Credentials that stay local

Deploys go through Actions, so almost everything lives in the repository
secrets. Only provisioning stays on a workstation:

- **SSH to the nodes** — `PROVISION_SSH_*` in the root `.env` (see section 3).
- **`.env.nodes`** — one `XRAY_KEY_<CC>` / `XRAY_PANEL_<CC>` pair per node,
  written by `bun run provision:nodes` and shipped to the VPS over SSH.

There are no signing keys: the project ships no binaries.

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
curl https://api.gnomevpn.ru/health   # {"status":"ok"}
curl -I https://gnomevpn.ru           # 200
```

---

## 6. Database migrations

The migration history lives in `apps/server/prisma/migrations`. `deploy.yml`
applies them itself: when migration files are present it runs `migrate resolve`
(a baseline for a database built earlier with `db push`) and then `migrate deploy`.

Create a new migration like this:

```bash
cd apps/server
bunx prisma migrate dev --name <name>
```

The next `deploy.yml` run will apply it.

---

## Useful commands

```bash
docker compose logs -f server     # API logs
docker compose restart server     # restart
docker compose pull && docker compose up -d   # manual update

# database backup
docker compose exec postgres pg_dump -U gnomevpn gnomevpn > backup.sql
```

Port 5432 is published, so a client such as TablePlus connects straight to
`<IP>:5432` with the `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` values
from the VPS `.env`, SSL disabled.

**That port is open to the internet and UFW does not close it** — Docker writes
its rules into the FORWARD chain, ahead of UFW, so `ufw deny 5432` has no effect.
The password is the only thing in front of a database holding payer records and
every peer's tunnel credential, so it has to be long and random.

To narrow it to one address, add a rule to `DOCKER-USER`, the one chain Docker
leaves alone:

```bash
iptables -I DOCKER-USER -p tcp --dport 5432 ! -s <your-IP> -j DROP
```

Or close it again by binding to loopback in `docker-compose.yml`
(`'127.0.0.1:5432:5432'`) and tunnelling in:

```bash
ssh -L 5432:localhost:5432 user@<IP>
```

---

## Checking the images locally

```bash
docker build -f apps/server/Dockerfile -t gnomevpn-server .
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.gnomevpn.ru -t gnomevpn-web .
```
