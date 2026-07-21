import type { Node } from '@gnomevpn/schemas';

export type UseNodeSelectionInput = {
  nodes: Node[];
  activeNodeId: string | null;
};
