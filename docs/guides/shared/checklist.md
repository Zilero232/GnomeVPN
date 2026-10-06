# Checklist before a commit

Part of the [style guide](../README.md).

## 20. Checklist before a commit

```bash
bun run fix        # every autofixer: eslint --fix, prettier, stylelint --fix, prisma format
bun run verify     # typecheck, eslint, prettier, stylelint
bun run test       # Vitest across every workspace
bun --filter @gnomevpn/client build   # the only check that catches SSR breakage
```

`bun run fix` is verify's counterpart: every autofixer in the same order.
`bun run test`, never bare `bun test` — why is in [testing.md](testing.md), which
also says where tests and the Playwright specs live.

`bun run fix` does not fix: hook order ([client/react.md](../client/react.md)
§9.1) or FSD import boundaries (→ [`docs/architecture/fsd.md`](../../architecture/fsd.md)).

## Verify before claiming anything works

`bun run verify` and `bun run test` do not catch SSR breakage.
`bun --filter @gnomevpn/client build` is the only check that does — it is where a
page that typechecks but throws during prerender fails, and where a missing
translation key surfaces as `MISSING_MESSAGE`.

`deploy.yml` runs all of the above, plus Playwright over the public routes, before
it builds anything. Nothing else looks at a commit, so a red local run is what a
deploy will find.

## The toolchain

The toolchain is pinned in `mise.toml` — bun, and node 22 for serving the
standalone build the way the web image does. CI installs it through
`jdx/mise-action` in `.github/actions/setup`, so bumping a version is one edit
there (plus `packageManager` and the Dockerfiles' `oven/bun` tag, which mise
does not read).
