-- A trial is never renewed, so it carries no renewal preference.
UPDATE "subscription"
SET "cancel_at_period_end" = false
WHERE "trial_started_at" IS NOT NULL
  AND "saved_card_id" IS NULL
  AND "current_period_end" <= "trial_started_at" + INTERVAL '1 day';

-- Extra devices last while the subscription stays active; a lapse ends them.
UPDATE "subscription"
SET "extra_devices" = 0
WHERE "extra_devices" > 0
  AND ("current_period_end" IS NULL OR "current_period_end" <= CURRENT_TIMESTAMP);
