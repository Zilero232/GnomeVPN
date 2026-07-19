import type { Node } from '@gnomevpn/schemas';

export type UseAutoConnectParams = {
  nodes: Node[];
  hasAccess: boolean;
  isConnected: boolean;
  isReady: boolean;
  connect: (nodeId: string, country: string, isAutomatic?: boolean) => Promise<void>;
};
