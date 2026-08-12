import type { NodeEndpoint, SplitConfig, TunnelConfig } from '@gnomevpn/schemas';

import type { TunnelEvent } from '../ipc';

export type VpnConnectInput = {
  config: TunnelConfig;
  onEvent: (event: TunnelEvent) => void;
  autoReconnect: boolean;
  split?: SplitConfig;
};

export type InstalledApp = {
  name: string;
  path: string;
};

export type ProbeLatencyInput = {
  targets: NodeEndpoint[];
};

export type LatencyByNode = Record<string, number | null>;

export type VpnTraffic = {
  rx: number;
  tx: number;
  uptimeSeconds?: number;
};

export type TileConnectRequest = {
  requested: boolean;
  needsAttention: boolean;
};
