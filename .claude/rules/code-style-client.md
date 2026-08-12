---
paths:
  - "apps/client/**/*.{ts,tsx}"
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- Full reasoning in apps/client/CLAUDE.md; keep the two in sync. -->

# Code style — client

Feature-Sliced Design with one local tweak: `pages` → `views`, slices grouped by
business domain. Imports go downward only:
`app → views → widgets → features → entities → shared`.

## Public API

Import the slice (`@/features/vpn/connect`), never the domain group
(`@/features/vpn`) and never past the barrel. `shared/ui` has one root barrel —
`@/shared/ui`; primitives live in `atoms/`, `molecules/`, `organisms/`.

`model/` barrels live in subfolders (`model/hooks/index.ts`), never a slice-level
`model/index.ts`.

## Three runtimes, one bundle

The landing page is prerendered, the account area runs in a browser, `/app` runs
inside Tauri. A component can hit all three.

- **Never call a Tauri API at module scope or during render.** `isTauri()` touches
  `window` and throws on the server. Guard with `isBrowser()`/`isServer()` from
  `@/shared/lib`, never a raw `typeof window` check, or call it inside `useEffect`.
- **Never return `null` while loading in a provider that wraps the landing page** —
  it ships an empty `<body>` to crawlers.
- **A `useState` initialiser that reads the platform is a hydration mismatch.**
  Read it in an effect instead.

Every `callRust` needs a `fallback`: the same bundle renders where no Rust exists.
`RustCommands` in `shared/lib/ipc/ipc.types.ts` mirrors the `invoke_handler` list
in `apps/tauri/src/lib.rs` — change both together or it fails at runtime.

## i18n

Everything user-visible goes through i18n, in **both** `en.json` and `ru.json`,
always in sync. Shared Zod schemas come from `@gnomevpn/schemas`, not inline.

## Breakpoints

Seven steps in `shared/styles/_breakpoints.scss` — `xs` 420, `sm` 520, `md` 560,
`lg` 640, `wide` 700, `xl` 760, `2xl` 900 — used as `@include below(md)` /
`@include from(2xl)` and forwarded by `shared/styles/mixins`. Never write a raw
`@media (width <= 620px)`: add a step to the map instead.

Rounding a `below()` up degrades early and is safe; rounding a `from()` up takes
a layout away from every viewport in between. `wide` exists for exactly that.

## Animation

`motion` is already a dependency and is the way to animate. Presets go in a
sibling `<Component>.motion.ts`, matching `ProtocolSwitch.motion.ts`. Do not
hand-roll a CSS `transition` for something motion is already driving.

Anything animated over a `backdrop-filter` or a wide `box-shadow` needs
`will-change`, or the webview builds the compositing layer during the first frame
and repaints the blur on every frame after.

## Verification

`bun --filter @gnomevpn/client build` is the only check that catches SSR
breakage — typecheck passes on code that throws during prerender.
