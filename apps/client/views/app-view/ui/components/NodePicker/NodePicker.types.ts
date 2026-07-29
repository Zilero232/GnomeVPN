import type { Node } from '@gnomevpn/schemas';

import type { LatencyByNode } from '@/shared/lib';

export type NodePickerProps = {
  nodes: Node[];
  activeNodeId: string | null;
  isLoading: boolean;
  isError: boolean;
  isLocked: boolean;
  latency?: LatencyByNode;
  onSelect: (nodeId: string) => void;
};
