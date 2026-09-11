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

## A component body reads top to bottom

Hooks first, then the values derived from them, then the handlers that act on
those values, then the JSX. Every hook sits above the first `const` that is not
one, so the dependency order is the reading order and nothing is declared after
something that already used it.

```tsx
const t = useTranslations('app');
const { nodes } = useNodes();
const { status, connect } = useVpnConnectionContext();

const isOnline = status === 'connected';
const target = nodes.find((node) => node.id === selectedId);

const onToggle = async () => { ... };

return ( ... );
```

React already forbids a conditional hook; this keeps them visually grouped too,
so a hook added later cannot drift below a branch by accident.

Two shapes legitimately sit between hooks and stay where they are:

- **A ref sync** — `onEventRef.current = onEvent;` between the `useRef` that
  holds it and the `useEffect` that reads it. It has to run on every render,
  before the effect, which is the whole point of the pattern.
- **A value a later hook consumes** — when the expression is only an argument,
  inline it into the hook call. When inlining it would be unreadable, leave the
  `const` where it is: the rule orders declarations, it does not ask you to
  hide a dependency.

## Settings and shared feature state

Read a `Setting` through `useSetting` from `@/shared/lib`, never with a hand-rolled
effect: it loads, subscribes to store changes, writes back and logs a failed read
instead of leaving an unhandled rejection. Its `initial` must equal the setting's
`fallback`, or the UI paints the wrong value until the effect lands — and where
the effect returns early it never corrects.

Once more than two components read a feature's hook, put it behind a context
(`useVpnConnectionContext`, `useSplitTunnelingContext`). Threading
`ReturnType<typeof useX>` down as a prop leaks the hook's whole shape into every
signature below it.

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

**Never put `backdrop-filter` under an opaque background.** It composites and
blurs a layer nobody can see through, and a panel that also animates `scale`
then scales that rasterised layer — text arrives visibly soft for the first
frames. Menus, popovers and dialog panels all sit on `--color-surface-raised`,
which is opaque, so none of them carry one. The dialog **overlay** is the
exception and keeps its blur: there the page behind really does show through.

`will-change: transform` goes with that blur, not with the animation. Without a
filter to composite it only pins an extra layer, which is what rasterises the
text. Nothing in the client needs it today.

## Verification

`bun --filter @gnomevpn/client build` is the only check that catches SSR
breakage — typecheck passes on code that throws during prerender.
