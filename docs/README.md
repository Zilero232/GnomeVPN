# Documentation index

Everything under `docs/`, grouped by concern. Agent-facing editing digests live separately in [.claude/rules/](../.claude/rules/) (loaded by path) and in the `CLAUDE.md` files: [root](../CLAUDE.md), [apps/client](../apps/client/CLAUDE.md), [apps/server](../apps/server/CLAUDE.md). The public overview is the [README](../README.md).

## Architecture

Design decisions — the "why" behind the code, and what has already gone wrong.

- [architecture/protocols.md](architecture/protocols.md) — why Hysteria2 leads, VLESS + Reality as the TCP fallback in the same subscription, why INCY and not our own client.
- [architecture/subscription-feed.md](architecture/subscription-feed.md) — the subscription as the product surface: routes, the token, the period gate, headers, `tlsMode` and `pinSHA256`, `no-store` and no ETag, third-party clients, the announce banner, platform downloads.
- [architecture/nodes-and-peers.md](architecture/nodes-and-peers.md) — `XrayClient` over the 3x-ui panel, device limits, liveness, client emails, releasing peers, core restarts.
- [architecture/billing.md](architecture/billing.md) — prices and flags, webhooks, automatic renewal and its idempotence key, pending payments, declined cards, reminders, the trial, account deletion freeing the nodes.
- [architecture/scheduler.md](architecture/scheduler.md) — the six cron jobs (seven schedules: reconcile-peers also runs a weekly orphan pass), node health, expired access in both directions.
- [architecture/telegram-bot.md](architecture/telegram-bot.md) — the bot as a second door to the same account: services, account creation, linking, the webhook and its host, the keyboard, notifications, callback payloads.
- [architecture/provisioning.md](architecture/provisioning.md) — why provisioning is local, `scripts/provision` and its `remote/` folders, narration, fail2ban, what a run does to a node.
- [architecture/logging.md](architecture/logging.md) — one logger and one list of secrets; a node's URL never reaches a log.
- [architecture/web-client.md](architecture/web-client.md) — `cacheComponents` without `use cache`, clearing the query cache on sign-in, indexed pages, structured data.
- [architecture/fsd.md](architecture/fsd.md) — Feature-Sliced Design as used by `apps/client`: layers, slices, segments, where a thing goes.
- [architecture/pitfalls.md](architecture/pitfalls.md) — things that have already bitten us.

## Guides

The style guide, split by stack. Index and tooling: [guides/README.md](guides/README.md).

- `guides/client/` — slices, `ui/` and `ui-kit`, `model/hooks`, segments, React, component body and size, styles, forms, conditional render, drill cleanup, i18n.
- `guides/server/` — [NestJS modules](guides/server/nestjs.md), [Prisma and the sweeps](guides/server/data.md).
- `guides/shared/` — naming, imports and barrels, types, functions, blank lines, readability, comments, constants and config, folders, dependencies, shared schemas, tests, forbidden list, pre-commit checklist.

## Ops

- [ops/deploy.md](ops/deploy.md) — the VPS: DNS, secrets, the server's `.env`, the Telegram bot, first run, migrations, what the deploy workflow assumes.
- [ops/backups.md](ops/backups.md) — the `backup` service, restoring a dump, moving the database to another VPS.
- [ops/provisioning-a-node.md](ops/provisioning-a-node.md) — adding a VPN node with `bun run provision:nodes` and verifying it end to end.
