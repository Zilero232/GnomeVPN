# CLAUDE.md — apps/client

Guidance for the web client. Extends the root [../../CLAUDE.md](../../CLAUDE.md); those rules still apply.

**Next.js 16 / React 19**, App Router, server-rendered and shipped as a Node
server (`output: 'standalone'`). Caddy sits in front of it and terminates TLS.

Architecture is **Feature-Sliced Design** with two local tweaks: `pages` → `views`,
and the design system lives at the root as `ui-kit` rather than inside `shared`.
Full rules: [docs/architecture/fsd.md](../../docs/architecture/fsd.md); code style:
[docs/guides/](../../docs/guides/README.md).

## Layer map

```text
app/          # Next.js routes — [locale]/ with (marketing) (auth) (account) groups
views/        # whole screens per route
widgets/      # composable blocks shared by several views
features/     # user interactions, by domain: account/, app/, auth/, billing/, vpn/
entities/     # domain concepts, by domain: app/, auth/, billing/
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
- **i18n**: every user-visible string. Keys in
  `shared/i18n/locales/{en,ru}/<namespace>.json` — one file per namespace, the
  same set of files and keys in both languages.
- Alias `@/*` → `apps/client/*`.

## Locales live in the URL

`/` is Russian, `/en` English (`localePrefix: 'as-needed'`); `proxy.ts` negotiates.
Import `Link`, `useRouter` and `usePathname` from `@/shared/i18n/navigation`, never
`next/*`; server code reads the locale with `rootParams.locale()`. The reasons are
in [docs/guides/client/i18n.md](../../docs/guides/client/i18n.md).

## SEO is a server concern now

Every public page exports `generateMetadata`, reads its locale from root params
and builds its metadata through `createPageMetadata`, which fills in the
canonical URL and the `hreflang` alternates for both locales.

`sitemap.ts` derives from `indexedRoutes()` in `shared/constants/routes/` — add a
public page to `INDEXED_ROUTES` and it follows; the full list of places a new
page touches is in [docs/architecture/web-client.md](../../docs/architecture/web-client.md).

Private routes (`/account`, `/auth`, `/reset`, `/telegram`) are explicitly
disallowed in `robots.ts` and carry `index: false`.

## Platform downloads are a shared constant

`PLATFORMS` in `@gnomevpn/schemas` is `{ id, href }` for every platform INCY ships
on, built from `INCY_DOWNLOADS` in the client registry. The icons cannot live
there — they are React components — so `PLATFORM_ICONS` in `entities/app/incy`
maps an id to its icon and `usePlatforms` joins the two. The client reads the
constant directly; the server serves the same list on the anonymous
`GET /platforms`. Changing a download URL is a change to `@gnomevpn/schemas`,
so both images ship it.

## One FAQ, two placements

`entities/app/faq` owns the questions. The FAQ page renders `FAQ_GROUPS`; the
landing page renders `FAQ_HIGHLIGHTS`, a subset of the same ids. They were two
separate sets once and had already drifted into asking the same thing in
different words.

## Server-only code

- `instrumentation.ts` runs once at boot. Its Node half,
  `instrumentation.node.ts`, imports `env` from `@/shared/config`, which validates
  the `NEXT_PUBLIC_*` values — a bad value fails the container rather than the
  first request that renders a page. `onRequestError` reports render failures
  through the server logger.
- `shared/lib/server-logger` is pino. It must never be imported from a client
  component — that is why it is its own slice and not part of `shared/lib`'s
  barrel. The browser half is `shared/lib/logger`, which writes to the console.
- `app/api/health/route.ts` is what the container healthcheck probes. Keep it
  cheap: it must not touch the API or the database.

## The long-form references

[docs/architecture/fsd.md](../../docs/architecture/fsd.md) and the client guides
in [docs/guides/client/](../../docs/guides/README.md) carry the full versions of
what this file summarises: the layer rules with examples, the segment table, hook
ordering, blank-line rules, form conventions. The decisions behind the client —
`cacheComponents`, the sign-in cache clear, indexed pages and structured data —
are in [docs/architecture/web-client.md](../../docs/architecture/web-client.md).
This file is the short answer; those are where a rule is argued rather than
stated.

## Verification

`bun --filter @gnomevpn/client build` is the only check that catches SSR
breakage — typecheck passes on code that throws during prerender, and a missing
translation key only shows up there as `MISSING_MESSAGE`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
