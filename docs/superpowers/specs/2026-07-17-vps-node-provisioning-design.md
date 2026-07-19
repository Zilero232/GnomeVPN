# VPS Node Provisioning — Design

**Status:** Approved for planning
**Depends on:** Stage 1 MVP (backend control plane, `infra/wg-easy` compose template, `apps/server/scripts/seed-node.ts`)

## Problem

Vesper's control plane already orchestrates ephemeral WireGuard peers per user
(connect creates a peer on the chosen node's wg-easy instance, disconnect
removes it — this part is done and E2E-verified). What's missing: turning a
list of bare VPS hosts (one per country) into registered, working Vesper
nodes. Today that's a fully manual process — SSH in, install Docker, copy
`infra/wg-easy/docker-compose.yml`, hand-generate a bcrypt password hash,
start the stack, add a `WG_KEY_*` line to `apps/server/.env`, run
`seed-node.ts` once per node. This design automates that whole chain from a
single list of hosts down to working `Node` rows in the database.

## Goal

One command, `bun run provision:nodes`, that takes a JSON list of
`{ host, sshUser, sshPassword, country, countryCode, flagEmoji, city? }`
and, for each entry: provisions Docker + wg-easy on the VPS over SSH,
locks down the REST port with a firewall rule, writes the generated
panel password into `apps/server/.env`, and upserts the corresponding
`Node` row via Prisma. Re-running it against the same list is safe
(idempotent) — it should converge already-provisioned nodes to the same
state, not error out or duplicate anything.

## Non-goals

- Not building a general-purpose fleet/config-management tool. No Ansible,
  no agent installed on the VPS, no ongoing drift detection. This is a
  one-shot convergence script run by hand when nodes are added or changed.
- Not solving backend↔wg-easy connectivity beyond a static-IP firewall
  allowlist. A full private mesh (WireGuard-based backend↔node VPC) is
  explicitly out of scope for Stage 1 — noted as a future upgrade path.
- Not managing DNS, TLS, or reverse proxies in front of the wg-easy REST
  panel. The panel is reached directly over its raw port, firewalled to one
  IP.
- Not deprovisioning/tearing down nodes. This script only converges forward
  (create/update); removing a node from `nodes.json` does not touch the VPS
  or delete the `Node` row. Manual teardown for now.

## Architecture

### Input: `infra/provision/nodes.json` (gitignored) + `nodes.example.json` (committed)

```json
[
  {
    "host": "203.0.113.10",
    "sshUser": "root",
    "sshPassword": "REPLACE_ME",
    "country": "Germany",
    "countryCode": "DE",
    "flagEmoji": "🇩🇪",
    "city": "Frankfurt"
  }
]
```

