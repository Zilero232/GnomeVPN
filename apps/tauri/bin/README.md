# Native dependencies

Only `wintun.dll` (see below) makes it into git — everything else is downloaded by scripts.

`sing-box` is downloaded by a script for the current platform:

```bash
bun --filter @gnomevpn/tauri singbox          # if the file is not there yet
bun --filter @gnomevpn/tauri singbox --force  # re-download
```

The script is called from `predev` and `prebuild`, so normally there is no need to run it by hand.
The version is pinned in `scripts/fetch-singbox.mjs` — the same one must be written below in this
file.

`wintun.dll` is the only one that **lives in the repository**: wintun.net has no release feed, the
URL may disappear, and the license explicitly allows distributing the DLL together with the
software (clause 3(d)). There is no need to download it in CI.

## wintun.dll

The virtual network adapter driver for Windows from the authors of WireGuard.
Without it `tun-rs` cannot create a TUN interface and `vpn_connect` fails
with `tun device error: LoadLibraryExW failed`.

- **Version:** 0.14.1, amd64 (x64) build
- **Source:** <https://www.wintun.net/builds/wintun-0.14.1.zip>
- **License:** see `wintun-LICENSE.txt` — a proprietary "Prebuilt Binaries
  License" from WireGuard LLC, not GPL. Clause 3(d) allows distributing the DLL
  together with software that uses it only through the public API (our case).
  Modifying the DLL and removing the copyrights from it is not allowed.

Linux and macOS do not need this file — TUN is built into the kernel there
(`/dev/net/tun` and `utun` respectively).

### How to update wintun

sha256 of the current DLL: `e5da8447dc2c320edc0fc52fa01885c103de8c118481f683643cacc3220dafce`

1. Download the archive from <https://www.wintun.net>
2. Take `wintun/bin/amd64/wintun.dll` and `wintun/LICENSE.txt`, commit the DLL
3. Put it here, updating the version in this file

### Where it ends up during the build

`tauri.windows.conf.json` → `bundle.resources` puts the DLL into the installation
root, next to `GnomeVPN.exe` and `gnomevpn-service.exe`. Sitting next to the
service is mandatory: it is the one that creates the TUN adapter, and `tun-rs`
loads the DLL through `LoadLibraryExW` from its own process directory.

The config is platform-specific on purpose — in the base `tauri.conf.json` these
resources break the Linux and macOS builds.

For `cargo run` / `tauri dev` the file must be in `target/debug/`
(copied by the `scripts/sync-bin.mjs` script via `predev`).

### Administrator rights

Creating a TUN adapter requires administrator rights even when the DLL is present.
Run `bun run tauri:dev` from a terminal opened as administrator.
Removing the UAC prompt on every Connect is a Stage 4 task (a privileged helper).

## hysteria — Android only

The desktop does not use hysteria: sing-box does everything there. On Android `VpnService`
hands out a ready descriptor, so the tunnel is brought up by `hysteria` under `tun2proxy`,
and the binary lives as `libhysteria.so` in `android/libs/<abi>/`.

- **Version:** 2.12.1 — `scripts/fetch-hysteria.mjs` downloads it for three ABIs
- **Source:** <https://github.com/apernet/hysteria/releases>
- **License:** MIT

The name is `libhysteria.so` rather than `hysteria` because Android executes files only from the
native library directory — everything else is marked non-exec.

## singbox/sing-box[.exe]

The tunnel core on every desktop: it holds the Hysteria2 connection, owns the
TUN adapter (wintun on Windows, `utunN` on macOS, `/dev/net/tun` on Linux)
and **decides for each connection itself** whether to send it into the tunnel or directly.
This is exactly the per-application split tunneling.

- **Version:** 1.13.18 — `scripts/fetch-singbox.mjs` downloads it for the
  current platform
- **Source:** <https://github.com/SagerNet/sing-box/releases>
- **License:** GPL-3.0, see `singbox-LICENSE.txt`. It is run as a separate
  process and communicates through a config file — disclosing the GnomeVPN code
  is not required, the copyleft does not extend to a separate executable file.

### Why sing-box and not our own implementation

Splitting traffic by process using the means of Windows is impossible without a kernel-level
driver: only `FWPM_LAYER_ALE_BIND_REDIRECT` can redirect a connection,
and it requires a signed driver and an EV certificate.

sing-box gets around this differently — it does not redirect, it **pulls all the traffic into the
TUN** and opens the outgoing connections itself. The `process_name` rule in the routing decides
whether a connection goes to the Hysteria2 outbound or to `direct`. To the system it is an
ordinary application, no drivers beyond wintun.

The same engine supports rules by domain and by subnet, so the whole routing scheme lives in one
config.

### How to update sing-box

1. Download `sing-box-<version>-windows-amd64.zip` from the SagerNet/sing-box releases
2. Take `sing-box.exe` and `LICENSE` (rename it to `singbox-LICENSE.txt`)
3. Put it here, updating the version in this file

The build must contain the `with_quic` (Hysteria2) and `with_gvisor` (TUN) tags —
this is checked with the `sing-box.exe version` command.

## Folder structure

The binaries are laid out in subfolders by source (`hysteria/`, `wintun/`,
`service/`), but during a build and a dev run they are placed **flat** next to the service —
it looks for them in its own process directory. `service/gnomevpn-service.exe`
is built by the `scripts/build-service.mjs` script.
