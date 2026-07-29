import type { TunnelEvent } from '@/shared/lib';

import type { VpnTraffic } from '../use-vpn-connection/use-vpn-connection.types';

export type UseTunnelEventsInput = {
  isCurrent: (generation: number) => boolean;
  onConnected: () => void;
  onReconnecting: () => void;
  onTraffic: (traffic: VpnTraffic) => void;
  onClosed: () => void;
  countryRef: { current: string };
  nodeIdRef: { current: string | null };
};

export type HandleTunnelEventInput = {
  generation: number;
  event: TunnelEvent;
};
