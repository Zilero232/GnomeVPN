# Provisioning a node

Adding a VPN node, step by step. Why the pipeline is shaped the way it is:
[architecture/provisioning.md](../architecture/provisioning.md). Part of the
[documentation index](../README.md).

## What it does

`bun run provision:nodes` reads `nodes.json` from the repo root (gitignored — it holds root SSH passwords; `nodes.example.json` next to it is the committed template) and sets each host up over SSH: install Docker, jq and fail2ban, open the tunnel and panel ports, ship the 3x-ui compose stack, configure the panel, generate the TLS cert and the Reality keys, install both inbounds, register the node. When every host succeeded it prunes nodes missing from `nodes.json` and pushes the result to production.

It runs on a workstation, never in CI: the node credentials live in
`nodes.json` and `.env.nodes`, the production VPS credentials in the root
`.env` (`PROVISION_SSH_*`), and adding a node is a decision a person makes, not a
commit.

## Running it

1. Copy `nodes.example.json` to `nodes.json` and fill in each host, its SSH
   credentials (`sshUser`, `sshPassword`), the country, `countryCode` and city.
   A node left out of the file is **removed** on the next run, together with its
   keys.
2. Make sure the root `.env` has a `DATABASE_URL` the script can write to — the
   node rows are written there first — and `PROVISION_SSH_HOST` (plus
   `PROVISION_SSH_USER`, `PROVISION_SSH_PASSWORD` or `PROVISION_SSH_KEY`, and
   `PROVISION_DEPLOY_PATH` when it is not `/opt/gnomevpn`) pointing at the
   production VPS. Without `PROVISION_SSH_HOST` the production sync is skipped
   and the nodes exist only in the local database.
3. Run it and watch the narration — every step says what it is about to do and
   what it found, so a stuck `apt-get` is visible as one:

   ```bash
   bun run provision:nodes
   ```

4. The run writes one `XRAY_KEY_<CC>` / `XRAY_PANEL_<CC>` pair per node into
   **`.env.nodes`**, then copies that file and the node rows to the VPS over SSH
   and restarts the server there. The server loads `.env.nodes` beside `.env`;
   the `node` table stores only the variable's name (`apiTokenEnvVar`), never the
   secret.

Re-running it on a node that is already set up is safe: every step is
idempotent, an existing inbound is updated rather than replaced, and its client
list is preserved. If a node's Reality key had gone missing and had to be
regenerated, the run says so: every VLESS entry issued for that node before then
is dead.

## Verifying it

Verify end-to-end, as [architecture/provisioning.md](../architecture/provisioning.md#what-a-run-does-to-a-node)
explains: run a real hysteria client against the node and confirm a request
returns the node's own IP, ideally from the target network. Then fetch a
subscription and check the node appears in it, under both `🇳🇱 Netherlands` and
`🇳🇱 Netherlands · TCP` when the Reality keys were written.

A node provisioned before a field existed (`certFingerprint`,
`realityPublicKey`, `realityShortId`) keeps working with what it has; re-provision
it to pick the new field up.
