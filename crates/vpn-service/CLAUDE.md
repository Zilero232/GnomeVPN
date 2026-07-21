# CLAUDE.md — crates/vpn-service

Guidance for the privileged service. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

Runs as **LocalSystem** on Windows. Owns the wintun adapter, the routing table, DNS and the kill-switch firewall rules — everything that would otherwise force a UAC prompt on the GUI.

## Layout

```text
src/
├── main.rs          # install / uninstall / run
├── service/         # SCM registration and lifecycle
├── pipe/
│   ├── server.rs    # named pipe, ACL, event pump
│   └── session.rs   # request handling, decoupled from transport
└── tunnel/
    ├── engine.rs    # wintun + tun2proxy, feeds traffic to xray
    ├── xray.rs      # xray.exe config, spawn, supervision
    ├── tunio.rs     # AsyncDevice -> AsyncRead/AsyncWrite, byte counters
    ├── route.rs     # routing table
    ├── supervisor.rs # owns the single tunnel
    └── mod.rs       # spawn + retry
```

## How the tunnel is built

Reality's whole point is that the TLS handshake is *real*, so the crypto stays
in Xray-core rather than being reimplemented here — a hand-rolled handshake
would differ from a genuine browser's and become exactly the fingerprint the
protocol exists to avoid.

So the service runs `xray.exe` as a child process with a SOCKS inbound on
loopback, opens the wintun adapter, and hands both to
[`tun2proxy`](https://crates.io/crates/tun2proxy), which owns the userspace
TCP/IP stack, the SOCKS5 client and the UDP relay. `xray.exe` must sit next to
the service binary.

`Args.setup(false)` is deliberate: the adapter and its routes are ours, and
letting tun2proxy configure them too would have it fight `route.rs` over the
routing table.

Byte counters live in `tunio.rs` rather than coming from tun2proxy, whose only
traffic API is an `unsafe extern "C"` callback. Counting at the device is
equivalent — every byte of the tunnel crosses it — and keeps the crate free of
`unsafe`.

The SOCKS port is bound to `127.0.0.1` on a random port **with a random
username and password**. Any local process could otherwise use it as a free
exit through the tunnel. Its config file holds the user id, so it is written
into `C:\ProgramData\GnomeVPN`, never into the shared temp directory.

## The security boundary

**Any local process can open the pipe.** The service can rewrite the system's routes. Without validation, malware would ask it to route all traffic through its own server, and it would comply.

Two defences, both load-bearing:

1. **`PIPE_SDDL`** in `pipe/server.rs` — interactive users get read/write only, never `GA` (which includes the right to rewrite the ACL). Everyone and anonymous get nothing. Low-integrity processes are blocked.
2. **`validate_tunnel_config`** in [`../vpn-ipc`](../vpn-ipc/) — a literal server address must be public (never loopback or LAN), the user id a real UUID, the Reality key base64url of the right length, the fingerprint one of the known browser profiles.

Changing either one changes what a hostile local process can do. Treat them as such.

There is no Authenticode signature check yet — the project has no certificate. When one is bought, the client's signature should be verified on connect.

## Routing

The tunnel installs **half routes** — `0.0.0.0/1` and `128.0.0.0/1` — and never touches the default route. Deleting `0.0.0.0/0` wipes the physical gateway and kills the user's internet. This happened once already.

LAN subnets are routed back through the physical gateway so printers and NAS keep working. The tunnel's own subnet is excluded from that (`covers_tunnel`) — `10.8.0.2` falls inside `10.0.0.0/8`, and a naive exclusion breaks the tunnel.

## Health of a tunnel

`Connected` fires once Xray has its inbound open and the routes are in place —
not on the first data packet, which added a 13-second delay before the UI
updated. The engine keeps polling `try_wait()` on the child: if `xray.exe` dies,
the tunnel must fail rather than sit there with routes pointing into nothing.

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

Behaviour under LocalSystem cannot be tested from a normal shell — install the service and read `C:\ProgramData\GnomeVPN\service.log`.
