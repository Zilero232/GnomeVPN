-- Add WireGuard as a second tunnel protocol beside Hysteria2, and clarify the two
-- ambiguous credential columns now that both protocols share these tables.
--
-- A peer now carries a protocol, so one device name can hold one config per
-- protocol per node. A WireGuard peer also stores its assigned tunnel IP. A node
-- advertises only its WireGuard server public key (the listen port and address
-- pool are the same on every node and live in code, not here). node.auth becomes
-- hysteria_auth and peer.xray_user_id becomes node_credential (a Hysteria2
-- password, or a WireGuard client public key). Everything additive/nullable so
-- existing rows stay valid.

CREATE TYPE "TunnelProtocol" AS ENUM ('hysteria2', 'wireguard');

ALTER TABLE "node"
  RENAME COLUMN "auth" TO "hysteria_auth";

ALTER TABLE "node"
  ADD COLUMN "wg_public_key" TEXT;

ALTER TABLE "peer"
  RENAME COLUMN "xray_user_id" TO "node_credential";

ALTER TABLE "peer"
  ADD COLUMN "protocol" "TunnelProtocol" NOT NULL DEFAULT 'hysteria2',
  ADD COLUMN "wg_assigned_ip" TEXT;

DROP INDEX "peer_user_id_kind_name_key";

CREATE UNIQUE INDEX "peer_user_id_kind_name_node_id_protocol_key"
  ON "peer"("user_id", "kind", "name", "node_id", "protocol");

CREATE UNIQUE INDEX "peer_node_id_wg_assigned_ip_key"
  ON "peer"("node_id", "wg_assigned_ip");
