# The subscription feed

How the VPN reaches a user: one URL, fetched by INCY or any other client, that
renders the server list and the subscription state. Code:
`apps/server/src/modules/subscription-link/`. Part of the
[documentation index](../README.md).

## The subscription is the product surface

`subscription-link/` is the whole delivery path. Three routes:

| Route                            | Auth     | Purpose                                             |
| -------------------------------- | -------- | --------------------------------------------------- |
| `GET /subscription-link`         | session  | the user's URL plus its `incy://crypt1/…` deep link |
| `POST /subscription-link/rotate` | session  | mint a new token; the old URL dies immediately      |
| `GET /sub/:token`                | **none** | what INCY (or any other client) fetches             |

**The token is the credential.** INCY cannot log in, so the URL is all the
authentication there is: 32 random bytes, `base64url`, one row per user. That is
why rotation exists, and why the route sits on `/sub` rather than
`/subscription` — `/subscription/status` already lives there, and a token whose
value happened to be `status` would have shadowed it.

**The feed hands out servers only while the period is active.** The token
proves who is asking, not that they have paid: `SubscriptionLink` is created on
the first visit to the account page, before any trial or checkout, and issuing
would happily create an enabled client on every node for whoever holds it.
`SubscriptionFeedService.build` checks `isPeriodActive` first and answers an
empty list with the "no subscription" announce otherwise — the headers still go,
so INCY shows the state rather than an error. `expired-access` keeps its
six-hour grace (`WINDOW.configGraceHours`), but that grace is for a payer whose
renewal is late, not a substitute for this gate.

**`/sub/:token` is throttled tighter than the rest of the API.** Every valid
fetch is a round-trip to every node, so a leaked token in a loop is an
amplifier against the panels; `FEED.throttle` overrides the global limit on
that one route. INCY itself refetches every `UPDATE_INTERVAL_HOURS` (12), which
the `profile-update-interval` header tells it.

**The feed sends no ETag and `cache-control: no-store`.** Express hashes the
body alone, and a renewal changes only `subscription-userinfo` — the server list
is the same peers as before. A client holding the old ETag got `304` and kept the
old `expire` for good, so a paid subscription stayed "expired" in INCY and in
Hiddify alike. `etag` is off app-wide in `main.ts`; nothing in the API relied on it.

`@incy/link-encoder` builds the deep link. Its AES key ships inside every INCY
client, so the encryption hides the URL from scanners, not from people.

## Issuing the peers

`SubscriptionPeersService.ensureNode` ensures one `kind: 'config'` peer named
`incy` (`FEED.peerName`) per **node and protocol**, reusing
`PeersService.issueAndPersist`; `SubscriptionFeedService` then renders each as a
`hysteria2://` or `vless://` URI. **A node that fails to issue is logged and
skipped** — one unreachable node must not empty the user's whole server list.

