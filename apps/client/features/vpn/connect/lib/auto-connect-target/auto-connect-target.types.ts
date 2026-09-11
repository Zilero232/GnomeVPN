import type { Node } from '@gnomevpn/schemas';

import type { LatencyByNode } from '@/shared/lib';

export type AutoConnectTargetInput = {
  lastNodeId: string | null;
  latency: LatencyByNode;
  nodes: Node[];
};
