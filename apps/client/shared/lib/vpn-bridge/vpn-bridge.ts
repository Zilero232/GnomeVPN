import { Channel, invoke, isTauri } from '@tauri-apps/api/core';

import type { TunnelConfig } from '@gnomevpn/schemas';

export type VpnEvent =
  | { type: 'connecting' }
  | { type: 'handshake' }
  | { type: 'connected'; assignedIp: string }
  | { type: 'bytesUpdate'; rx: number; tx: number }
  | { type: 'disconnected' }
  | { type: 'error'; message: string };

export type VpnConnectOptions = {
  killSwitch: boolean;
  autoReconnect: boolean;
};

export const vpnConnect = async (
  config: TunnelConfig,
  onEvent: (event: VpnEvent) => void,
  options: VpnConnectOptions,
): Promise<void> => {
  if (!isTauri()) {
    throw new Error('VPN is only available in the desktop app');
  }

  const channel = new Channel<VpnEvent>();
  channel.onmessage = onEvent;

  await invoke('vpn_connect', {
    config,
    onEvent: channel,
    killSwitch: options.killSwitch,
    autoReconnect: options.autoReconnect,
  });
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

export const isVpnServiceAvailable = async (): Promise<boolean> => {
  if (!isTauri()) {
    return false;
  }

  return invoke<boolean>('vpn_service_available');
};
