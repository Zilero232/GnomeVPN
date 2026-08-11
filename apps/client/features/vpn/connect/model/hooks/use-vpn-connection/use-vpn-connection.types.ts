import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { TunnelEvent, VpnTraffic } from '@/shared/lib';

export type { VpnTraffic };

export type VpnConnectionStatus = 'connected' | 'connecting' | 'disconnected';

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
