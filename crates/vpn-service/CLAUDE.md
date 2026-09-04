# CLAUDE.md — crates/vpn-service

Guidance for the privileged service. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

Runs privileged on all three desktop platforms — **LocalSystem** on Windows, **root** under launchd on macOS and systemd on Linux. Creating the TUN adapter and editing the routing table needs those rights, which is why this process exists at all — the GUI stays unprivileged.

## Layout

```text
src/
├── main.rs          # install / uninstall / run
├── service/
│   ├── install.rs      # Windows: SCM registration
│   ├── runner.rs       # Windows: SCM lifecycle
│   ├── install_unix.rs # launchd plist / systemd unit
│   └── runner_unix.rs  # signal handling, logging
├── pipe/
│   ├── server.rs    # Windows: named pipe, SDDL, event pump
│   ├── uds.rs       # Unix: socket, peer-uid check, event pump
│   └── session.rs   # request handling, decoupled from transport
└── tunnel/
    ├── engine.rs    # spawns sing-box, waits for the adapter, emits events
    ├── singbox.rs   # config file, process, logs
    ├── adapter.rs   # interface state and byte counters via netdev
    ├── supervisor.rs # owns the single tunnel
    └── mod.rs       # spawn + retry
```

Everything outside `service/` and the two transport files is shared: `session`,
`supervisor`, `engine`, `singbox`, `adapter` and the retry loop have no
platform branches beyond a path or a signal.

## What differs per platform, and nothing else

|              | Windows                              | macOS                                   | Linux               |
| ------------ | ------------------------------------ | --------------------------------------- | ------------------- |
| Transport    | `\\.\pipe\gnomevpn-service`          | `/var/run/gnomevpn/service.sock`        | same                |
| Caller check | `PIPE_SDDL`                          | peer uid                                | peer uid            |
| Registration | SCM                                  | launchd daemon                          | systemd unit        |
| Config dir   | `%ProgramData%\GnomeVPN`             | `/Library/Application Support/GnomeVPN` | `/var/lib/gnomevpn` |
| Logs         | `%ProgramData%\GnomeVPN\service.log` | `/Library/Logs/GnomeVPN`                | `/var/log/gnomevpn` |
| TUN name     | `gnomevpn0`                          | kernel picks `utunN`                    | `gnomevpn0`         |

**macOS ignores `interface_name`.** The kernel numbers utun devices itself, so
looking the adapter up by name finds nothing and the tunnel would never report
`Connected`. `adapter::find` falls back to matching the interface that carries
`TUNNEL_ADDRESS` — keep that fallback.

**sing-box is always asked to stop before it is killed.** It installs
pf/nftables rules, WFP filters and routes; killing it outright leaves them
behind, and a leaked default route pointing into a tunnel that no longer exists
is exactly the class of breakage `route delete 0.0.0.0` caused — the user simply
sees that the internet stopped working. `Singbox::stop` asks first, waits
`SHUTDOWN_GRACE`, then kills. Unix sends SIGTERM; Windows has no such signal, so
it posts a close request with `taskkill` **without** `/F`. `reap_orphans` is the
one place that still forces the issue, and only for processes already orphaned.

The config directory is `0700`: it holds the tunnel password.

## How the tunnel is built

The service runs **`sing-box.exe`** as a child process and does nothing else to
the network itself. sing-box owns the wintun adapter, the routing table and the
Hysteria2 connection; the config file is the whole interface between us.

That split is what makes per-app routing possible. Windows cannot redirect a
connection based on the process that opened it without a kernel callout driver
(`FWPM_LAYER_ALE_BIND_REDIRECT`), which needs an EV-signed driver. sing-box
sidesteps the problem: it pulls **all** traffic into the TUN and opens the
outgoing connection itself, so the choice between the tunnel and a direct
connection is an ordinary userspace decision.

`build_singbox_config` lives in [`../vpn-ipc`](../vpn-ipc/) and turns a
`TunnelConfig` plus the selected executables into that config:

```json
"route": {
  "rules": [
    { "action": "sniff" },
    { "action": "hijack-dns", "protocol": "dns" },
    { "action": "route", "ip_is_private": true, "outbound": "direct" },
    { "action": "route", "process_path": ["…chrome.exe"], "outbound": "direct" },
    { "action": "route", "process_name": ["chrome.exe"], "outbound": "direct" }
  ],
  "final": "proxy"
}
```

The first three rules are **load-bearing and must stay in this order**, straight
from sing-box's own TUN-client reference. Drop either of the middle two and the
whole network breaks, not just split:

- `hijack-dns` pulls app DNS queries into sing-box's resolver. Without it a
  program pointed at `8.8.8.8` sends real UDP/53 that gets routed like any other
  packet — to `final: proxy` before the tunnel is up — and every lookup hangs.
- `ip_is_private → direct` keeps the LAN and the default gateway reachable. Miss
  it and `strict_route` firewalls the router itself: "nothing loads, the network
  is broken." A live tunnel produced exactly that once these two were absent.

