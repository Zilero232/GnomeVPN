---
paths:
  - 'apps/client/**/*.scss'
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/styles.md; keep them in sync. -->

# Code style — client: breakpoints and SCSS

## SCSS modules only

`<Name>.module.scss` beside the component, no CSS-in-JS. Tokens are CSS
variables on `:root` in `app/globals.scss`; the app is dark-only. `clsx` joins a
module class with an incoming `className`. Stylelint owns property order —
`bun run lint:css:fix`.

## Breakpoints

Seven steps in `shared/styles/_breakpoints.scss` — `xs` 420, `sm` 520, `md` 560,
`lg` 640, `wide` 700, `xl` 760, `2xl` 900 — used as `@include below(md)` /
`@include from(2xl)` and forwarded by `shared/styles/mixins`. Never write a raw
`@media (width <= 620px)`: add a step to the map instead.

Rounding a `below()` up degrades early and is safe; rounding a `from()` up takes
a layout away from every viewport in between. `wide` exists for exactly that.
