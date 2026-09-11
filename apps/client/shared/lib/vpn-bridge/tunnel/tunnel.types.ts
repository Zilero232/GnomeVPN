import type { SplitConfig, TunnelConfig } from '@gnomevpn/schemas';

import type { TunnelEvent } from '../../ipc';

export type VpnConnectInput = {
  autoReconnect: boolean;
  config: TunnelConfig;
  onEvent: (event: TunnelEvent) => void;
  split?: SplitConfig;
};

export type VpnTraffic = {
  rx: number;
  tx: number;
  uptimeSeconds?: number;
};
