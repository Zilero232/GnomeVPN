# GnomeVPN

A commercial VPN: Hysteria2 (QUIC/UDP) on self-hosted nodes, with VLESS + Reality (TCP/443) beside it for networks that drop UDP, both served by the 3x-ui panel. There is no app of ours — the user installs [INCY](https://incy.cc/) (or any client that takes a subscription link) and pastes one URL. Bun-workspaces monorepo.

- Every doc, indexed: [docs/README.md](docs/README.md)
- Why Hysteria2, why VLESS beside it, why INCY: [docs/architecture/protocols.md](docs/architecture/protocols.md)
- The subscription feed, the product surface: [docs/architecture/subscription-feed.md](docs/architecture/subscription-feed.md)
- Billing and automatic renewal: [docs/architecture/billing.md](docs/architecture/billing.md); the Telegram bot: [docs/architecture/telegram-bot.md](docs/architecture/telegram-bot.md)
- Things that have already bitten us: [docs/architecture/pitfalls.md](docs/architecture/pitfalls.md)
- Deploying the VPS: [docs/ops/deploy.md](docs/ops/deploy.md); adding a node: [docs/ops/provisioning-a-node.md](docs/ops/provisioning-a-node.md)

Respond to the user in Russian. Code, comments, docs and commits are in English. UI text is in Russian and English via next-intl.

## Layout

| Path                | What                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/client`       | Next.js 16 / React 19 site, server-rendered, FSD (see [docs/architecture/fsd.md](docs/architecture/fsd.md)), SCSS modules, next-intl — [CLAUDE.md](apps/client/CLAUDE.md)                             |
| `apps/server`       | NestJS 11 on Bun + Prisma 7 + Postgres, auth via better-auth: the subscription feed, billing (YooKassa), the scheduler, the Telegram bot, the 3x-ui panel client — [CLAUDE.md](apps/server/CLAUDE.md) |
| `packages/schemas`  | `@gnomevpn/schemas`: Zod contracts shared by the client and the server, plans, error codes, the client registry                                                                                       |
| `packages/logger`   | `@gnomevpn/logger`: the one pino config — levels, redaction, pretty vs json ([docs/architecture/logging.md](docs/architecture/logging.md))                                                            |
| `packages/scripts`  | `@gnomevpn/scripts`: the shared script layer — `reporter`, `ssh`, `shell`                                                                                                                             |
| `scripts/provision` | VPN node setup over SSH, run locally by a person ([docs/architecture/provisioning.md](docs/architecture/provisioning.md)); `nodes.json` and `.env.nodes` sit at the repo root, gitignored             |
| `infra/caddy`       | Caddyfile: TLS and reverse proxy, bind-mounted on the VPS                                                                                                                                             |
| `.github/workflows` | `deploy.yml`, the only workflow                                                                                                                                                                       |
| `e2e/`              | Playwright over the public routes                                                                                                                                                                     |

## Commands

```bash
bun install
bun run dev:infra          # Postgres in Docker (docker-compose.dev.yml)
bun --filter @gnomevpn/server db:deploy   # apply migrations + prisma generate
bun run dev                # server :4000 + client :3000
bun run verify             # typecheck + ESLint + Prettier + Stylelint
bun run fix                # every autofixer, in the same order
bun run test               # Vitest, every workspace (never `bun test`)
bun run test:e2e           # Playwright over the public routes
bun --filter @gnomevpn/client build   # the only check that catches SSR breakage
bun run provision:nodes    # set up VPN nodes over SSH (nodes.json, .env.nodes)
bun run secrets            # fill in the empty secrets in .env
```

**`bun run test`, never `bun test`.** Bare `bun test` is Bun's own runner: it collects the same files and fails them all on `vi.setSystemTime is not a function`.

## Deploy

[.github/workflows/deploy.yml](.github/workflows/deploy.yml) runs by hand (`workflow_dispatch`): typecheck, lint, tests, the client build and Playwright first, then the client and server images to ghcr, then on the VPS migrations **before** `docker compose up -d` and a wait on both healthchecks. The VPS builds nothing. Every CI tool comes from [mise.toml](mise.toml) through `.github/actions/setup` (`jdx/mise-action`); bumping a version there also means `packageManager` and the Dockerfiles' `oven/bun` tag. VPS setup and the reasons behind the workflow: [docs/ops/deploy.md](docs/ops/deploy.md); backups: [docs/ops/backups.md](docs/ops/backups.md).

## Rules

The full style guide is [docs/guides/](docs/guides/README.md) (split into `client/`, `server/`, `shared/`); every doc is indexed in [docs/README.md](docs/README.md). Digests in `.claude/rules/` load automatically by path, one topic per file: `shared/` (TypeScript everywhere), `client/`, `server/`, `testing/`. The key rules:

- **No comments.** The code is expected to read on its own; the reasoning belongs in the docs or the commit message ([comments](docs/guides/shared/comments.md)).
- **Two or more parameters → one object.** `connect({ nodeId, country })`, never `connect(nodeId, country)`; the shape lives in a sibling `*.types.ts` as `<Fn>Input` ([functions](docs/guides/shared/functions.md)).
- **Types.** `type`, never `interface`; `unknown`, never `any` ([types](docs/guides/shared/types.md)).
- **Constants that are read together group into one `as const` object**, and a `config/` folder splits by concern rather than growing one `<module>.config.ts` ([constants and config](docs/guides/shared/constants-and-config.md)).
- **Let the code breathe.** Blank line after the setup block, before every `return`/`throw`/`continue`/`break`, around every block and multiline call; `bun lint:fix` applies it ([blank lines](docs/guides/shared/blank-lines.md)).
- **Import order** is external types → external values → internal `@/` types → internal values → relative types → relative values → styles, blank line between groups; `perfectionist/sort-imports` enforces it ([imports and barrels](docs/guides/shared/imports-and-barrels.md)).
- **Reuse over reinvention.** Before writing a helper, check `@siberiacancode/reactuse`, `remeda`, `ts-pattern`, `date-fns`, `motion`, `p-retry`, `@base-ui/react`, `@gnomevpn/logger` — only libraries already declared in a `package.json` count ([dependencies](docs/guides/shared/dependencies.md)).
- **Dependency versions.** A version used by more than one workspace lives only in the root `workspaces.catalog`; a package that must move in lockstep with a catalogued one is catalogued too ([dependencies](docs/guides/shared/dependencies.md)).
- **Tests** cover pure logic only, in `_tests/` folders beside the source; Playwright covers public routes ([tests](docs/guides/shared/testing.md)).
- **i18n.** Everything user-visible goes through next-intl, in both `en` and `ru` ([i18n](docs/guides/client/i18n.md)).
- **Verify before claiming anything works** — `bun run verify`, `bun run test`, and the client build for anything that could break prerendering ([checklist](docs/guides/shared/checklist.md)).
- **Git.** Never run git operations unless the user asks.

New design decisions go in the topical file under `docs/architecture/`, and the index in [docs/README.md](docs/README.md) gets a line for any new file.
