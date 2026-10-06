# Styles and SCSS

Part of the [style guide](../README.md).

## 3. Styles: SCSS modules only

| Layer                      | Format                                                  |
| -------------------------- | ------------------------------------------------------- |
| `ui-kit/**`                | `*.module.scss` + CSS variables from `app/globals.scss` |
| widgets / features / views | `*.module.scss`                                         |

There is no CSS-in-JS in this project — no Tailwind, no `.styles.ts`. `cva` (`class-variance-authority`) is used only to map a primitive's variants onto its module classes, in `<Name>.variants.ts`.

| Case                            | Where                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Component styles in `ui-kit`    | `<Name>.module.scss`                                                                       |
| Styles for a slice subcomponent | `<Name>.module.scss` next to it                                                            |
| Conditional classes             | `clsx(s.root, isBlocked && s.blocked)` or SCSS modifiers                                   |
| Primitive variants/sizes        | a `cva` map over module classes in `<Name>.variants.ts` (`Button.variants.ts`)             |
| Animation                       | `motion` + presets in `<Name>.motion.ts`                                                   |
| Media query                     | `@include below(md)` / `@include from(2xl)` from `shared/styles/mixins` — never raw pixels |

Joining module classes with an optional `className` prop is done with **`clsx`** (`import { clsx } from 'clsx'`).

The principle: the JSX reads, and `s.root`/`s.panel` tell you the structure.

## 12. Global styles and SCSS

- Theme tokens are CSS variables on `:root` in `app/globals.scss` — colours,
  radii, type scale, spacing, the safe-area insets. There is no `_tokens.scss`
  and no separate token file: `shared/styles/` holds only `_animations.scss`,
  `_breakpoints.scss` and `_mixins.scss`.
- The app is dark-only. There is no theme switch, no `.dark` class and no
  `next-themes` — one palette, defined once on `:root`, declared with
  `color-scheme: dark` so native controls and scrollbars match.
- Component styles are `*.module.scss`. Shared mixins come in through
  `@use '@/shared/styles/mixins' as *`, which works because `next.config.ts`
  sets `sassOptions.loadPaths` to the client root and aliases `@` for Turbopack.
- Breakpoints come from the scale in `_breakpoints.scss` — `@include below(md)`,
  `@include from(2xl)` — never a hand-written `@media (width <= 620px)`. See
  "Breakpoints" below.
- `clsx` joins a module class with an incoming `className` prop.

**Property order is enforced.** Stylelint runs
`stylelint-config-idiomatic-order`, so a declaration out of order is an error,
not a warning — `bun run lint:css:fix` sorts it.

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
