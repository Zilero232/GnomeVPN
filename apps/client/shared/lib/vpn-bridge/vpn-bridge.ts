import { Channel, invoke, isTauri } from '@tauri-apps/api/core';

import type { TunnelConfig } from '@gnomevpn/schemas';

export type VpnEvent =
  | { type: 'connecting' }
  | { type: 'handshake' }
  | { type: 'connected'; assignedIp: string }
  | { type: 'bytesUpdate'; rx: number; tx: number }
  | { type: 'disconnected' }
  | { type: 'error'; message: string };

export const vpnConnect = async (
  config: TunnelConfig,
  onEvent: (event: VpnEvent) => void,
): Promise<void> => {
  if (!isTauri()) {
    throw new Error('VPN is only available in the desktop app');
  }

  const channel = new Channel<VpnEvent>();
  channel.onmessage = onEvent;

  await invoke('vpn_connect', { config, onEvent: channel });
};

export const vpnDisconnect = async (): Promise<void> => {
  if (!isTauri()) {
    return;
  }

  await invoke('vpn_disconnect');
};

export const vpnStatus = async (): Promise<string> => {
  if (!isTauri()) {
    return 'disconnected';
  }

  return invoke<string>('vpn_status');
};
