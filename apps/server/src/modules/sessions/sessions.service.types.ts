import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { CreatedPeer } from '../peers';

export type ConnectSessionInput = {
  userId: string;
  nodeId: string;
  deviceId: string;
  protocol: TunnelProtocol;
};

export type DisconnectSessionInput = {
  userId: string;
  deviceId: string;
};

export type PersistSessionInput = {
  userId: string;
  nodeId: string;
  deviceId: string;
  protocol: TunnelProtocol;
  peer: CreatedPeer;
  deviceLimit: number;
};
