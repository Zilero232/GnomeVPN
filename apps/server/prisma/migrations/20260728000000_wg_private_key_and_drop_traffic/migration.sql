-- Persist the WireGuard client private key so a config can be re-issued
-- identically, and drop the traffic byte counter now that peer liveness is
-- decided purely by last_active_at (heartbeat-driven), not by traffic growth.
--
-- wg_private_key is nullable: existing WireGuard config peers were issued before
-- the key was stored, so they carry NULL and get a fresh keypair on their next
-- issue (after which they become reproducible). Hysteria2 peers never use it.

ALTER TABLE "peer"
  ADD COLUMN "wg_private_key" TEXT;

ALTER TABLE "peer"
  DROP COLUMN "traffic_bytes";
