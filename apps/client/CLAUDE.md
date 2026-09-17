# CLAUDE.md — apps/client

Guidance for the web client. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**Next.js 16 / React 19**, App Router, server-rendered and shipped as a Node
server (`output: 'standalone'`). Caddy sits in front of it and terminates TLS.

Architecture is **Feature-Sliced Design** with two local tweaks: `pages` → `views`,
and the design system lives at the root as `ui-kit` rather than inside `shared`.

## Layer map

```text
app/          # Next.js routes — [locale]/ with (marketing) (auth) (account) groups
views/        # whole screens per route
widgets/      # composable blocks shared by several views
features/     # user interactions, by domain: app/, auth/, billing/, vpn/
entities/     # domain concepts, by domain: app/, auth/, billing/, vpn/
shared/       # project-agnostic: api/ config/ constants/ i18n/ lib/ seo/ styles/
ui-kit/       # the design system: atoms/ molecules/ organisms/
```

Imports go downward only: `app → views → widgets → features → entities → shared`.
`ui-kit` sits beside `shared` and every layer may import it.

## Conventions that bite

- **Public API**: import the slice (`@/features/vpn/connect-incy`), never the
  domain group (`@/features/vpn`) or past the barrel.
- **`ui-kit`**: one root barrel — `@/ui-kit`. Primitives live in `atoms/`,
  `molecules/`, `organisms/`.
- **`model/` barrels** live in subfolders (`model/hooks/index.ts`), never a
  slice-level `model/index.ts`.
- **Shared Zod schemas** come from `@gnomevpn/schemas`, not inline.
- **i18n**: every user-visible string. Keys in `shared/i18n/locales/{en,ru}.json` —
  both files, always in sync.
- Alias `@/*` → `apps/client/*`.

## Locales live in the URL

`/` and `/privacy` are Russian; `/en` and `/en/privacy` are English. The default
locale carries no prefix (`localePrefix: 'as-needed'`), and `proxy.ts` — Next 16's
name for middleware — rewrites and negotiates.

Three rules follow from that:

- **Never import `Link`, `useRouter` or `usePathname` from `next/*`.** Use
  `@/shared/i18n/navigation`, which wraps them so every href keeps its locale. A
  raw `next/link` drops the user back to Russian.
- **`next/root-params` is how server code reads the locale.** `rootParams.locale()`
  works in layouts, pages and `generateMetadata`. `setRequestLocale` is deprecated
  and gone.
- **The navigation slice is separate from the i18n barrel on purpose.**
  `createNavigation` pulls in client-side React, so exporting it from
  `@/shared/i18n` drags `next/navigation` into `sitemap.ts` and the metadata
  helpers, where it cannot resolve. `localePath` is the server-safe half.

`generateStaticParams` in the locale layout is what prerenders both languages.

## SEO is a server concern now

Every public page exports `generateMetadata`, reads its locale from root params
and builds its metadata through `createPageMetadata`, which fills in the
canonical URL and the `hreflang` alternates for both locales.

`robots.ts` and `sitemap.ts` derive from `indexedRoutes()` in
`shared/constants/routes.ts` — add a public page there and both files follow.

Private routes (`/account`, `/auth`, `/reset-password`) are explicitly disallowed
in robots and carry `index: false`.

## Server-only code

- `instrumentation.ts` runs once at boot. It validates the `NEXT_PUBLIC_*` env by
  importing the schema, so a bad value fails the container rather than the first
  request that renders a page, and reports render failures through
  `onRequestError`.
- `shared/lib/server-logger` is pino. It must never be imported from a client
  component — that is why it is its own slice and not part of `shared/lib`'s
  barrel. The browser half is `shared/lib/logger`, which writes to the console.
- `app/api/health/route.ts` is what the container healthcheck probes. Keep it
  cheap: it must not touch the API or the database.

## Verification

`bun --filter @gnomevpn/client build` is the only check that catches SSR
breakage — typecheck passes on code that throws during prerender, and a missing
translation key only shows up there as `MISSING_MESSAGE`.
