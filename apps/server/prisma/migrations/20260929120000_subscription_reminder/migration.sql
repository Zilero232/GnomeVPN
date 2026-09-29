-- The period end a reminder was last sent for. A renewal moves the period end,
-- so comparing the two is what lets the next period be reminded about again
-- without a second message for this one.
ALTER TABLE "subscription" ADD COLUMN "reminder_sent_for" TIMESTAMPTZ(3);
