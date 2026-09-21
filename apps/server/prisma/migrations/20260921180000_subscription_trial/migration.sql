-- A trial is granted once per account and never again. The timestamp outlives
-- the period it granted: clearing it when the trial expires would hand the same
-- account a second one every time it lapsed.
ALTER TABLE "subscription" ADD COLUMN "trial_started_at" TIMESTAMPTZ(3);
