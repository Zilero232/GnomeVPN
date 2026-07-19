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
    ├── engine.rs    # boringtun loop, keys, handshake
    ├── route.rs     # routing table
    ├── killswitch.rs
    ├── supervisor.rs # owns the single tunnel
    └── mod.rs       # spawn + retry
```

## The security boundary

**Any local process can open the pipe.** The service can rewrite the system's routes. Without validation, malware would ask it to route all traffic through its own server, and it would comply.

Two defences, both load-bearing:

1. **`PIPE_SDDL`** in `pipe/server.rs` — interactive users get read/write only, never `GA` (which includes the right to rewrite the ACL). Everyone and anonymous get nothing. Low-integrity processes are blocked.
2. **`validate_tunnel_config`** in [`../vpn-ipc`](../vpn-ipc/) — the endpoint must be public, the tunnel address private, `allowedIps` exactly the supported set.

Changing either one changes what a hostile local process can do. Treat them as such.

There is no Authenticode signature check yet — the project has no certificate. When one is bought, the client's signature should be verified on connect.

## Routing

The tunnel installs **half routes** — `0.0.0.0/1` and `128.0.0.0/1` — and never touches the default route. Deleting `0.0.0.0/0` wipes the physical gateway and kills the user's internet. This happened once already.

LAN subnets are routed back through the physical gateway so printers and NAS keep working. The tunnel's own subnet is excluded from that (`covers_tunnel`) — `10.8.0.2` falls inside `10.0.0.0/8`, and a naive exclusion breaks the tunnel.

## Kill switch

Firewall rules via `netsh`, not WFP: WFP filters are bound to the process and vanish if the service crashes. A kill switch that disappears on crash is not a kill switch.

The trade-off is the opposite failure: if the service dies uncleanly the rules survive and the user has no internet until it restarts. That is the intended direction — no connectivity beats a silent leak. Off by default.

## Health of a tunnel

`Connected` fires when boringtun reports a completed handshake (`tunn.stats().0.is_some()`), not on the first data packet. Waiting for data added a 13-second delay before the UI updated.

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
