import type { Node } from '@gnomevpn/schemas';

export type NodePickerProps = {
  nodes: Node[];
  activeNodeId: string | null;
  isLoading: boolean;
  isError: boolean;
  isLocked: boolean;
  onSelect: (nodeId: string) => void;
};
