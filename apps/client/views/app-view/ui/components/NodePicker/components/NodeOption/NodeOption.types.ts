import type { Node } from '@gnomevpn/schemas';

import type { NodeReachability } from '../../../../../lib';

export type NodeOptionProps = {
  isActive: boolean;
  isStale: boolean;
  node: Node;
  reachability: NodeReachability;
  rttMs: number | null;
};
