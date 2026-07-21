import { Channel } from '@tauri-apps/api/core';

import { callRust } from '../ipc';

import type { TunnelEvent } from '../ipc';
import type { VpnConnectInput } from './vpn-bridge.types';

export const vpnConnect = async ({
  config,
  onEvent,
  killSwitch,
  autoReconnect,
}: VpnConnectInput): Promise<void> => {
  const channel = new Channel<TunnelEvent>();
  channel.onmessage = onEvent;

  await callRust({
    command: 'vpn_connect',
    args: { config, onEvent: channel, killSwitch, autoReconnect },
    fallback: null,
  });
};

export const vpnDisconnect = async (): Promise<void> => {
  await callRust({ command: 'vpn_disconnect', fallback: null });
};

export const vpnStatus = async (): Promise<string> =>
  callRust({ command: 'vpn_status', fallback: 'disconnected' });

export const isVpnServiceAvailable = async (): Promise<boolean> =>
  callRust({ command: 'vpn_service_available', fallback: false });
