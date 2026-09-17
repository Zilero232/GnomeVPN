-- The INCY client fetches a subscription over a plain GET with no session: it
-- cannot log in, so the URL itself is the credential. The token is generated
-- from 32 random bytes and is rotatable, which is the only way to revoke a link
-- that has leaked — rotating replaces the row's token and every client holding
-- the old URL stops resolving.
--
-- One row per user: the link is the user's whole server list, not one server.
-- last_seen_at and last_platform are written from the client's User-Agent on
-- each refresh, so a support request can tell whether the app ever fetched.

CREATE TABLE "subscription_link" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "user_id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "last_seen_at" TIMESTAMPTZ(3),
  "last_platform" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "subscription_link_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_link_user_id_key" ON "subscription_link"("user_id");

CREATE UNIQUE INDEX "subscription_link_token_key" ON "subscription_link"("token");

ALTER TABLE "subscription_link"
  ADD CONSTRAINT "subscription_link_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
