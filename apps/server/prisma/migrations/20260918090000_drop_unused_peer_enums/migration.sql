-- Neither value was reachable. PeersService.revoke was the only writer of
-- `revoked` and no controller or job ever called it; wireguard was never issued
-- either — the subscription hands out hysteria2 and vless, and provisioning
-- installs only those two inbounds.
ALTER TYPE "PeerState" RENAME TO "PeerState_old";

CREATE TYPE "PeerState" AS ENUM ('active', 'disabled');

ALTER TABLE "peer"
  ALTER COLUMN "state" DROP DEFAULT,
  ALTER COLUMN "state" TYPE "PeerState" USING ("state"::text::"PeerState"),
  ALTER COLUMN "state" SET DEFAULT 'active';

DROP TYPE "PeerState_old";

ALTER TYPE "TunnelProtocol" RENAME TO "TunnelProtocol_old";

CREATE TYPE "TunnelProtocol" AS ENUM ('hysteria2', 'vless');

ALTER TABLE "peer"
  ALTER COLUMN "protocol" DROP DEFAULT,
  ALTER COLUMN "protocol" TYPE "TunnelProtocol" USING ("protocol"::text::"TunnelProtocol"),
  ALTER COLUMN "protocol" SET DEFAULT 'hysteria2';

DROP TYPE "TunnelProtocol_old";
