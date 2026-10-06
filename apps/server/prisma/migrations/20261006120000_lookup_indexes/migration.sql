-- better-auth reads sessions and accounts by user and verifications by
-- identifier, and deleting a user cascades through both foreign keys; none of
-- the three columns was indexed. The pending-payment sweep filters payments
-- by status and age, which the per-user index cannot serve.
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

CREATE INDEX "account_user_id_idx" ON "account"("user_id");

CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

CREATE INDEX "payment_status_created_at_idx" ON "payment"("status", "created_at");
