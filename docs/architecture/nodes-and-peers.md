# Nodes and peers

How the server talks to a node's 3x-ui panel, how a peer becomes a panel client,
and how device limits and liveness are enforced. Code:
`apps/server/src/lib/xray/` and `apps/server/src/modules/peers/`.
Part of the [documentation index](../README.md).

## One module talks to the panel

`peers` owns everything that talks to the node's panel on a peer's behalf —
creating a client, releasing it, restarting the core, building the tunnel config.
`subscription-link` sits on top and never touches `XrayClient` directly: it
calls `PeersService.issueAndPersist`, which is where the "create → persist →
roll back on failure" dance is written once.

The only peers issued today are `kind: 'config'` peers named `incy`, one per
node and protocol, created by the subscription feed. `PeerKind` still has a
`session` value and `peerClientName` still knows its prefix, but nothing in the
server creates a session peer any more.

**The feed restarts each node once, not once per client.** `SubscriptionPeersService.ensureNode`
issues every missing peer on a node with `deferRestart`, then calls
`PeersService.restartCore` once for that node. If the restart fails it deletes
the rows it just wrote, so the next fetch issues them again rather than handing
out clients the running core has never heard of.

`XrayClient` itself is a **facade over separate concerns**, each its own folder:

```text
lib/xray/
├── panel-client/      # the 3x-ui HTTP API, and nothing above it
├── inbounds/          # find/create an inbound, shape its payload — used by both protocols
├── protocol-clients/  # list/create/delete clients of one inbound, shared by both protocols
├── hysteria/          # Hysteria2 clients: create, delete, enable
├── vless/             # VLESS + Reality clients, in their own inbound
├── serialize/         # serializeByKey: one write at a time per node
└── xray.ts            # the facade the rest of the server calls
```

The name is historical and misleads: `XrayClient` talks to the **3x-ui panel**,
not to Xray-core. The panel runs the core; Hysteria2 is an inbound inside it,
which is why a fix released for the standalone `apernet/hysteria` server does not
reach these nodes.

It was one 300-line class holding every protocol, and that is how a restart bug
hid in it: each inbound needs the core restarted after its own kind of change,
and with the paths interleaved one was easy to miss. Splitting by protocol makes
each rule visible where it applies.

Both protocols are ordinary panel clients, so one `deleteClient` removes either.
`peerClientNames` (`modules/peers/lib/peer-name`) still derives the
pre-protocol name alongside the current one, so a peer written before the
protocol became part of the key can still be found on its node.

**Every write path parses settings strictly.** `readSettings` and `readClients`
return `null` on malformed JSON, and the caller refuses rather than rewriting:
`rewriteInbound` will not update an inbound whose clients it cannot read, and
`ProtocolClients` will not add to one whose settings it cannot parse. A tolerant
parse is what once erased a node's clients: it produced an empty settings object,
which was then written back over the real one.

## Device limits

A subscription covers `DEFAULT_DEVICE_LIMIT` (2) devices, plus whatever
`extraDevices` the user has bought; `activeDeviceLimit` in `common/lib/period`
is the one place that reads it off a subscription, and it returns the default
whenever the period has lapsed. **The limit is enforced by the device registry,
not by the panel** — each device fetching the feed is registered and issued keys
of its own, and a device past the limit is refused in the feed. The whole
mechanism, and why the panel's per-client `limitIp` could not do it, is in
[devices.md](devices.md).

`limitIp` is still set on every client, as `DEVICE_PEER.ipsPerClient` (2) for a
device's keys: a net against one device's config being copied elsewhere, not a
seat count. 3x-ui counts the IPs through Xray's online-stats API and has
fail2ban drop the oldest IP over the limit — it bans the address for 30 minutes,
it does not refuse the new connection.

**A restored peer gets the limit it was issued with.** `restoreMissing` recreates
a client the node has lost: a device's peer with `DEVICE_PEER.ipsPerClient`, a
shared legacy `incy` peer with its owner's `activeDeviceLimit` — which is why
`RECONCILE_PEER_SELECT` still pulls `user.subscription`. Revoked peers are never
restored; `releaseRevoked` deletes them first.

**Liveness comes from the Xray core.** `onlineEmails()` reads
`/panel/api/clients/onlines` — the sessions the core itself proxies. A node that
does not answer returns `null` rather than an empty set, which is the difference
between _unknown_ and _idle_: `collectOrphans` only reaps a client the node
positively reports as offline, never one it has no evidence about. Orphans are
collected by the weekly `reconcile-peers` pass only (see
[scheduler.md](scheduler.md)); the five-minute pass does not ask for onlines.

**The client email is scoped by protocol, and it has to be.** The database is
unique on `(userId, kind, name, nodeId, protocol)` — five fields — while the
email was built from four. One user issuing two protocols under the same name on
the same node therefore produced two rows and one email, and
`clientEnabledByEmail` merges every protocol into a single map keyed on it: one
client overwrote the other, and `syncEnabled` then disabled a live config against
the wrong client's state.

**Releasing a peer deletes the row first and the panel client afterwards.**
Deleting a client is an HTTP call to the node, so waiting for it means a slow or
unreachable panel holds up the response. `releaseDetached` removes the rows, then
fires the panel calls detached; a leaked client is collected by `collectOrphans`
on the next weekly sweep anyway, while a stuck release would be visible
immediately.

## The panel does not restart its own core

Every mutating panel endpoint ends in `SetToNeedRestart()`, which only sets a
flag — nothing acts on it, and `CheckXrayRunningJob` restarts on a crash, not on
that flag. Any change to clients needs an explicit `restartCore()`, or the
running core never learns about it: the client sits in the panel's database
while the core has never heard of it, and the very first connection fails auth
with a 404.

That restart drops every live session on the node, so batch it: one restart at
the end of a pass, only when something actually changed. `reconcile-peers`
restarts once per node per pass, and the feed once per node per fetch
(`deferRestart`, above).