The TUN inbound also carries `route_exclude_address` for loopback + all RFC1918
(`127/8`, `10/8`, `172.16/12`, `192.168/16`). The `ip_is_private → direct` rule
alone was not enough on Windows: `strict_route` installs WFP filters that grab
local traffic _before_ the route rule runs (the docs warn it "may interfere with
VirtualBox"). Connecting the tunnel then killed the dev server's connection to a
local Docker Postgres (`localhost:5433` → the WSL2 bridge on `172.19.x`) with
`Connection terminated unexpectedly`. `route_exclude_address` keeps those ranges
out of the TUN entirely, which is also just correct — loopback and LAN should
never egress through the tunnel.

Each selected app emits **two** rules — one matching the full `process_path`,
one matching the basename `process_name`. sing-box ORs rules together, so a
running process whose real path differs from the scanned shortcut (wrong casing,
a versioned Chrome path, a launcher stub) is still caught by the bare
`chrome.exe`. Matching by path alone silently failed for exactly that reason.

**DNS must follow the traffic, in both directions.** An app resolves where it
connects, or it dials an address its route cannot reach. `dns()` mirrors the same
path+name pair into `dns.rules` and flips both the rule server and `dns.final`
with `apps_mode`: under `Disallowed` the listed apps get `dns-local` while
`final` stays on the tunnel; under `Allowed` they get `dns-tunnel-0` while
`final` drops to `dns-local`.

Getting only the `Disallowed` half right is a bug that hides for months. With
`Allowed`, the whole machine used to resolve through the tunnel while its traffic
went direct — a game then resolved its server via the exit node, got a
region-specific address, and connected to it from the user's real IP. The server
saw a session opened from one region and packets arriving from another and cut
it. It reads as a random mid-game disconnect, not as a DNS bug, because it only
fires when the balancer hands back a region-locked address.

Apps routed into the tunnel are also **rejected on IPv6** (`action: reject`,
`ip_version: 6`, matched on the same path+name pair). The TUN carries an IPv4
address only, so without that rule a dual-stack host silently opens an IPv6
connection outside the tunnel — the same split-identity break, by another route.
The reject is scoped to the listed apps, never global: bypassed apps keep their
IPv6.

**Excluding an app from the tunnel does not keep it out of the TUN.** `auto_route`
pulls every packet on the machine into `gnomevpn0`; the rules only decide which
outbound it leaves by. A bypassed app still crosses the TUN stack, so that stack
is on the hot path for traffic the user believes is untouched.

That is why `stack` is `system` and not `gvisor`. gVisor is a userspace TCP/IP
implementation — fine for web traffic, but it meters thousands of small UDP
datagrams a second, and `endpoint_independent_nat` is off by default there while
every other stack has it. Game protocols depend on that NAT behaviour, so on
gVisor their translations kept breaking: World of Tanks froze even with only
Chrome selected, while WireSock — which never touches a packet it was not asked
to proxy — ran it fine. `udp_timeout` is raised to `5m` for the same reason: the
default expires a session that idles between rounds.

With no split apps, `final` is `proxy` and everything goes through the tunnel.
The same rule engine also accepts domain and CIDR rules, so any future routing
policy belongs in that config rather than in Rust.

The config is written into the per-platform directory in the table above, never
into the shared temp directory — it holds the tunnel password.

**Android does not use any of this.** It still runs `hysteria` under
`tun2proxy` inside `apps/tauri`, because `VpnService` hands the app a descriptor
rather than letting a separate process own the interface. `build_hysteria_config`
stays in `vpn-ipc` for that reason.

## The security boundary

**Any local process can open the pipe.** The service spawns a process that rewrites the system's routes. Without validation, malware would ask it to route all traffic through its own server, and it would comply.

Two defences, both load-bearing:

1. **`PIPE_SDDL`** in `pipe/server.rs` — interactive users get read/write only, never `GA` (which includes the right to rewrite the ACL). Everyone and anonymous get nothing. Low-integrity processes are blocked.
2. **`validate_tunnel_config`** in [`../vpn-ipc`](../vpn-ipc/) — a literal server address must be public (never loopback or LAN), and `validate_split_apps` rejects paths that are not absolute executables.

Changing either one changes what a hostile local process can do. Treat them as such.

There is no Authenticode signature check yet — the project has no certificate. When one is bought, the client's signature should be verified on connect.

## Health of a tunnel

`Connected` fires once the `gnomevpn0` adapter is up, not on the first data
packet — waiting for traffic added a 13-second delay before the UI updated.
`adapter.rs` answers both that question and the byte counters through
[`netdev`](https://crates.io/crates/netdev); its calls are blocking, so the
engine wraps them in `spawn_blocking`.

The engine keeps polling `try_wait()` on the child: if `sing-box.exe` dies, the
tunnel must fail rather than sit there with an adapter pointing into nothing.

## The binary is locked while running

`cargo build` succeeds and silently keeps the old file. `apps/tauri/scripts/build-service.mjs` catches this by comparing mtimes. Stop the service before building:

```powershell
sc.exe stop GnomeVPNService
```

## Verification

```bash
cargo clippy -p gnomevpn-service --all-targets
cargo fmt --all --check
```

Behaviour under LocalSystem cannot be tested from a normal shell — install the
service and read `C:\ProgramData\GnomeVPN\service.log`. sing-box writes its own
log next to it as `singbox.log`, and `sing-box.exe check -c <config>` validates
a generated config without starting anything.
