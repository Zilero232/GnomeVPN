import type { Node } from '@gnomevpn/schemas';

import type { LatencyByNode } from '@/shared/lib';

export type NodeReachability = 'probing' | 'reachable' | 'unreachable';

export type ResolveReachabilityInput = {
  isMeasuring: boolean;
  latency: LatencyByNode;
  node: Node | undefined;
};

export type FirstReachableInput = {
  isMeasuring: boolean;
  latency: LatencyByNode;
  nodes: Node[];
};
