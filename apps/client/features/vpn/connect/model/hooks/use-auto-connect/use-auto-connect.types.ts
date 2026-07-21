import type { Node } from '@gnomevpn/schemas';
import type { ConnectInput } from '../use-vpn-connection/use-vpn-connection.types';

export type UseAutoConnectParams = {
  nodes: Node[];
  hasAccess: boolean;
  isConnected: boolean;
  isReady: boolean;
  connect: (input: ConnectInput) => Promise<void>;
};
