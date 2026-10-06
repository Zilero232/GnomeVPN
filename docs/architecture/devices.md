# Devices

How an account's device limit is enforced. Code: `apps/server/src/modules/devices`,
the feed in `modules/subscription-link`, the sweeps in `modules/scheduler`.

## Why the panel's IP limit was not enough

The limit used to be `limitIp` on each 3x-ui client, and every user had one client
per node **and per protocol**: Hysteria2 and VLESS on each node, each allowing
`deviceLimit` IPs. Two nodes made a two-device subscription an eight-device one,
and a home Wi-Fi counted as one device however many phones sat behind it. On top
of that, 3x-ui does not refuse the surplus connection: its job notices a third IP
every ten seconds and has fail2ban ban the _oldest_ one for 30 minutes — an IP
that may be a mobile carrier's CGNAT address shared by other customers on that
node.

Nothing in that scheme knows what a device is. The registry does.

## A device is what fetches the subscription

INCY sends a hardware id with every subscription request when HWID sending is on
(`x-hwid`, `X-Device-ID` on Android, plus `x-device-os`, `x-ver-os`,
`x-device-model`). The id survives a reinstall — Keychain on iOS, encrypted
preferences on Android — so it identifies the device, not the install.
`deviceIdentity` reads those headers and turns them into a key:

- `hwid:<UUID>` when a hardware id is present;
- `app:<name>` otherwise — another client (Hiddify, v2rayNG…), or INCY with HWID
  sending switched off, which the user can do. Every such install of one app on
  one account shares a key, so it is **one** device.

The second rule is what keeps the limit from being a toggle: switching HWID off
does not make a device invisible, it makes all of that user's HWID-less INCY
installs share one slot.

## Each device has keys of its own

A peer is issued per `(device, node, protocol)` and named `d-<12 hex of the
device id>`, so its panel email is unique to the device. Removing a device
revokes exactly its keys; the other devices keep theirs. `limitIp` on a device's
client is `DEVICE_PEER.ipsPerClient` (2) — no longer the seat count, only a net
against one device's config being copied to a third network.

## Admission happens in the feed

`DevicesService.admit` runs inside a serializable transaction, because two new
devices fetching at once would otherwise both see a free slot:

1. a known key refreshes its metadata and `lastSeenAt`, and is allowed when it
   holds one of the first `deviceLimit` slots by `createdAt` (ties by id, so the
   answer never flips);
2. an unknown key is registered only while the account has fewer than
   `deviceLimit` devices.

A refused device gets an empty list and the `deviceLimit` announcement naming the
account page and `/devices`; the `subscription-userinfo` headers still go, so
INCY shows the state rather than an error. Devices register only while the
period is active, so a lapsed account does not fill its slots.

Slots are not reclaimed automatically. A device that has gone quiet still holds
its slot until the user removes it — in the account page or with `/devices` —
because quietly evicting the oldest device would let the next phone in a
household take a slot from the owner's.

## Revocation converges through reconcile

Removing a device sets `revokedAt` and `state: disabled` on its peers and deletes
the device row; the peers keep their names so the node can still be told which
clients to delete. `reconcile-peers` runs `releaseRevoked` before everything
else: it deletes each revoked client the node still holds, and only then the
rows — so a node that is down when someone removes a device gets the deletion on
its next pass instead of keeping a key nobody can revoke. `restoreMissing` and
`syncEnabled` see only live peers, and the access sweeps (`setEnabledAll`,
`expired-access`) never touch a revoked one, or the restore half would re-enable
it.

A live session on a revoked key keeps going until it reconnects: Xray cannot end
one without restarting the core (see [pitfalls.md](pitfalls.md)).

## Shrinking limits and the old shared keys

**Over the limit.** `device-slots` runs every ten minutes. When the limit
shrinks — paid extras end with the period — the devices past it lose their
keys. They stay registered and come back on the next fetch once there is room
again.

**The shared `incy` peers retire in the weekly garbage collection.** Before the
registry every account had one set of `incy` peers shared by all its devices.
`releaseLegacy` deletes them in the `collect` pass of `reconcile-peers` — Sunday
04:17, the pass that already asks the node who is online and already restarts
the core — and only when both hold:

- the account has a device registered more than `LEGACY_PEER.graceHours` (48)
  ago, so its installs have had several 12-hour refreshes to pick up keys of
  their own;
- the node does not report that client online. A shared key carrying a session
  right now waits for next week rather than cutting it mid-stream, the same rule
  orphan collection follows.

Doing it there rather than on its own schedule costs no extra core restart — a
restart drops every tunnel on the node — and lands it at night. A device that
never refreshed loses the shared key then and connects again after one manual
refresh in the app.

## The owner hears about every change in Telegram

A linked chat is told, through `TelegramNotifyService.tell`, whenever the
registry changes under it — the feed never waits on any of it:

- **`deviceAdded`** — a new device registered: its title (`deviceTitle`: model
  or platform, then app), `N of LIMIT`, and what to do if it wasn't them
  (`/devices`, then `/rotate`). Registration happens once per device, so this
  needs no de-duplication; it doubles as a warning that the link has leaked.
- **`deviceBlocked`** — a device was refused at the limit. INCY retries on its
  own, so `FeedNoticeService` claims the notice on the link row
  (`blockedKey`, `blockedNoticeAt`) and says it once per device per
  `DEVICE_NOTICE.blockedRepeatHours` (24).
- **`devicesShrunk`** — `device-slots` revoked devices past a smaller limit; it
  names them. Revocation happens once, so the message does too.
- **`legacyRetired`** — the weekly pass removed the last shared `incy` key of the
  account: if some device stopped connecting, refresh the subscription in the
  app. Sent only once no shared key is left on any node.

The site shows the same rule on the Devices tab of the account page, and tells a
user whose INCY sends no HWID that every such install counts as one device until
HWID sending is switched on in INCY's subscription settings.

## What it does not stop

A user who exports a device's server configuration by hand and imports it
elsewhere shares that device's keys; the per-client IP limit is the only check
left there. `hide-url` keeps the subscription URL itself out of INCY's share
sheet ([subscription-feed.md](subscription-feed.md)).
