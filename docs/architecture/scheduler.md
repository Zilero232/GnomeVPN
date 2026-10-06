# The scheduler

`apps/server/src/modules/scheduler` holds every cron job. The billing jobs are
argued in [billing.md](billing.md); the peer jobs lean on
[nodes-and-peers.md](nodes-and-peers.md). Part of the
[documentation index](../README.md).

## Cron jobs

`modules/scheduler/jobs` holds seven jobs: node health, peer reconciliation,
expired access, recurring charges, pending payments, period reminders, device
slots. `reconcile-peers` runs on two schedules, so there are eight crons in all.
Intervals that have no `CronExpression` constant live in `SCHEDULE`
(`config/schedule.config.ts`).

| Job                           | Runs                                      | Does                                                                              |
| ----------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| `node-health`                 | every minute                              | probes every available node, stamps `lastHealthyAt`, warns on CPU and memory      |
| `reconcile-peers` (`run`)     | `SCHEDULE.reconcileCron`, every 5 minutes | deletes revoked clients, syncs peer rows with the panels, restores lost ones      |
| `reconcile-peers` (`collect`) | `SCHEDULE.collectOrphansCron`, weekly     | the same pass plus orphan collection and retiring idle shared `incy` peers        |
| `expired-access`              | every 5 minutes                           | revokes lapsed access and restores access left disabled on a live period          |
| `recurring-charge`            | every hour                                | charges the saved card once in the last `WINDOW.renewHours` of a period           |
| `pending-payments`            | every 10 minutes                          | settles payments still `pending` after `PENDING.settleAfterMinutes`               |
| `device-slots`                | every 10 minutes                          | revokes the keys of devices over their account's limit ([devices.md](devices.md)) |
| `period-reminder`             | every hour                                | warns once per period before it ends                                              |

`reconcile-peers` waits out `SCHEDULE.bootGraceMs` after a boot, and its passes
never overlap: a regular run is skipped while a pass is in flight, and the weekly
orphan collection waits for the running pass to finish rather than being
skipped. A node that fails `ALERT.reconcileFailureStreak` passes in a row is
logged as an error rather than a warning.

`node-health` probes every available node each minute. `health()` returns the
inbound's state together with the panel's own `cpu`, memory ratio and TCP count,
so a node crossing `ALERT.nodeCpuPercent` or `ALERT.nodeMemoryRatio` is logged
as a warning before it starts dropping tunnels.

`expired-access` sweeps `kind: 'config'` peers in both directions — it disables
the peers of a subscriber whose period lapsed more than `WINDOW.configGraceHours`
ago (`lapsedBefore`), and restores peers left `disabled` while the period is
live (`activeSince`). Both halves go through `SubscriptionAccessService.setEnabledAll`.
The two predicates are complements and are tested as such; a gap between them
either strands a paying user or keeps serving an expired one.

It announces only the subscribers whose peers it actually turned off (it
selects `state: 'active'`). Without that filter every lapsed account was
"disabled" again on each five-minute sweep and told its subscription had ended
every time.

Use a raw cron string when the interval has no `CronExpression` constant. Inventing one that doesn't exist crashes the server at boot, and only at boot — nothing catches it earlier.
