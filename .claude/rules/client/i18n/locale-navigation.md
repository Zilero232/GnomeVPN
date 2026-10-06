---
paths:
  - 'apps/client/**/*.{ts,tsx}'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/i18n.md; keep them in sync. -->

# Code style — client: locales in the URL

## Locales live in the URL

Import `Link`, `useRouter` and `usePathname` from `@/shared/i18n/navigation`,
never from `next/*` — a raw `next/link` drops the user back to the default
locale. Server code reads the locale with `rootParams.locale()` from
`next/root-params`.