Missing peers on a node are issued with `deferRestart` and the core is restarted
once afterwards through `PeersService.restartCore`. If that restart fails, the
rows just written are deleted and the node is served with only the peers it
already had; the next fetch issues the rest again. Why the restart is needed at
all: [nodes-and-peers.md](nodes-and-peers.md#the-panel-does-not-restart-its-own-core).

`protocolsFor` decides what a node advertises. Hysteria2 always; VLESS only when
the node carries `realityPublicKey` and `realityShortId`, which provisioning
writes. A node provisioned before Reality existed keeps serving Hysteria2 alone
rather than advertising a server the client can never reach.

**A Reality client is a UUID, not a password**, and needs `flow` alongside the
rest of the mandatory field set — `PanelClient.addVlessClient` writes all of it
for the same reason `addClient` does.

**`ensureVlessInbound` refuses to rewrite an inbound whose clients it cannot
read**, exactly like `updateInbound`. A re-provision that overwrote the client
list from the template would wipe every subscriber on that node.

`SubscriptionPeersService` owns the peer rows; `SubscriptionFeedService` owns
the response. Splitting them keeps the transaction and the retry out of the
path that only renders URIs.

`clientEnabledByEmail` must list **every** protocol the subscription issues.
It once listed Hysteria2 and WireGuard, and when WireGuard was removed a VLESS
client looked to `reconcile-peers` like a peer that had vanished from its node.

`lib/` under the module is split one folder per concern:

```text
lib/
├── announcement/      # the announce banner
├── client-links/      # the third-party clients and their import links
├── client-platform/   # what the User-Agent says the caller is
├── incy-headers/      # the response headers, with header-value/ and userinfo/
├── incy-uri/          # the server list, with hysteria2/ and vless/ beside it
├── server-name/       # the flag-and-country label both protocols share
├── subscription-token/
└── tls-mode/          # pin or skip verification, from the User-Agent
```

The two URI builders were one file once, which hid that they share nothing but
the server label — and that label is what keeps `🇳🇱 Netherlands` apart from
`🇳🇱 Netherlands · TCP` in the app's list.

**A builder that cannot produce a URI returns `null`, never `''`.** `vlessUri`
returned an empty string for a node without reality keys, and the feed filters
on `isNonNullish` — so the empty string survived into the feed and a client
parsing the list hit a blank entry.

## Certificates: pin or skip

**A self-signed node is pinned, not trusted blindly.** `hysteria2Uri` emits
`pinSHA256` from the node's `certFingerprint`.

**`pinSHA256` is 64 lowercase hex characters, and `openssl` does not print it
that way.** `openssl x509 -fingerprint -sha256` returns `AA:BB:CC:…` — uppercase,
colon-separated — and that is what `certFingerprint` holds, because provisioning
stores the command's output verbatim. A core compares the pin as a string, so the
colons alone make every match fail; 3x-ui shipped the same bug by sending base64.
`pinnedFingerprint` normalises on read rather than in the column, so nodes
provisioned before this keep working without a re-provision. A value that is not
a sha-256 is not pinned at all, and since the tunnel config's `insecure` is off
(`TUNNEL.insecure`), such an entry carries neither parameter — an xray core will
refuse the self-signed certificate until the node is re-provisioned.

**sing-box does not implement `pinSHA256` at all**, so Hiddify ignores it and then
refuses the node's self-signed certificate. A pinned entry therefore connects in
INCY and fails in Hiddify — the fix for that is a certificate Hiddify already
trusts, not a wider `insecure`.

**The two cores cannot be served the same URI, so the feed picks per client.**
`tlsMode` reads the `user-agent`: a sing-box client (`SING_BOX_AGENTS` — Hiddify,
NekoBox, Clash, Streisand, Shadowrocket…) gets `insecure=1`, everything else gets
`pinSHA256`. Never both — an xray core refuses to start when `insecure` appears
(`The feature "allowInsecure" has been removed`), which is the regression that
introduced pinning in the first place.

This costs the sing-box clients their protection against a substituted server:
they verify nothing. It is the same position the subscription was in before
2026-09-17, and it holds only until the nodes have real certificates. The real
fix is a domain per node plus Let's Encrypt — then nobody pins and nobody skips
verification — and it needs DNS records that do not exist yet.

An unknown or absent `user-agent` pins. A client we have not heard of is more
likely to be an xray core than not, and a pin that a client ignores is a failed
connection, while an `insecure` it ignores is a core that will not boot.

## Headers, traffic and the announce banner

**Headers carry everything the app displays.** `subscription-userinfo` holds the
expiry, `profile-title` the name, `profile-web-page-url` the account link,
`support-url` the support link when `SUPPORT_URL` is set. Any non-ASCII value
must be sent as `base64:<…>` — HTTP headers cannot carry UTF-8: a raw Cyrillic
`profile-title` or `announce` does not merely render wrong, it breaks the whole
response. `headerValue` decides that per value, so nothing has to remember it at
the call site.

**`hide-url: 1` is set, and it costs the account-page button.** It keeps the
token out of INCY's Share/Copy/QR, which is the point; the same flag also
suppresses whatever `profile-web-page-url` would render, so the button that
opens the account page does nothing while it is on. The header stays because
not handing a user a one-tap way to forward their own credential is worth more
than the link. Do not "fix" the dead button by dropping the flag.

`subscription-userinfo` carries the expiry as a Unix timestamp in seconds. When
there is no period to report it must be the literal `0` — not "no traffic used",
but an instruction to hide the traffic block entirely, which is what a user
without a period should see.

`upload`/`download` are the bytes the nodes have counted for this user's peers,
summed over every node by `SubscriptionPeersService.traffic` from the
`clientStats` the panel already returns with `/panel/api/inbounds/list`. `total`
stays `0` — it is the traffic **quota**, and the subscription has none. A node
that fails to answer contributes zero rather than failing the response, the same
rule the server list follows.

Traffic is read **after** the peers are issued, not alongside them: a peer the
panel has just been asked to create has no `clientStats` row yet.

`announce` is a banner the app shows on every fetch, and nobody writes it by
hand: `lib/announcement` derives it from what the request already knows. It
returns **one** message, because the header is one — the order is the priority.
A lapsed or missing subscription outranks everything, then an expiry inside
`EXPIRY_WARNING_DAYS`, then a node that has gone quiet, then a node added inside
`FRESH_NODE_DAYS`. Nothing to say returns `null` and the header is omitted rather
than sent blank.

**A down node is found through `lastHealthyAt`, not `isAvailable`.** Nothing
clears `isAvailable` — provisioning is the only thing that ever writes it — so a
dead node keeps serving in the list. `node-health` stamps `lastHealthyAt` every
minute, and a stamp older than `NODE_STALE_MINUTES` is what "down" means here. A
node that has never reported counts as down rather than as new.

The text is Russian, and only Russian: the subscription request carries no
`Accept-Language`, and INCY's User-Agent names the platform, not the locale.
Plurals and country lists go through `Intl.PluralRules` and `Intl.ListFormat`
rather than hand-rolled suffix rules.

The format is documented at <https://incy.gitbook.io/docs/docs-en> — the pages
that matter are `subscription-format` (headers, body) and `share-links`
(the exact `hysteria2://` query parameters).

## Any client, not only INCY

The feed is a standard base64 list, so Hiddify, v2rayNG, Streisand, NekoBox and
Clash Meta read it unchanged. `CLIENT_REGISTRY` in `packages/schemas/src/clients/`
is the single source: download URL, platforms, and an `import` entry where a
scheme is **documented** — `hiddify://import/<url>` takes the URL raw in the
path, `v2rayng://install-sub` and `clash://install-config` take it
percent-encoded in a query. Streisand and NekoBox publish no scheme, so they
carry `import: null` and the user pastes by hand; inventing a scheme yields a
button that opens nothing.

The server renders those into `clients` on `GET /subscription-link`
(`lib/client-links`), each with an `importUrl` — INCY's is the deep link. The
client only draws them — it holds icons and copy, never a URL.

**An import scheme only resolves on a touch device.** `hiddify://` and `clash://`
are registered by the mobile apps, so a desktop browser does nothing with them
and the button looks broken. `OtherAppsList` gates the import link behind
`(pointer: coarse)` and falls back to copying the URL — width is the wrong test,
because a tablet at any width resolves the scheme and a narrow desktop window
does not.

## Platform downloads

The INCY download links are `INCY_DOWNLOADS` in `packages/schemas`, and
`PLATFORMS` is built from it. The web client does not fetch them: `usePlatforms`
(`apps/client/entities/app/incy`) maps `PLATFORMS` straight from
`@gnomevpn/schemas`.

`GET /platforms` serves the same list for anyone else: anonymous, and cached for
a day (`PLATFORMS_CACHE_TTL_MS`) through `CacheInterceptor`, because it is a
constant rather than a query.

The desktop URLs point at `releases/latest`, so they follow INCY's current
release without a redeploy. Only a renamed artifact forces a change here.
