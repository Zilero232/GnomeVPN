# CLAUDE.md — crates/vpn-service

Guidance for the privileged service. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

Runs as **LocalSystem** on Windows. Creating the wintun adapter and editing the routing table needs administrator rights, which is why this process exists at all — the GUI stays unprivileged.

## Layout

```text
src/
├── main.rs          # install / uninstall / run
├── service/         # SCM registration and lifecycle
├── pipe/
│   ├── server.rs    # named pipe, ACL, event pump
│   └── session.rs   # request handling, decoupled from transport
└── tunnel/
    ├── engine.rs    # spawns sing-box, waits for the adapter, emits events
    ├── singbox.rs   # config file, process, logs
    ├── adapter.rs   # interface state and byte counters via netdev
    ├── supervisor.rs # owns the single tunnel
    └── mod.rs       # spawn + retry
```

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

Each selected app emits **two** rules — one matching the full `process_path`,
one matching the basename `process_name`. sing-box ORs rules together, so a
running process whose real path differs from the scanned shortcut (wrong casing,
a versioned Chrome path, a launcher stub) is still caught by the bare
`chrome.exe`. Matching by path alone silently failed for exactly that reason.

A bypassed app also needs its **DNS** resolved off the tunnel, or every lookup
still traverses the proxy and leaks. `dns()` mirrors the same path+name pair into
`dns.rules` pointing at `dns-local`, so a disallowed app is direct end to end.

With no split apps, `final` is `proxy` and everything goes through the tunnel.
The same rule engine also accepts domain and CIDR rules, so any future routing
policy belongs in that config rather than in Rust.

The config is written into `C:\ProgramData\GnomeVPN`, never into the shared temp
directory — it holds the tunnel password.

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
