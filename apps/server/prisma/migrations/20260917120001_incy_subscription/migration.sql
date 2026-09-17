-- The desktop client is gone and the VPN is delivered through INCY: the server
-- hands out one subscription URL and the app fetches its server list from it.
-- This migration carries every schema change that follows from that.
--
-- `vless` was added to TunnelProtocol in the migration before this one, on its
-- own: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block and
-- Prisma wraps every migration in one.

-- The app cannot log in, so the URL itself is the credential: 32 random bytes,
-- one row per user, rotatable. Rotating replaces the token and every client
-- holding the old URL stops resolving.
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

-- Hysteria2 rides QUIC, which is UDP, and some networks drop UDP wholesale.
-- VLESS + Reality is the fallback on TCP/443. Reality needs an X25519 key pair
-- and a short id per node; only the public half is stored, because that is what
-- the client needs to build its handshake. The private key never leaves the node.
ALTER TABLE "node"
  ADD COLUMN "reality_public_key" TEXT,
  ADD COLUMN "reality_short_id" TEXT;

-- WireGuard was reachable only from the desktop client. Nothing can create such
-- a peer any more, so its rows and columns are dead weight. The enum variant
-- stays: Postgres cannot drop a value from an enum type.
DELETE FROM "peer" WHERE "protocol" = 'wireguard';

DROP INDEX IF EXISTS "peer_node_id_wg_assigned_ip_key";

ALTER TABLE "peer"
  DROP COLUMN IF EXISTS "wg_assigned_ip",
  DROP COLUMN IF EXISTS "wg_private_key";

ALTER TABLE "node"
  DROP COLUMN IF EXISTS "wg_public_key";

-- better-auth 1.7 does not write `issuer` on the credential path: the field
-- belongs to its OAuth provider config, not to the account row that sign-up
-- creates. A NOT NULL column with no default rejected every registration with
-- `Argument \`issuer\` is missing`.
ALTER TABLE "account"
  ALTER COLUMN "issuer" SET DEFAULT 'local:credential';