Validated with a Zod schema (`packages/schemas`-style, but local to the
script since it's infra tooling, not a shared client/server contract) at
load time: reject the whole run on a malformed entry before touching any
VPS, rather than failing halfway through a batch.

`sshPassword` in a JSON file on disk is an accepted tradeoff per the
project owner's explicit choice (no SSH keys, no agent) — mitigated by
gitignoring the file and documenting it as sensitive in
`nodes.example.json`'s companion README section, same treatment `.env`
already gets elsewhere in this repo.

### The script: `infra/provision/provision-nodes.ts`

Run via `bun run provision:nodes` (root `package.json` script), invoked as
`bun infra/provision/provision-nodes.ts`. Optional CLI flag
`--backend-ip=<ip>` (see Firewall section) — if omitted, the script opens
the REST port to all sources and prints a loud warning per node, so the
happy path (no backend IP known yet) still produces a *working* node, just
not yet a *locked-down* one; re-running later with `--backend-ip` tightens
it without re-provisioning anything else (idempotent).

For each host, sequentially (not parallel — clearer logs, and VPS
provisioning isn't latency-sensitive; a future version could parallelize if
batch size grows, but Stage 1's list is small):

1. **Connect** over SSH using `ssh2` (password auth, per the project
   owner's constraint — no key-based auth path needed).
2. **Ensure Docker.** Run `docker --version`; if absent or the command
   fails, run the official convenience script
   (`curl -fsSL https://get.docker.com | sh`) and re-check. Assumes a
   Debian/Ubuntu-family VPS (matches `infra/wg-easy/README.md`'s existing
   assumption — not a new constraint).
3. **Resolve the panel password.** Read `apps/server/.env` for an existing
   `WG_KEY_<COUNTRYCODE>=...` line. If found, reuse that password (this is
   what makes re-runs non-destructive to a live node — see step 6). If not
   found, generate a fresh random password locally (not derived from
   anything guessable). Either way, bcrypt-hash it (same `bcryptjs`
   approach already documented in `infra/wg-easy/README.md`) for use in
   the next step.
4. **Ship the compose stack.** SFTP `infra/wg-easy/docker-compose.yml` to
   `/opt/vesper-wg-easy/docker-compose.yml` on the VPS (fixed remote path),
   and write a `.env` next to it with `WG_HOST=<host>`,
   `WG_EASY_PASSWORD_HASH=<hash-from-step-3>` (with the `$`→`$$` doubling
   this repo already discovered and documented — the script does this
   programmatically, so the "remember to double your dollars" trap goes
   away entirely for this path), `WG_DEFAULT_DNS=1.1.1.1`.
5. **Firewall.** Detect `ufw` (matches `infra/wg-easy/README.md`'s existing
   assumption); if present, allow `51820/udp` from anywhere (that's the
   public WireGuard port, meant to be open) and `51821/tcp` scoped to
   `--backend-ip` if given, else open to all with a printed warning. If
   `ufw` isn't present, skip firewall configuration and warn — provisioning
   still proceeds (the compose file's own port binding is the fallback
   protection), it just isn't hardened.
6. **Start the stack.** `docker compose up -d` in the remote directory,
   then poll `GET http://<host>:51821/api/release` with the password from
   step 3 in the bare `Authorization` header (the real wg-easy v14
   contract this repo already reverse-engineered and documented) until it
   returns 200 or a timeout (e.g. 60s) is hit. A non-responding node after
   the timeout is reported as failed for that host — the script moves to
   the next host rather than aborting the whole run.
7. **Register locally.** If step 3 generated a NEW password (no existing
   `WG_KEY_<COUNTRYCODE>` line was found), append
   `WG_KEY_<COUNTRYCODE>=<generated-password>\n` to `apps/server/.env`. If
   step 3 reused an existing password, this step is a no-op — the line is
   already there. Either way, the script never overwrites an existing
   `WG_KEY_<COUNTRYCODE>` line, so a re-run can't silently invalidate a
   node's credentials out from under a running tunnel.
8. **Upsert the `Node` row.** Same idempotent pattern
   `apps/server/scripts/seed-node.ts` already established: reuse that
   script's `basePrisma` upsert-by-`publicEndpoint` logic (extract the
   shared upsert helper so both scripts call the same function rather than
   duplicating it — see Refactor note below) with
   `publicEndpoint = "<host>:51820"`, `wgEasyUrl = "http://<host>:51821"`,
   `wgEasyApiKeyRef = "WG_KEY_<COUNTRYCODE>"`, plus the country metadata
   from the input entry.

### Output

A per-host result table printed at the end (host, country, status:
provisioned/updated/failed, and the failure reason if any) — mirrors the
existing project convention of clear command-line feedback
(`seed-node.ts` already prints `Seeded node <uuid> (Germany, ...)`). Exit
code non-zero if any host failed, zero only if every host succeeded — so
the command is safe to wire into a future CI/deploy step without silently
swallowing partial failures.

### Refactor note: shared node-upsert helper

`apps/server/scripts/seed-node.ts` currently has its upsert-by-endpoint
logic inline. Extract it into a small shared function (e.g.
`apps/server/scripts/lib/upsert-node.ts`) that both `seed-node.ts` and
`provision-nodes.ts` import, so the two entry points (manual single-node
seed vs. batch VPS provisioning) share one source of truth for what "a
correctly registered node" means in the database. This is a small,
targeted refactor of code the current work already touches — not a
speculative abstraction.

## Error handling

- **Per-host isolation.** One host's SSH failure, Docker install failure,
  or healthcheck timeout does not stop the batch — it's recorded as
  failed and the script continues to the next host. This matches the
  reality of provisioning across independent, unreliable VPS providers.
- **Zod validation of `nodes.json`** happens once, upfront, for the whole
  file — a malformed entry fails the run before any SSH connection is
  attempted, since there's no reasonable partial-success story for "the
  input itself is broken."
- **`.env` write is append-only and idempotent-by-key** — never overwrites
  an existing `WG_KEY_*` line, so re-running the script can't silently
  invalidate a node that's currently serving live connections.
- **Prisma upsert reuses the exact idempotency guarantee**
  `seed-node.ts` already has and this repo already relies on (safe to
  re-run, converges rather than duplicates).

## Testing

This is an imperative infra script that talks to real SSH/Docker/HTTP
endpoints — not a candidate for the project's existing Vitest unit-test
style (which covers pure service logic against fakes, per
`apps/server/src/modules/*/_tests/`). Testing strategy:

- **Unit-test the pure pieces**: the Zod schema validation for
  `nodes.json`, the `.env` line-append idempotency check (given file
  contents + a key, does it correctly decide skip-vs-append), and the
  shared node-upsert helper's input→Prisma-args mapping (same style as the
  existing `nodes.service.test.ts` — a fake Prisma object, assert the
  correct `where`/`create`/`update` shape). These are pulled out as small
  named functions specifically so they're unit-testable in isolation from
  the SSH/network orchestration.
- **No automated test for the SSH/Docker/wg-easy orchestration itself** —
  that's exercised manually against a real VPS (or the existing local
  docker-based wg-easy container this repo already uses for E2E
  verification) before this is considered done, the same way Stage 1's
  Task 18 E2E was verified by hand against a live node rather than through
  an automated integration suite.

## Open questions for the plan phase

1. **`--backend-ip` persistence**: since the project owner doesn't have
   the backend's IP yet, should the script remember the last-used
   `--backend-ip` (e.g. in a local dotfile) so a later re-run to *tighten*
   the firewall doesn't require re-typing it, or is re-passing it each
   time acceptable? Leaning toward "just re-pass it, one flag is not a
   burden" — flagging for confirmation rather than deciding unilaterally.
