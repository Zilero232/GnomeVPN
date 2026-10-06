# Protocols and the client

Why the tunnel is Hysteria2 first, why VLESS + Reality rides beside it, and why
the user installs INCY rather than an app of ours. Part of the
[documentation index](../README.md).

## Why Hysteria2 leads

The project ran on VLESS + XTLS-Reality first. Measured on a Russian ISP in this
repo's history: the TSPU actively fingerprints the REALITY handshake over _any_
TCP port and kills the connection within minutes of real traffic — fresh ports
work, "burnt" ports don't, and switching donor or transport doesn't help. UDP is
not policed the same way (plain WireGuard on UDP/51820 passes on the same
network), so the tunnel moved to Hysteria2: QUIC over UDP, which the TSPU lets
through where it drops REALITY.

Hysteria2 masquerades as an HTTP/3 site (`masquerade: proxy` to `MASQUERADE_HOST`)
and needs a TLS cert on the node — a self-signed cert generated per node. The
subscription pins its SHA-256 as `pinSHA256`, read off the node at provisioning
and stored as `certFingerprint`. **`insecure=1` is not an option for an xray
core any more**: newer cores reject the parameter outright with `The feature
"allowInsecure" has been removed`, and the tunnel refuses to start. Pinning is
also stricter than what it replaces — it names one certificate rather than
accepting any. sing-box clients cannot pin, so they still get `insecure=1`; how
the feed tells the two apart is in
[subscription-feed.md](subscription-feed.md#certificates-pin-or-skip).

Each client has its own `auth` password; that password is the tunnel credential,
stored per peer.

The Reality inbound is different on both counts: it borrows a real site's
certificate rather than presenting its own, so its entries are never marked
insecure, and its credential is a UUID rather than a password.

## Two protocols, one subscription

Hysteria2 is the default: QUIC holds up under packet loss where TCP collapses,
which is what makes it good on mobile. But QUIC is UDP, and some networks —
corporate Wi-Fi, a few carriers, most hotels — drop UDP wholesale. There the
tunnel cannot come up at all.

VLESS + Reality is the way out: TCP on 443, wearing the TLS handshake of a real
third-party site. The two share port 443 without conflict because one is UDP and
the other TCP.

Both ride in the same subscription. The user sees `🇳🇱 Netherlands` and
`🇳🇱 Netherlands · TCP` and picks whichever connects; nothing has to be
configured.

**This repo has measured REALITY failing before.** The TSPU fingerprinted the
handshake over any TCP port and killed sessions within minutes — that is why the
project left it in the first place. It is here as a fallback for blocked UDP, not
as a claim that it survives active probing. If it turns out dead again, the
Hysteria2 entry is still first in the list.

Which nodes advertise VLESS is decided per node by `protocolsFor` — see
[subscription-feed.md](subscription-feed.md#issuing-the-peers).

## Why INCY and not our own client

The repo used to carry a Tauri desktop shell, a privileged Rust service on three
operating systems and an Android tunnel — around 2,500 files of platform code.
All of it is gone. The client is now INCY, a free third-party app that exists on
iOS, Android, Windows, macOS, Linux, Android TV and Apple TV.

We give it one URL. It fetches a base64 list of `hysteria2://` and `vless://` URIs, reads the traffic
counters and the renewal date out of the response headers, and renders our name,
our support link and our servers. Nothing about the tunnel changed — the nodes,
the panel and the peer model are the same.

What this bought: iOS and TV, which we never had and could not have shipped
cheaply. What it cost: the client is not ours, and the user installs an app with
someone else's name. The site says so plainly rather than hiding it — see the
`about` and `faq` namespaces in the locales.

The subscription URL is a standard format, so it also works in Hiddify, v2rayNG,
Streisand and the rest. That is deliberate: a user who dislikes INCY is not stuck.
