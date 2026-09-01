# Feature-Sliced Design — GnomeVPN

The FSD methodology for `apps/client/`. This document is the working reference for the frontend architecture: the layer hierarchy, import rules, public APIs, segments.

Full specification: [feature-sliced.design](https://feature-sliced.design). Linter for FSD rules: [Steiger](https://github.com/feature-sliced/steiger).

> **Where this project departs from canonical FSD** (deliberately — reasons below):
>
> | Canonical FSD | GnomeVPN | Why |
> |---|---|---|
> | `src/` root | `apps/client/` root (no `src/`) | Monorepo: `apps/client` already isolates the frontend. `@/` → `apps/client/`. |
> | `pages/` layer | `views/` layer | `pages/` at the Next.js root turns on the Pages Router. `views/` sidesteps it. |
>
> Everywhere below where the canon says `pages` or `src/pages` — we have `views`. Where it says `src/` — we have the `apps/client/` root.

---

## 1. Layer hierarchy (top down)

| # | Layer | Purpose | Slices? |
|---|---|---|---|
| 1 | App | Routing, providers, global styles, entrypoint | No |
| 2 | Views *(canon: Pages)* | Whole screens / route-level compositions | Yes |
| 3 | Widgets | Large self-contained UI blocks (reusable or standalone) | Yes |
| 4 | Features | User interactions with business value (forms, actions) | Yes |
| 5 | Entities | Core business concepts (user, node, subscription, protocol) | Yes |
| 6 | Shared | UI kit, API client, utilities, i18n, config — project-agnostic | No |

The `Processes` layer is deprecated — its contents move into `Features` or `App`.

### Directory structure

```
apps/client/            # (canon: src/)
├── app/                # App layer (no slices — segments only)
├── views/              # Views layer (canon: pages/)
│   └── <view-name>/    # landing | auth | app-view | account | privacy | ...
├── widgets/            # Widgets layer
│   └── <domain>/       # app
│       └── <widget-name>/
├── features/           # Features layer
│   └── <domain>/       # app | auth | billing | vpn
│       └── <feature-name>/
├── entities/           # Entities layer
│   └── <domain>/       # app | auth | billing | vpn
│       └── <entity-name>/
└── shared/             # Shared layer (no slices — segments only)
    ├── api/
    ├── ui/
    ├── lib/
    ├── config/
    ├── constants/
    ├── i18n/
    ├── seo/
    └── styles/
```

> **Slices grouped by domain.** In GnomeVPN the slices inside `features/`, `entities/` and `widgets/` are grouped by business domain (`app`, `auth`, `billing`, `vpn`). This is a layer on top of the FSD canon (`<layer>/<slice>/`). Imports: `@/features/auth/sign-in`, `@/entities/vpn/node`, `@/widgets/app/title-bar`. The `app` group is the cross-domain application infrastructure (release, locale, platform, system-tray, deep-link, check-update). The `views/` layer does not group its slices by domain — route screens sit directly in it (`views/app-view`, `views/account`).

---

## 2. The golden rule: the direction of imports

```
App → Views → Widgets → Features → Entities → Shared
```

A module imports only from layers **strictly below** it. Forbidden:

- **Upward** — a Feature cannot import from a Widget or a View.
- **Sideways within a layer** — one Feature cannot import another Feature.

**The exception — cross-entity references.** When Entity A needs a type from Entity B, use the `@x` pattern: `entities/A/@x/B.ts` exports only what B needs from A. GnomeVPN has none of these yet — shared types come from `@gnomevpn/schemas`, not from a neighbouring entity.

---

## 3. Slices

A slice is a directory inside a layer, named after a **business domain** (not a technical role).

- ✓ Good: `user`, `node`, `protocol`, `subscription`, `connect`, `split-tunneling`
- ✗ Bad: `components`, `hooks`, `helpers`, `utils`

**Rules:**

- Every slice is isolated — zero coupling to neighbouring slices in the same layer.
- Related slices may be grouped into subfolders, but they stay independent.
- Slice names are kebab-case.

**Domain groups (GnomeVPN):** the `features/`, `entities/` and `widgets/` layers group their slices by business domain:

- `vpn/` — the tunnel, nodes, protocols, split-tunneling, device configs
  (`features/vpn/connect`, `features/vpn/split-tunneling`, `features/vpn/download-config`;
  `entities/vpn/node`, `entities/vpn/protocol`, `entities/vpn/device`)
- `billing/` — plans, subscription, payment (`features/billing/checkout`, `entities/billing/subscription`)
- `auth/` — sign-in, sign-up, password, profile (`features/auth/sign-in`, `features/auth/sign-up`,
  `features/auth/forgot-password`, `features/auth/reset-password`, `features/auth/change-password`,
  `features/auth/change-email`, `features/auth/update-name`, `features/auth/sign-out`;
  `entities/auth/user`)
- `app/` — application infrastructure (`features/app/check-update`, `features/app/deep-link`,
  `features/app/system-tray`, `features/app/switch-locale`, `features/app/startup-settings`,
  `features/app/service-repair`, `features/app/vpn-permission`, `features/app/download-app`;
  `entities/app/locale`, `entities/app/platform`, `entities/app/release`;
  `widgets/app/title-bar`)

A domain folder is an organisational container, **not a public API**. Always import down to the slice level: `@/features/vpn/connect`, not `@/features/vpn`.

---

## 4. Segments

Segments organise the code inside a slice by technical purpose:

| Segment | Holds |
|---|---|
| `ui/` | Components, formatters, styles |
| `model/` | Types, interfaces, contexts, schemas, business logic |
| `api/` | Backend requests, data mappers, query hooks |
| `lib/` | Internal utilities for this slice only |
| `config/` | Feature flags, constants, configuration |

Custom segments are allowed — name them after **what they do**, not what they are.
✗ Bad: `hooks/`, `components/`. ✓ Good: `model/`, `lib/`.

---

## 5. Public API (`index.ts`)

Every slice has an `index.ts` at its root, re-exporting the public interface.

```ts
// features/vpn/connect/index.ts
export { useVpnConnectionContext, VpnConnectionProvider } from './model/context';
export { useProtocolSelection } from './model/hooks';
export type { VpnConnectionStatus, VpnTraffic } from './model/hooks';

export { ConnectButton } from './ui/ConnectButton';
export type { ConnectButtonProps } from './ui/ConnectButton.types';
```

**Rules:**

- **No wildcard exports** — `export * from './ui/Foo'` is forbidden. Be explicit.
- **Minimal surface** — export only what other layers genuinely need.
- **External imports go through the slice index** — never `@/features/auth/sign-in/ui/SignInForm` directly. Always `@/features/auth/sign-in`.
- **A domain group is not a public API** — `@/features/auth` does not exist; the specific slice is what gets imported. The domain folder only organises files.
- **`model/` — barrels in the subfolders, not at the `model/` level.** `model/hooks/index.ts`, `model/context/index.ts` — each subfolder gets its own barrel. We do NOT create a slice-level `model/index.ts`. The slice `index.ts` and internal imports go through the subfolder: `./model/hooks`, `../model/context`. More in [`docs/style.md`](./style.md) §11.
- **No circular imports** — do not import from a slice's own `index.ts` inside that slice. Inside, use relative paths.
- **`shared/ui` is an atomic layer.** Segments `atoms/`, `molecules/`, `organisms/`. **Each component gets its own PascalCase folder** (`atoms/Button/`, `molecules/FormField/`, `organisms/StatusScreen/`) with `Component.tsx`, `Component.module.scss`, optionally `Component.types.ts` and `Component.variants.ts`, and a barrel `index.ts`. The segment barrels (`atoms/index.ts`, …) and the root `shared/ui/index.ts` re-export everything. From outside — only `@/shared/ui`, not `@/shared/ui/atoms/Button`. Headless primitives — **`@base-ui/react`**; styles — **SCSS modules**, tokens — `app/globals.scss`. More in [`docs/style.md`](./style.md) §2.1.

---

## 6. Next.js integration (App Router)

`app/` stays at the `apps/client/` root. Route files are thin wrappers that delegate to `views/`:

```tsx
// app/app/page.tsx — server-side, thin
import { createPageMetadata } from '@/shared/seo';
import { AppGate } from '@/views/app-view';

export const metadata = createPageMetadata({
  title: 'Connection',
  description: 'Pick a country and control the VPN tunnel.',
  path: '/app',
  index: false,
  follow: false
});

const Page = () => <AppGate />;

export default Page;
```

Route files (`page.tsx`, `layout.tsx`) are server components, no `'use client'`. They contain only: metadata, the wrapper, the default export. All the UI and the logic live in `views/<name>/`.

> Canonical FSD recommends `export { Page as default } from '@/views/...'` and an empty `pages/` with a `.gitkeep`. In GnomeVPN the layer is named `views/` — there is no conflict with the Next.js Pages Router, so the `.gitkeep` placeholder is unnecessary. The route wrapper is written as an ordinary component (see above).

Providers (`AppProviders`, `AuthProvider`, `DesktopShell`, `I18nProvider`, `VaultProvider`, …) live in `app/providers/` — that is a segment of the App layer, not a slice.

### Path aliases

`@/` points at `apps/client/` (canon: at `src/`):

```jsonc
// tsconfig.json
{ "compilerOptions": { "paths": { "@/*": ["./*"] } } }
```

---

## 7. Composition patterns

**View** *(canon: Page)*:

```
View
├── imports Widget A (self-contained block)
├── imports Widget B
├── imports Feature X (interactive element)
└── uses Shared UI primitives for layout
```

**Widget:**

```
Widget
├── imports Feature(s) for interactivity
├── imports Entity types/components for display
└── uses Shared UI primitives
```

**Feature:**

```
Feature
├── imports Entity types/hooks for domain data
└── uses the Shared API client, UI primitives, utilities
```

An example from live code: `views/app-view` assembles `AppView` out of `widgets/app/title-bar`,
`features/vpn/connect` (`ConnectButton`, `VpnConnectionProvider`),
`features/vpn/split-tunneling`, `entities/vpn/node` (`useNodes`) and primitives from `@/shared/ui`.

---

## 8. Checklist (check before every change)

- [ ] The file is in the right layer directory
- [ ] Imports go downward only — never up, never sideways
- [ ] The slice has a public `index.ts` with explicit named exports
- [ ] Nothing imports a slice's internals from outside
- [ ] Directory and file names are kebab-case (exception — component folders: PascalCase)
- [ ] Component functions are named PascalCase exports (no default exports out of slices)
- [ ] Segments describe purpose (`model/`, `api/`), not technical role (`hooks/`, `components/`)
- [ ] Route files are thin wrappers that delegate to `views/`
- [ ] The Shared layer holds no business logic — only project-agnostic code
- [ ] The Entities layer holds no interaction UI logic — that is the Features level

> **Naming in GnomeVPN:** canonical FSD requires kebab-case for every file. The GnomeVPN code style (see [`docs/style.md`](./style.md) §5): kebab-case for slices/segments, **PascalCase for component folders and files** (`TitleBar/TitleBar.tsx`), camelCase for hooks/utilities. This is a local convention on top of FSD.

---

## 9. Common mistakes

| Mistake | Fix |
|---|---|
| A Feature imports from another Feature | Move the shared logic into Entities or Shared |
| A View holds business logic directly | Move it into a Feature, compose it in the View |
| `shared/hooks/useSignIn.ts` | Auth is a business domain → `features/auth/sign-in/model/use-sign-in.ts` |
| A Widget imports from a View | Invert it: the View imports the Widget |
| A slice exports everything via `export *` | Explicit named re-exports |
| A `components/` folder at a layer root | Classify it: is this a Widget, a Feature, an Entity or Shared UI? |
| A route file holds the full page implementation | Move it into `views/<name>/`; the route is a thin wrapper |

---

## 10. Tests

A test lives in a `_tests/` folder next to what it tests and covers pure logic only — `features/vpn/split-tunneling/lib/matches-query/_tests/`, `shared/api/configs/_tests/`, `shared/ui/atoms/Button/_tests/`. The runner is Vitest (`bun run test`, not `bun test`). E2E over the public routes — Playwright in the root `e2e/`.

`_tests/` is not an FSD segment: it takes no part in the slice's public API and exports nothing outward.

---

## Further reading

- Full specification: [feature-sliced.design](https://feature-sliced.design)
- Linter for FSD rules: [Steiger](https://github.com/feature-sliced/steiger)
- The `@x` cross-entity pattern — section 2 above
- The GnomeVPN code style on top of FSD (slice structure, naming, component size): [`docs/style.md`](./style.md)
