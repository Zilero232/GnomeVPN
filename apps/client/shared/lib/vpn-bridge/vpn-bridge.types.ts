import type { NodeEndpoint, TunnelConfig } from '@gnomevpn/schemas';
import type { TunnelEvent } from '../ipc';

export type VpnConnectInput = {
  config: TunnelConfig;
  onEvent: (event: TunnelEvent) => void;
  autoReconnect: boolean;
  splitApps?: string[];
};

export type InstalledApp = {
  name: string;
  path: string;
};

export type ProbeLatencyInput = {
  targets: NodeEndpoint[];
};

export type LatencyByNode = Record<string, number | null>;
