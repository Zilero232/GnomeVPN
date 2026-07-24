# CLAUDE.md — apps/client

Guidance for the web client. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**Next.js 16 / React 19**, App Router, static export. The same bundle is loaded by the Tauri shell ([../tauri](../tauri/)), so anything here runs in three places: browser, desktop window, and prerender.

Architecture is **Feature-Sliced Design** with one local tweak: `pages` → `views`, slices grouped by business domain.

## Layer map

```text
app/        # Next.js routes (thin wrappers) + providers/
views/      # whole screens per route — account, app-view, auth, landing, error, not-found
widgets/    # composable blocks
features/   # user interactions, by domain: app/, auth/, billing/, vpn/
entities/   # domain concepts, by domain: app/, auth/, billing/, vpn/
shared/     # project-agnostic: api/ config/ constants/ i18n/ lib/ seo/ styles/ ui/
```

Imports go downward only: `app → views → widgets → features → entities → shared`.

## Conventions that bite

- **Public API**: import the slice (`@/features/vpn/connect`), never the domain group (`@/features/vpn`) or past the barrel.
- **`shared/ui`**: one root barrel — `@/shared/ui`. Primitives live in `atoms/`, `molecules/`, `organisms/`.
- **`model/` barrels** live in subfolders (`model/hooks/index.ts`), never a slice-level `model/index.ts`.
- **Shared Zod schemas** come from `@gnomevpn/schemas`, not inline.
- **i18n**: every user-visible string. Keys in `shared/i18n/locales/{en,ru}.json` — both files, always in sync.
- Alias `@/*` → `apps/client/*`.

## Three runtimes, one bundle

The landing page is prerendered, the account area runs in a browser, and `/app` runs inside Tauri. A component can hit all three.

- **Never call a Tauri API at module scope or during render.** `isTauri()` touches `window`; on the server it throws. Guard with `isBrowser()` / `isServer()` from `@/shared/lib` (never a raw `typeof window` check) or call it inside `useEffect`.
- **Never return `null` while loading in a provider that wraps the landing page.** It ships an empty `<body>` to crawlers. `VaultProvider` blocks only in the desktop app for this reason.
- **A `useState` initialiser that reads the platform desugars into a hydration mismatch** — server and client disagree. Read it in an effect instead.

## Desktop-only paths

`shared/lib/` holds the bridges. All of them no-op in the browser, so calling them unconditionally is safe.

**Everything that crosses into Rust goes through `shared/lib/ipc`.** `callRust` is the only place that touches `invoke`, and `RustCommands` in `ipc.types.ts` mirrors the `invoke_handler` list in [`apps/tauri/src/lib.rs`](../tauri/src/lib.rs) — the two are meant to be read side by side. A command missing from either side fails at runtime, not at compile time.

Each bridge wraps `callRust` for one domain, so the name says which process answers:

| Bridge | Rust commands |
| --- | --- |
| `vpn-bridge` | `vpn_connect`, `vpn_disconnect`, `vpn_status`, `vpn_service_available` |
| `service-control` | `service_repair` — the Windows service, not the tunnel |
| `vault` | `vault_save_token`, `vault_read_token`, `vault_clear_token` |

`app-settings` (`plugin-store` + `plugin-autostart`), `window`, `notifications` and `open-external` wrap Tauri *plugins* rather than our own commands, so they do not go through `ipc`.

Every `callRust` needs a `fallback` — the same bundle renders in a browser and during prerender, where no Rust exists.

Settings that autoconnect reads live in `plugin-store`, not `localStorage` — autoconnect runs before the webview has one.

## Verification

```bash
bunx tsc --noEmit
bunx biome check .
bunx stylelint "**/*.scss"
bun --filter @gnomevpn/client build   # catches prerender-time errors
```

The build is the only check that catches SSR breakage — typecheck passes on code that throws during prerender.
