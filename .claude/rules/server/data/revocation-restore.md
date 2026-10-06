---
paths:
  - 'apps/server/**/*.ts'
---

<!-- Compressed editing rules for the API, loaded automatically on edit. -->
<!-- The full reasoning is docs/guides/server/data.md; keep them in sync. -->

# Code style — server: a revocation needs a restore

## A revocation needs a restore

Any job that moves rows into a blocked state must have a pass that moves them
back when the reason is gone, in the same sweep. `expired-access` disabled
configs on a lapsed subscription while only the payment webhook re-enabled them,
so a webhook failing after its transaction committed left a paying user with
nothing able to restore access. The predicates are complements — `lapsedBefore`
and `activeSince` — and a gap between them either strands a payer or keeps
serving an expired account.

Work that must happen after a transaction commits is best-effort by definition.
Log it and make a sweep the guarantee; never let it be the only path.
