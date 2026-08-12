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

| Bridge            | Rust commands                                                          |
| ----------------- | ---------------------------------------------------------------------- |
| `vpn-bridge`      | `vpn_connect`, `vpn_disconnect`, `vpn_status`, `vpn_service_available` |
| `service-control` | `service_repair` — the Windows service, not the tunnel                 |
| `vault`           | `vault_save_token`, `vault_read_token`, `vault_clear_token`            |

`app-settings` (`plugin-store` + `plugin-autostart`), `window`, `notifications` and `open-external` wrap Tauri _plugins_ rather than our own commands, so they do not go through `ipc`.

Every `callRust` needs a `fallback` — the same bundle renders in a browser and during prerender, where no Rust exists.

Settings that autoconnect reads live in `plugin-store`, not `localStorage` — autoconnect runs before the webview has one.

## Breakpoints come from the scale

`shared/styles/_breakpoints.scss` holds seven steps — `xs` 420, `sm` 520, `md` 560,
`lg` 640, `wide` 700, `xl` 760, `2xl` 900 — reached through `@include below(md)`
and `@include from(2xl)`. Both are forwarded by `shared/styles/mixins`, which most
SCSS modules already `@use`.

A hand-written `@media (width <= 620px)` is what this replaces: eleven distinct
values had accumulated across twenty-five call sites — 400 next to 420, 460 next
to 520, 620 next to 640 — so a layout fixed at one width stayed broken at its
neighbour. Add a step to the map rather than a pixel value to a component.

**`wide` exists because rounding a `from()` is not the same as rounding a
`below()`.** Folding 700 into 760 looked like the same kind of near-neighbour
merge as the others, but it is a min-width query: it withheld the two-column grid
in `ProtocolPicker` and `SubscriptionCard` from every viewport between 700 and 759. Widening a `below()` degrades early and stays readable; narrowing a `from()`
takes a layout away.

## Verification

```bash
bunx tsc --noEmit
bunx eslint .
bunx prettier --check .
bunx stylelint "**/*.scss"
bun --filter @gnomevpn/client build   # catches prerender-time errors
```

The build is the only check that catches SSR breakage — typecheck passes on code that throws during prerender.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
