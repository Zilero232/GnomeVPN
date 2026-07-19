export type VpnConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type VpnTraffic = {
  rx: number;
  tx: number;
};
