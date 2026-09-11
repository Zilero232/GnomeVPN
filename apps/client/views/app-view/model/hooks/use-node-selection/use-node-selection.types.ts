import type { Node } from '@gnomevpn/schemas';

import type { LatencyByNode } from '@/shared/lib';

export type UseNodeSelectionInput = {
  activeNodeId: string | null;
  isMeasuring: boolean;
  latency: LatencyByNode;
  nodes: Node[];
};
