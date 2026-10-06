---
paths:
  - 'apps/client/**/*.{ts,tsx}'
  - 'apps/client/shared/i18n/locales/**/*.json'
---

<!-- Compressed editing rules for the web client, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/client/i18n.md; keep them in sync. -->

# Code style — client: messages

## i18n

Everything user-visible goes through next-intl, in **both** languages, always in
sync: `shared/i18n/locales/{en,ru}/<namespace>.json`, one file per namespace,
imported explicitly in `messages.ts`. Validation messages are keys too, resolved
by `useFieldError`. Shared Zod schemas come from `@gnomevpn/schemas`, not inline.
