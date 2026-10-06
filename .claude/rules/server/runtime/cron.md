---
paths:
  - 'apps/server/src/modules/scheduler/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/architecture/scheduler.md; keep them in sync. -->

# Code style — server: cron jobs

## Cron strings

Use a raw cron string when the interval has no `CronExpression` constant.
Inventing one that doesn't exist crashes the server at boot, and only at boot —
nothing catches it earlier.

## A job announces only what it changed

`expired-access` announces only the peers it actually turned off; a decline is
announced by `WebhookService.cancel`, which claims the row once. A sweep that
re-announces an unchanged state tells the reader the same thing every run.
