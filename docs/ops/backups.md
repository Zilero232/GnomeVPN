# Backups

How the production database is dumped, restored and moved. Part of the
[documentation index](../README.md); the rest of the VPS is in
[deploy.md](deploy.md).

## The database backs itself up, and the suffix lies

The `backup` service is
[postgres-backup-local](https://github.com/prodrigestivill/docker-postgres-backup-local)
— `go-cron` driving `pg_dump`, with daily/weekly/monthly rotation and an atomic
rename already in it, writing into the `pgbackups` volume. A hand-written loop
was tried first and grew five bugs before this replaced it. It needs no setup:
it ships in `docker-compose.yml` and starts with the rest of the stack. The tag
has to match the postgres service: an older `pg_dump` refuses a newer server.

**`--compress=9` is load-bearing.** The image names every file `.sql.gz` from a
`BACKUP_SUFFIX` string, but it only pipes through `gzip` on its `pg_dumpall`
cluster path — the single-database path writes plain SQL under that suffix. The
dumps are readable either way, but every documented restore starts with `gunzip`
and would fail on the first byte.

---

## Automatic backups

```bash
docker compose logs backup                   # what it has taken
docker compose exec backup ls -R /backups    # last/, daily/, weekly/, monthly/
docker compose exec backup /backup.sh        # take one right now
```

Override the schedule in `.env` — `BACKUP_SCHEDULE` becomes the image's
`SCHEDULE`, a six-field cron with seconds first. These are the defaults:

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
VPN node, it is not in git, and `bun run provision:nodes` is the only thing that writes
it. Without it the server cannot talk to any node, and every tunnel stops being
issued.

```bash
scp root@<old IP>:/opt/gnomevpn/.env.nodes root@<new IP>:/opt/gnomevpn/
```

The nodes themselves do not move and are not reprovisioned: they hold no state
beyond their own keys, and their addresses live in the `node` table that just
came across with the dump.
