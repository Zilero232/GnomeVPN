# Deploying GnomeVPN

## What runs where

| Component              | Where          | How it updates                |
| ---------------------- | -------------- | ----------------------------- |
| Landing page + account | VPS, Caddy     | CI: `deploy.yml`              |
| API                    | VPS, Docker    | CI: `deploy.yml`              |
| Database               | VPS, Docker    | same place                    |
| Desktop + Android      | on the user    | CI: `release.yml` on a v* tag |
| VPN nodes              | separate VPSes | `bun run provision:nodes`     |

Everything but node provisioning is built in GitHub Actions. Images are pushed
to ghcr.io; **the VPS builds nothing** — it only pulls ready-made images.

---

## Release

A tag runs `release.yml`:

```bash
npm version patch        # or edit version in package.json
git push --follow-tags
```

CI takes it from there: three runners (Windows, macOS, Linux) build the desktop
via `tauri-action`, a separate job does Android, and the last one publishes the
release. Cross-compilation is no good here: Tauri does not support it, and macOS
cannot be built off a Mac at all — hence the runner matrix.

`tauri-action` merges `latest.json` across all platforms itself, so auto-update
gets one entry per OS.

### One-time secret setup

Settings → Secrets and variables → Actions:

| Secret                                    | What it is                                                    |
| ----------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                     | API address, baked into the build                             |
| `TAURI_SIGNING_PRIVATE_KEY`               | contents of `~/.tauri/gnomevpn.key`                           |
| `ANDROID_KEY_ALIAS`                       | alias of the APK signing key                                  |
| `ANDROID_KEY_PASSWORD`                    | keystore and key password                                     |
| `ANDROID_KEY_BASE64`                      | the keystore itself, in base64                                |
| `DEPLOY_SSH_HOST` / `_USER` / `_PASSWORD` | control VPS                                                   |
| `DEPLOY_PATH`                             | directory holding docker-compose.yml, usually `/opt/gnomevpn` |

The update signing key is created once:

```bash
bun run --filter @gnomevpn/tauri signer:generate   # writes ~/.tauri/gnomevpn.key
```

The Android keystore is also a one-time, local step:

```bash
keytool -genkeypair -v -keystore gnomevpn.keystore -alias gnomevpn \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -i gnomevpn.keystore | pbcopy                # → ANDROID_KEY_BASE64
```

**Keep the keystore outside the repository.** Lose it and there is nothing left
to update already-installed APKs with, and Play Store will not accept a new key.

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

CORS_ORIGINS=https://gnomevpn.ru,tauri://localhost,http://tauri.localhost

GITHUB_TOKEN=<PAT with Contents: Read — without it desktop updates do not work>

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

**`CORS_ORIGINS` must include `tauri://localhost`** — otherwise the desktop app will not be able to reach the API.

---

## 4. Release keys

Release and deploy both go through Actions, so almost everything lives in the
repository secrets. Only provisioning stays local:

- **SSH to the nodes** — `PROVISION_SSH_*` in the root `.env` (see section 3).
- **Desktop signing key** — `~/.tauri/gnomevpn.key` (see below).
- **Android keystore** — created once with `keytool`, lives in the repository secrets.

### The update signing key

It is what makes the app accept updates only from us. Generated once:

```bash
bun --filter @gnomevpn/tauri signer:generate
```

This creates two files in `~/.tauri/` — outside the repository, so the key
physically cannot end up in git.

Then:

1. `~/.tauri/gnomevpn.key.pub` → the `plugins.updater.pubkey` field in
   `tauri.windows.conf.json`, `tauri.macos.conf.json` and `tauri.linux.conf.json`
2. In the same files, `"active": false` → `true`

CI takes the private key from the `TAURI_SIGNING_PRIVATE_KEY` secret. If the key
is encrypted, add a second secret `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` and wire
it into `release.yml`.

Signing a file by hand (usually unnecessary — CI does it itself):

```bash
bun --filter @gnomevpn/tauri signer:sign -- <path-to-file>
```

**The private key cannot be recovered.** Lose it and you will have to ship a new version with a new key, and auto-update will stop working for users on the old one: they will see an update, but the signature will not match. Keep a copy outside the repository.

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

Port 5432 is not exposed. To connect with a client, use an SSH tunnel:

```bash
ssh -L 5432:localhost:5432 user@<IP>
```

---

## Checking the images locally

```bash
docker build -f apps/server/Dockerfile -t gnomevpn-server .
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.gnomevpn.ru -t gnomevpn-web .
```
