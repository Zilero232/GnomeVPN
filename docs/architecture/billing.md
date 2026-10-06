# Billing

YooKassa checkout, automatic renewal, the trial, and what deleting an account
does to the nodes. Code: `apps/server/src/modules/billing/` and the billing jobs
in `apps/server/src/modules/scheduler/` (the full job list is in
[scheduler.md](scheduler.md)). Part of the [documentation index](../README.md).

## Prices, flags and webhooks

Prices live in `PLANS` ([`packages/schemas`](../../packages/schemas)), not in the environment: the server charges from that list and the landing page renders from it, so an advertised price cannot drift from a billed one.

Two flags decide what auto-renewal does, and they are not the same thing:

- **`YOOKASSA_RECURRING`** — whether the shop _can_ charge recurrently at all. YooKassa enables this per shop by hand, on request to support; there is no dashboard toggle. Until they do, `save_payment_method` and `POST /v3/payment_methods` both answer `forbidden`, so checkout fails outright. It defaults to `false`.
- **`subscription.cancelAtPeriodEnd`** — whether _this user_ wants renewal. Theirs to flip.

Renewal also needs a card on file (`savedCardId`). Without one the job has nothing to charge, so `resumeAutoRenew` refuses rather than promising a renewal that never happens — the client offers `bindCard` instead.

Webhooks are the only thing that activates a subscription; the browser returning to `YOOKASSA_RETURN_URL` proves nothing. `handleWebhook` never trusts the request body either — it re-reads the payment or payment method from the API, because a webhook is just JSON somebody posted. It answers `200` even when it does nothing: any other status makes YooKassa retry for a day.

**`POST /billing/webhook` is not throttled; it is gated by source address.** It
carries `@SkipThrottle()`, so the global per-IP limit never applies to it;
`WebhookIpGuard` (`isAllowedWebhookIp`) refuses any caller outside
`WEBHOOK_ALLOWED_CIDRS`, YooKassa's address ranges, instead.

**Re-enabling access happens outside the claiming transaction, so it must be recoverable.** `settlePayment` claims the payment row and grants the subscription atomically, then calls `setEnabledAll` — a separate write that can fail, or never run at all if the process dies right after the commit. That used to leave a paying user with every peer `disabled` and nothing in the system able to turn them back on: `expired-access` only ever revoked. It now sweeps both ways — its restore half re-enables `disabled` config peers whose owner has a live period (`activeSince`) — so the post-commit call is an optimisation and the job is the guarantee. Do not make `setEnabledAll` the only path back.

**The webhook accepts any event name and ignores the ones it does not handle.**
`WebhookEventDto` does not reject an event it has no branch for: an unknown
event is answered `200` and dropped. YooKassa retries anything non-2xx for a day,
so a validation error on an event we never asked about would have been replayed
for a day for nothing.

## Automatic renewal

`recurring-charge` charges the saved card in the last `WINDOW.renewHours` of a
period — never during a trial — and makes **one attempt per period**: an
auto-charge row created inside the renewal window, pending or canceled, means
the period was already tried, and the reader renews by hand. A declined card is
canceled synchronously, and retrying with the same idempotence key only replays
that cancellation from YooKassa — so the old hourly retry re-announced the same
failure every hour until the key expired. Everything after the charge goes
through `WebhookService.settlePayment`, which is the only place a payment
changes state.

**The idempotence key is a hash of the whole charge** (`renewalIdempotenceKey`) —
user, period end, card and amount. It used to be `renew-<user>-<period end>`: a
card re-bound after a failed attempt reused the key with a different body, and
YooKassa refused it every hour until the period ran out. The hash also keeps it
inside YooKassa's 64-character limit, which the old key missed by one.

**A pending payment is re-read, not waited on.** A recurring charge can come
back `pending` and settle by webhook seconds later — sometimes before the row
recording it exists, and the webhook for an unknown payment is dropped with a 200. The card is charged, the period is not extended, and the attempt blocks a
retry. `pending-payments` runs every 10 minutes and calls
`WebhookService.settlePayment` for each payment row still `pending` after
`PENDING.settleAfterMinutes`, looking back `PENDING.lookbackDays`; settling is
idempotent, so a webhook that did arrive costs nothing. The
`20261006120000_lookup_indexes` migration adds the `payment(status, created_at)`
index this sweep filters on — the per-user index cannot serve it.

**A cancellation is claimed once and answered once — in `WebhookService.cancel`,
not in the job.** `cancel` flips the row `pending` → `canceled` with
`updateMany`, and only the call that wins the claim speaks: it unbinds the card
when the reason is one of `CARD_LOST_REASONS` (retrying a revoked permission next
month only fails again) and tells the reader their charge failed. The job, the
`pending-payments` sweep and the webhook all reach a cancellation through it, so
none of them can announce the same decline a second time. `recurring-charge`
keeps `dropUnusableCard` only for a charge that **threw**: a thrown error is
logged rather than announced, because it is not proof the card was declined, and
the card is dropped only on a definite "no" from `isPaymentMethodUsable`.

**Only a card YooKassa saved is a card.** Every settled payment carries a `payment_method.id`, saved or not — an SBP payment, a checkout with recurring off, a buyer who unticked "remember card". `settlePayment` used to store any of them as `savedCardId`, and the charge then failed hourly with `This payment_method_id doesn't exist`. `getPayment` now returns the id only when `payment_method.saved` is true. For rows written before that, a failed charge asks `isPaymentMethodUsable`; a definite "no" unbinds the card and tells the reader once, while an unknown answer (network, 5xx) leaves it alone.

`period-reminder` warns before the period ends, once per period — `subscription.reminderSentFor` holds the period end it was sent for, so a renewal that moves the end re-arms it. Three messages: a trial gets `trialEndingSoon` in its last `WINDOW.trialRemindHours`, a period that will not auto-charge gets `endingSoon` within `WINDOW.remindHours`, and one that will gets `renewSoon` with the amount and card — only before the charge window opens, because after it `recurring-charge` speaks for itself.

## The trial

**`trialStartedAt` outlives the period it granted.** A trial is given once and
never again, so clearing the flag when the period expires would hand out a
second one; `trialState` reads the flag, not the period.

**The trial is a day, not an hour or a week.** A day is long enough to install
the app, connect and judge the speed on the reader's own network, which is the
only way a VPN can be judged at all.

## Deleting an account frees the nodes before it frees the row

`AccountService.remove` reads the user's peers first, hands them to
`PeersService.releaseDetached`, and only then deletes the `User`. The order is
the whole point: the rows name which client to remove on which node, and once
they cascade away nothing knows what to clean up.

Removal on the node is best-effort — `releaseDetached` deletes the rows, then
fires the node calls detached — so a node that is down when someone deletes
their account keeps a client nobody owns. The weekly orphan collection in
`reconcile-peers` (`collectOrphans`) is the guarantee: it already deletes any
server-owned client whose owner id no longer resolves to a `User`, which is
exactly what a deleted account leaves behind. It skips a client the core reports
online, so a live session ends when it drops rather than mid-stream.

Deletion is offered in both places for the same reason linking is: the account
page has a confirm dialog, `/delete` in the bot has the same confirmation on an
inline keyboard. Neither refunds the remaining period, and both say so before
asking.
