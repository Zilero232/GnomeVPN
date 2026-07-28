import type { TunnelProtocol } from '@gnomevpn/schemas';

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

export type HeartbeatSessionInput = {
  userId: string;
  deviceId: string;
};
