import type { Node } from '@gnomevpn/schemas';

import type { NodeReachability } from '../node-reachability';

export type NodeLabelKeys = {
  hint: string;
  tag: string;
};

export type NodeLabelInput = {
  reachability: NodeReachability;
  status: Node['status'];
};
