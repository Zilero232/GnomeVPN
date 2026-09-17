# Feature-Sliced Design — GnomeVPN

The FSD methodology for `apps/client/`. This document is the working reference for the frontend architecture: the layer hierarchy, import rules, public APIs, segments.

Full specification: [feature-sliced.design](https://feature-sliced.design). Linter for FSD rules: [Steiger](https://github.com/feature-sliced/steiger).

> **Where this project departs from canonical FSD** (deliberately — reasons below):
>
> | Canonical FSD | GnomeVPN | Why |
> |---|---|---|
> | `src/` root | `apps/client/` root (no `src/`) | Monorepo: `apps/client` already isolates the frontend. `@/` → `apps/client/`. |
> | `pages/` layer | `views/` layer | `pages/` at the Next.js root turns on the Pages Router. `views/` sidesteps it. |
> | `shared/ui` segment | `ui-kit/` at the root | The design system is large enough to read as its own thing, and every layer imports it. Keeping it under `shared` buried it three levels down. |

## 1. Layers

```text
apps/client/
├── app/                # Next.js routes, providers, SEO routes
├── views/              # whole screens, one per route
├── widgets/            # blocks composed for more than one view
├── features/           # user interactions, grouped by domain
├── entities/           # domain concepts, grouped by domain
├── shared/             # project-agnostic: api, config, constants, i18n, lib, seo, styles
└── ui-kit/             # the design system: atoms, molecules, organisms
```

**Imports go downward only:**

```text
app → views → widgets → features → entities → shared
```

`ui-kit` sits beside `shared`: every layer may import `@/ui-kit`, and `ui-kit` imports nothing above `shared`.

A layer never imports from itself across slices. Two features that need the same thing push it down to `entities` or `shared`.

## 2. Slices and domain groups

`features/`, `entities/` and `widgets/` group their slices by business domain:

```text
features/
├── app/        # cross-domain application concerns
│   └── switch-locale/
├── auth/       # sign-in, sign-up, password, email
├── billing/    # checkout
└── vpn/        # connect-incy
entities/
├── app/        # about, faq, incy, locale
├── auth/       # user
└── billing/    # subscription
widgets/
├── billing/    # pricing-plans
└── site/       # site-header, site-footer
```

`views/` does not group by domain — route screens sit directly in it: `views/landing`, `views/account`, `views/faq`, `views/setup`, `views/about`, `views/pricing`, `views/privacy`, `views/auth`, `views/reset-password`, `views/error`, `views/not-found`.

## 3. Public API

**Import the slice, never past its barrel and never the domain group:**

```ts
// yes
import { IncyCard } from '@/features/vpn/connect-incy';
import { usePlatforms } from '@/entities/app/incy';
import { Button, Text } from '@/ui-kit';

// no — reaching past the barrel
import { IncyCard } from '@/features/vpn/connect-incy/ui/IncyCard';

// no — the domain group is not a slice
import { IncyCard } from '@/features/vpn';
```

Every slice has an `index.ts` that re-exports what the outside may use. Everything else is private to it.

`model/` barrels live in subfolders (`model/hooks/index.ts`), never a slice-level `model/index.ts` — a single barrel over the whole model layer says nothing about what is public.

## 4. Segments

Inside a slice:

| Segment | Holds |
|---|---|
| `ui/` | components |
| `model/` | hooks, stores, derived state |
| `lib/` | pure functions, one folder per concern |
| `config/` | constants |
| `api/` | requests — but most requests live in `shared/api` |

A folder is one concern, not one function: each gets its own `index.ts`, `<name>.types.ts` and `<name>.constants.ts` where it needs them.

## 5. `ui-kit`

```text
ui-kit/
├── atoms/       # Avatar, Badge, BrandMark, Button, CountryFlag, Input, Label,
│                # PasswordInput, Spinner, Stack, Text
├── molecules/   # Accordion, AppSplash, Dialog, FormField, LinkCard, Segmented,
│                # SelectableCard, SubmitButton, Tabs
├── organisms/   # AppToaster, StatusScreen
└── index.ts     # the one barrel the rest of the app imports
```

**Each component gets its own PascalCase folder** with `Component.tsx`, `Component.module.scss`, and where it needs them `Component.types.ts` and `Component.variants.ts`, plus a barrel.

Headless primitives come from **`@base-ui/react`** — every molecule that needs behaviour wraps one rather than hand-rolling focus management. Styles are SCSS modules; tokens live in `app/globals.scss`.

From outside — only `@/ui-kit`. Inside it, imports between segments are relative (`../../atoms`).

## 6. The `app` layer

`app/` is Next.js routing and nothing else:

```text
app/
├── [locale]/              # every page lives under the locale segment
│   ├── (marketing)/       # landing, pricing, setup, faq, about, privacy
│   ├── (auth)/            # auth, reset-password
│   ├── (account)/         # account
│   ├── layout.tsx         # the root layout — html, providers, fonts
│   ├── error.tsx
│   └── not-found.tsx
├── api/health/            # container healthcheck
├── providers/             # AppProviders, AuthProvider
├── llms.txt/              # SEO routes as route handlers
├── llms-full.txt/
├── robots.ts
├── sitemap.ts
└── global-error.tsx
```

Route groups `(marketing)`, `(auth)`, `(account)` do not appear in the URL — they exist so a group can carry its own layout. `(marketing)` wraps its pages in the site header and footer.

**The root layout must be inside `[locale]`.** `next/root-params` only reports a parameter that precedes the single root layout; an outer `app/layout.tsx` makes `rootParams.locale()` unresolvable.

## 7. Where a thing goes

| It is… | It goes in |
|---|---|
| a route | `app/[locale]/…/page.tsx`, thin — metadata plus one view |
| a whole screen | `views/<route>` |
| a block two views share | `widgets/<domain>/<slice>` |
| something the user does | `features/<domain>/<slice>` |
| a domain concept with its own data | `entities/<domain>/<slice>` |
| a request | `shared/api/<resource>` |
| a constant, helper or type with no domain | `shared/` |
| a visual primitive | `ui-kit/<segment>/<Component>` |

An example from live code: `views/setup` assembles `SetupPage` out of `entities/app/incy` (`usePlatforms`), `ui-kit` primitives (`LinkCard`, `Tabs`, `Text`) and its own `ui/components/SetupSteps`. It reaches nothing sideways.

## 8. Tests

A test lives in a `_tests/` folder next to what it tests and covers pure logic only:

```text
entities/app/faq/_tests/faq.test.ts
shared/i18n/locale-path/_tests/locale-path.test.ts
shared/seo/json-ld/faq-json-ld/_tests/faq-json-ld.test.ts
ui-kit/atoms/Button/_tests/Button.test.tsx
```

The runner is Vitest — `bun run test`, never bare `bun test`. End-to-end coverage of the public routes is Playwright, in the root `e2e/`.
