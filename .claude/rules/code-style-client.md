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

Import the slice (`@/features/vpn/connect-incy`), never the domain group
(`@/features/vpn`) and never past the barrel. The design system has one root
barrel — `@/ui-kit`; primitives live in `atoms/`, `molecules/`, `organisms/`.

`model/` barrels live in subfolders (`model/hooks/index.ts`), never a slice-level
`model/index.ts`.

## Server and browser are both real

Every page is rendered on the server first. A component that touches `window`
during render breaks the prerender, not just a test.

- **Guard browser APIs with `isBrowser()`/`isServer()` from `@/shared/lib`**,
  never a raw `typeof window` check, or read them inside `useEffect`.
- **A provider that wraps every page never swaps `children` for a placeholder.**
  Returning a splash instead ships an empty `<body>` to crawlers on the public
  pages, and on a private one it drops the page segment from rendering
  altogether — which is what Next 16 reports as "could not validate that a
  segment has instant navigation". `AuthProvider` only redirects; the account
  group paints its own shell and lays a splash *over* the children while the
  session resolves, so the segment always renders.
- **A `useState` initialiser that reads browser state is a hydration mismatch.**
  Read it in an effect instead.
- **Server-only modules stay out of shared barrels.** `shared/lib/server-logger`
  is pino and must never reach the browser bundle; `shared/i18n/navigation` is
  client React and must never reach `sitemap.ts`. Both are separate slices for
  that reason.

## Locales live in the URL

Import `Link`, `useRouter` and `usePathname` from `@/shared/i18n/navigation`,
never from `next/*` — a raw `next/link` drops the user back to the default
locale. Server code reads the locale with `rootParams.locale()` from
`next/root-params`.

## A component body reads top to bottom

Hooks first, then the values derived from them, then the handlers that act on
those values, then the JSX. Every hook sits above the first `const` that is not
one, so the dependency order is the reading order and nothing is declared after
something that already used it.

```tsx
const t = useTranslations('incy');
const { data: link, isLoading } = useSubscriptionLink();
const rotate = useRotateLink();

const [isQrOpen, setIsQrOpen] = useState(false);

const onCopy = async (value: string) => { ... };

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

## Shared feature state

Once more than two components read a feature's hook, put it behind a context.
Threading `ReturnType<typeof useX>` down as a prop leaks the hook's whole shape
into every signature below it.

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

`motion` is already a dependency and is the way to animate. Presets shared by
several components live in `shared/lib/motion`; one-off presets go in a sibling
`<Component>.motion.ts`. Do not hand-roll a CSS `transition` for something
motion is already driving.

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
