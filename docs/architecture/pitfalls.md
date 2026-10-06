# Things that have already bitten us

Each entry cost a debugging session once. Where another page argues the case in
full, the entry links to it. Part of the [documentation index](../README.md).

- **A Hysteria2 client needs its full field set.** Writing `{email, auth}` alone leaves the panel storing the client but generating `clients: null` in the running core, so every connection fails auth with a 404. `enable/limitIp/totalGB/expiryTime/tgId/reset` must all be present — see `PanelClient.addClient` and `CLIENT_DEFAULTS`. 3x-ui fixed a neighbouring bug in v3.6.0 (an inbound whose clients are _all_ filtered out now serialises as `[]` rather than `null`) but explicitly left this one open — nothing up to v3.8.5 changes it, so the full set is still required.
- **Xray-core cannot close a live session, so the panel restarts the core to end one.** Its API has `AddUser` and `RemoveUser` and nothing that disconnects anybody, so `restartXrayOnClientDisable` is how 3x-ui makes a revoked client stop working — and that restart drops every tunnel on the node. Provisioning turns the setting off: a revoked client keeps the session it already has and simply cannot open a new one, which is what `reconcile-peers` already assumes. Leaving it on is what made the tunnel drop roughly once a minute.
- **The panel's traffic counters are not liveness.** Treating "has traffic" as "active now" meant stale peers were never collected. Liveness now comes from the core's own online list — see [nodes-and-peers.md](nodes-and-peers.md#device-limits).
- **A state a job can only enter is a state nothing can leave.** `expired-access` disabled configs and only the payment webhook re-enabled them, so a webhook that failed after its transaction committed stranded a paying user permanently. Any revocation needs a matching restore in the same sweep — `SubscriptionAccessService` is both halves; [billing.md](billing.md#prices-flags-and-webhooks) has the details.
- **A count of hours is not a calendar duration.** `intervalToDuration` splits an interval into months **and** days, so `days * 24 + hours` silently dropped a whole month: a 31-day tunnel rendered as `72:00:00`. Compute elapsed time from the millisecond difference.
- **Tolerant parsing on a write path erases data.** A forgiving parse turned unreadable settings into `{}` and overwrote a node's real client list once already — see [nodes-and-peers.md](nodes-and-peers.md#one-module-talks-to-the-panel).
- **A peer's client name must carry its protocol.** Leaving the protocol out made a WireGuard peer collide with a Hysteria2 one and reconcile disabled live configs — see [nodes-and-peers.md](nodes-and-peers.md#device-limits).
- **`next/root-params` needs the root layout inside the dynamic segment.** With an
  outer `app/layout.tsx` present, `next typegen` reports "No root params detected"
  and every `rootParams.locale()` import fails to resolve. The locale layout must
  be the only root layout.
- **next-intl falls back to a default environment without an explicit `timeZone`.**
  Static generation then logs `ENVIRONMENT_FALLBACK` for every page that formats a
  date. Both `getRequestConfig` and `NextIntlClientProvider` pass `TIME_ZONE`.
- **A subscription link outlives the domain it was issued on.** Moving the API
  from `api.gnomevpn.ru` to `api.gnome-vpn.com` broke every INCY refresh for
  links imported before the move, with nothing but a TLS `internal_error` alert
  in the app's log; the old name is served again ([deploy](../ops/deploy.md)).
  A Caddyfile change only applies after `docker compose restart caddy`.
