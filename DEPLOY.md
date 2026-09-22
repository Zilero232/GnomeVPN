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

## Secrets

Settings → Secrets and variables → Actions:

| Secret                                    | What it is                                                    |
| ----------------------------------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                     | API address, baked into the browser bundle at build time      |
| `DEPLOY_SSH_HOST` / `_USER` / `_PASSWORD` | control VPS                                                   |
| `DEPLOY_SSH_KEY`                          | private key, preferred over the password                      |
| `DEPLOY_PATH`                             | directory holding docker-compose.yml, usually `/opt/gnomevpn` |

No signing keys: nothing here ships a binary. The VPN client is INCY, installed
from the user's own app store.

`deploy.yml` fires on a push to master or by hand. It builds both images, pushes
them to ghcr.io, SSHes in, copies `docker-compose.yml`, then runs migrations and
`pull && up -d`.

---

## 1. Domain and DNS

`example.com` stands in for the real domain everywhere in this file. The real
one is written down in exactly two places, both outside the docs:
`infra/caddy/Caddyfile`, where Caddy needs it to issue certificates, and the
`.env` on the VPS.

Changing the canonical host means every subscription URL already handed out
points at the old one, so every subscriber has to add the new link once.

DNS runs through Cloudflare, which hides the server's address: a visitor
resolves a Cloudflare IP, not this VPS, so the machine cannot be blocked by
address. The free plan covers all of it.

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
BACKUP_INTERVAL_HOURS=6
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

# Telegram bot — optional. Leave the token empty and the bot never starts.
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_WEBHOOK_URL=https://bot.example.com

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
fine. Our own IPv4 cannot reach Telegram and Telegram refuses an AAAA-only host
(`IPv6-only addresses are not allowed`), so the callback needs IPv4 that is not
ours.

Leave the site and `api` on grey clouds. Russian ISPs have throttled Cloudflare
since June 2025, and only the callback host should pay that cost.

After a DNS change Telegram keeps answering for the old address for a few
minutes. `setWebhook` failing right afterwards usually means its cache, not the
records — wait and let the boot retry.

`bun run secrets` fills in the secrets that are still empty — locally into
`.env`, and it leaves anything already set alone. `--force` overwrites, which
for `BETTER_AUTH_SECRET` signs every live session out.

`TELEGRAM_BOT_USERNAME` carries no `@`: the account page builds
`t.me/<username>?start=<code>` out of it, and a wrong value makes the connect
button lead nowhere.

**3. Restart the server.** Everything else happens on boot, in both languages:
the bot's name, its description, its short description, its command list, the
menu button — and the webhook, pointed at `TELEGRAM_WEBHOOK_URL`. The bot
answers `/start` from then on.

Nothing is registered by hand. `api.telegram.org` is blocked by most Russian
ISPs, so a manual step would be something only the production host could do, and
something a domain change or a rotated secret would silently invalidate.

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

- **SSH to the nodes** — `PROVISION_SSH_*` in the root `.env` (see section 3).
- **`.env.nodes`** — one `XRAY_KEY_<CC>` / `XRAY_PANEL_<CC>` pair per node,
  written by `bun run provision:nodes` and shipped to the VPS over SSH.

---

## Automatic backups

The `backup` container is
[postgres-backup-local](https://github.com/prodrigestivill/docker-postgres-backup-local):
`pg_dump` on a cron, keeping daily, weekly and monthly copies in the `pgbackups`
volume. It needs no setup — it ships in `docker-compose.yml` and starts with the
rest of the stack.

```bash
docker compose logs backup                   # what it has taken
docker compose exec backup ls -R /backups    # last/, daily/, weekly/, monthly/
docker compose exec backup /backup.sh        # take one right now
```

Override the schedule in `.env` — `SCHEDULE` is a six-field cron, seconds first:

```bash
BACKUP_SCHEDULE=0 0 */6 * * *
BACKUP_KEEP_DAYS=14
BACKUP_KEEP_WEEKS=8
BACKUP_KEEP_MONTHS=6
```

**The dumps live on this VPS and nowhere else.** They cover a bad migration, a
mistaken `DELETE` and a corrupted table; they do not cover losing the machine.
Before anything irreversible, copy one off the host:

```bash
docker compose cp backup:/backups ./backups   # all of them
```

Restoring one:

```bash
docker compose cp ./backups/daily/gnomevpn-latest.sql.gz postgres:/tmp/dump.sql.gz
docker compose exec postgres sh -c 'gunzip -c /tmp/dump.sql.gz | psql -U gnomevpn -d gnomevpn'
```

`psql` needs no password: the image trusts local connections. The dump is plain
SQL without owners or privileges, so it restores into any database the role can
write to — which is what makes it usable on a fresh VPS as well.

---

## Moving to another VPS

The database is the only thing that cannot be rebuilt from the repository, so it
moves first and everything else follows.

**1. Dump it on the old server**

```bash
docker exec gnomevpn-postgres pg_dump -U gnomevpn -Fc gnomevpn > gnomevpn.dump
```

`-Fc` is the custom format: it restores in one command and does not care about
the order the objects come back in.

**2. Copy it across**

```bash
scp gnomevpn.dump root@<new IP>:/opt/gnomevpn/
```

**3. Bring up only Postgres on the new server**, so nothing writes to a half
restored database:

```bash
docker compose up -d postgres
```

**4. Restore**

```bash
docker exec -i gnomevpn-postgres pg_restore -U gnomevpn -d gnomevpn --clean --if-exists < /opt/gnomevpn/gnomevpn.dump
```

**5. Check the rows arrived** before pointing any DNS at the new machine:

```bash
docker exec gnomevpn-postgres psql -U gnomevpn -d gnomevpn -c 'SELECT count(*) FROM "user";'
docker exec gnomevpn-postgres psql -U gnomevpn -d gnomevpn -c 'SELECT count(*) FROM node;'
```

**6. Then the rest** — `docker compose up -d`, DNS, and the old server stays
running until the new one answers on the domain.

**`.env.nodes` travels too.** It holds one panel password and one API token per
VPN node, it is not in git, and `bun provision` is the only thing that writes
it. Without it the server cannot talk to any node, and every tunnel stops being
issued.

```bash
scp root@<old IP>:/opt/gnomevpn/.env.nodes root@<new IP>:/opt/gnomevpn/
```

The nodes themselves do not move and are not reprovisioned: they hold no state
beyond their own keys, and their addresses live in the `node` table that just
came across with the dump.

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
applies them itself: when migration files are present it runs `migrate resolve`
(a baseline for a database built earlier with `db push`) and then `migrate deploy`.

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

# database backup
docker compose exec postgres pg_dump -U gnomevpn gnomevpn > backup.sql
```

---

## Checking the images locally

```bash
docker build -f apps/server/Dockerfile -t gnomevpn-server .
docker build -f apps/client/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t gnomevpn-web .
```
