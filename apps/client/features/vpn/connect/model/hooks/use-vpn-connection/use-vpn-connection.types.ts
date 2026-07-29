import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { TunnelEvent } from '@/shared/lib';

export type VpnConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export type VpnTraffic = {
  rx: number;
  tx: number;
};

export type TunnelEventInput = {
  generation: number;
  event: TunnelEvent;
};

export type ConnectInput = {
  nodeId: string;
  protocol: TunnelProtocol;
  country?: string;
  isAutomatic?: boolean;
};
