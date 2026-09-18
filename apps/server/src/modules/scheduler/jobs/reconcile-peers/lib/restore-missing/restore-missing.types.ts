import type { Logger } from '@nestjs/common';

import type { XrayClient } from '../../../../../../lib';
import type { ReconcileNode, ReconcilePeer } from '../../reconcile-peers.job.types';

export type RestoreMissingInput = {
  logger: Logger;
  xray: XrayClient;
  node: ReconcileNode;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
};
