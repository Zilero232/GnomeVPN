---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/react.md; keep them in sync. -->

# Code style — client: server and browser

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
  group paints its own shell and lays a splash _over_ the children while the
  session resolves, so the segment always renders.
- **A `useState` initialiser that reads browser state is a hydration mismatch.**
  Read it in an effect instead.
- **Server-only modules stay out of shared barrels.** `shared/lib/server-logger`
  is pino and must never reach the browser bundle; `shared/i18n/navigation` is
  client React and must never reach `sitemap.ts`. Both are separate slices for
  that reason.

## Verification

`bun --filter @gnomevpn/client build` is the only check that catches SSR
breakage — typecheck passes on code that throws during prerender.
