import type { TunnelConfig } from '@gnomevpn/schemas';
import type { TunnelEvent } from '../ipc';

export type VpnConnectInput = {
  config: TunnelConfig;
  onEvent: (event: TunnelEvent) => void;
  autoReconnect: boolean;
};
