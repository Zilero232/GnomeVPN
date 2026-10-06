---
paths:
  - 'apps/client/**/*.scss'
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/styles.md; keep them in sync. -->

# Code style — client: animation

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
