-- Move peer deletion from imperative node calls to a declarative state model.
-- A peer now carries a desired state; callers only write the state, and a
-- reconciler converges the node to match. Liveness is no longer stored in the
-- DB at all — it is read from the node's own onlines report at the moment a
-- decision is made — so last_active_at is dropped rather than replaced.

CREATE TYPE "PeerState" AS ENUM ('active', 'disabled', 'revoked');

ALTER TABLE "peer"
  ADD COLUMN "state" "PeerState" NOT NULL DEFAULT 'active';

DROP INDEX "peer_kind_last_active_at_idx";

ALTER TABLE "peer"
  DROP COLUMN "last_active_at";

CREATE INDEX "peer_node_id_state_idx" ON "peer"("node_id", "state");
