import { Channel } from '@tauri-apps/api/core';

import type { TunnelEvent } from '../../ipc';
import type { VpnConnectInput, VpnTraffic } from './tunnel.types';

import { callRust } from '../../ipc';
import { isTauriDesktop } from '../../tauri-platform';
import { emptySplitConfig } from '../split-config';

export const vpnConnect = async ({ config, onEvent, autoReconnect, split = emptySplitConfig() }: VpnConnectInput): Promise<void> => {
  const channel = new Channel<TunnelEvent>();

  channel.onmessage = onEvent;

  const args = isTauriDesktop() ? { config, onEvent: channel, autoReconnect, split } : { config, onEvent: channel, autoReconnect };

  await callRust({
    command: 'vpn_connect',
    args,
    fallback: null
  });
};

export const vpnDisconnect = async (): Promise<void> => {
  await callRust({ command: 'vpn_disconnect', fallback: null });
};

export const vpnStatus = async (): Promise<string> => callRust({ command: 'vpn_status', fallback: 'disconnected' });

export const vpnTraffic = async (): Promise<VpnTraffic> => callRust({ command: 'vpn_traffic', fallback: { rx: 0, tx: 0, uptimeSeconds: 0 } });

export const isVpnServiceAvailable = async (): Promise<boolean> => callRust({ command: 'vpn_service_available', fallback: false });
