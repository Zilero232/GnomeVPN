import type { XrayClient } from '../../../../../../lib';
import type { ReconcilePeer } from '../../reconcile-peers.job.types';

export type SyncEnabledInput = {
  xray: XrayClient;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
};
