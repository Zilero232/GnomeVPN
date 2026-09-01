-- better-auth 1.7 identifies an account by (issuer, accountId) rather than by
-- (providerId, accountId). The issuer is a namespaced provider id: a provider
-- with no issuer of its own gets the synthetic `local:<providerId>`, and an
-- OAuth provider without one gets `local:oauth:<providerId>`. Sign-up, sign-in
-- and password changes all write the column, so a missing one fails every
-- request with `Unknown argument 'issuer'`.
--
-- The column is NOT NULL upstream, so existing rows are backfilled before the
-- constraint is added. This deployment has no social providers configured —
-- every row is `credential` — but the backfill derives the value from
-- provider_id rather than hardcoding it, so a row written by any other local
-- provider is namespaced the same way better-auth would have namespaced it.

ALTER TABLE "account"
  ADD COLUMN "issuer" TEXT;

UPDATE "account"
  SET "issuer" = 'local:' || "provider_id"
  WHERE "issuer" IS NULL;

ALTER TABLE "account"
  ALTER COLUMN "issuer" SET NOT NULL;

CREATE UNIQUE INDEX "account_issuer_account_id_key" ON "account"("issuer", "account_id");
