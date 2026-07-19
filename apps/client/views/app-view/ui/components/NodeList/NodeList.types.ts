import type { Node } from '@vesper/schemas';

export type NodeListProps = {
  nodes: Node[];
  activeNodeId: string | null;
  isLoading: boolean;
  isError: boolean;
  isLocked: boolean;
  onSelect: (nodeId: string) => void;
};
