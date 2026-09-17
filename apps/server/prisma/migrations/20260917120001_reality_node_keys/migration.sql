-- Reality needs an X25519 key pair and a short id per node. They are generated
-- on the node itself; only the public half and the short id are stored here,
-- because the client needs both to build its handshake. The private key never
-- leaves the machine, exactly like the WireGuard one.
--
-- Nullable: a node provisioned before this migration has no Reality inbound
-- until it is provisioned again, and the subscription simply omits a VLESS
-- entry for it rather than emitting a broken one.

ALTER TABLE "node"
  ADD COLUMN "reality_public_key" TEXT,
  ADD COLUMN "reality_short_id" TEXT;
