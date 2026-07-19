# CLAUDE.md — apps/tauri

Guidance for the desktop shell. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**Tauri 2 / Rust.** This crate is deliberately thin: it loads the Next.js client and forwards tunnel commands to the privileged service. The tunnel itself lives in [../../crates/vpn-service](../../crates/vpn-service/).

## Layout

```text
src/
├── lib.rs           # plugin registration, command handlers
├── vault/           # session token in the OS credential store
└── vpn/
    ├── client.rs    # named-pipe client for the service
    ├── commands.rs  # #[tauri::command] entry points
    └── state.rs     # the open connection
capabilities/        # permissions — a plugin without an entry here fails at runtime
installer/hooks.nsh  # NSIS hooks: install and remove the service
scripts/             # wintun sync, service build
```

## No privileged work here

Creating the wintun adapter, editing routes and setting DNS all need administrator rights. They belong to the service. This crate opens a pipe and asks.

Moving any of it back would bring a UAC prompt to every launch — the reason the split exists.

## Capabilities

Every Tauri plugin call needs an entry in `capabilities/default.json`. Without one the call is **blocked before it reaches the plugin**, and the webview sees a rejected promise with no obvious cause. This has already cost time twice: `window.start_dragging` and `autostart:default`.

When adding a plugin: add the dependency, register it in `lib.rs`, **and** add its permission.

## Platform config

`tauri.conf.json` is shared. Windows-only resources — `wintun.dll` and the service binary — live in `tauri.windows.conf.json`, which Tauri merges only for Windows targets. Listing them in the base config breaks the Linux and macOS builds.

## Scripts

- `predev` / `prebuild` — sync wintun, build the service, regenerate icons
- `build-service.mjs` — builds the service and **verifies the binary actually changed**. A running service holds its own file: cargo then exits successfully while keeping the old build. In dev this only warns; in release it fails.
- `kill` — `fkill gnomevpn.exe`

## The service must be restarted to pick up changes

Editing `crates/vpn-service` and restarting the app is not enough. From an elevated shell:

```powershell
sc.exe stop GnomeVPNService
# rebuild, then
sc.exe start GnomeVPNService
```

Service logs: `C:\ProgramData\GnomeVPN\service.log`

## Verification

```bash
cargo clippy -p gnomevpn
bun run tauri:dev
```

`cargo clippy` on this crate needs a built frontend (`frontendDist` points at `../client/out`), which is why CI checks only the service and the protocol.
