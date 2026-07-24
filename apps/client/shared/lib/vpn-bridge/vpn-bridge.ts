import { Channel } from '@tauri-apps/api/core';
import { mapToObj } from 'remeda';

import { callRust } from '../ipc';

import type { TunnelEvent } from '../ipc';
import type {
  InstalledApp,
  LatencyByNode,
  ProbeLatencyInput,
  VpnConnectInput,
} from './vpn-bridge.types';

export const vpnConnect = async ({
  config,
  onEvent,
  autoReconnect,
  splitApps = [],
}: VpnConnectInput): Promise<void> => {
  const channel = new Channel<TunnelEvent>();
  channel.onmessage = onEvent;

  await callRust({
    command: 'vpn_connect',
    args: { config, onEvent: channel, autoReconnect, splitApps },
    fallback: null,
  });
};

export const listInstalledApps = async (): Promise<InstalledApp[]> =>
  callRust({ command: 'list_installed_apps', fallback: [] });

export const vpnDisconnect = async (): Promise<void> => {
  await callRust({ command: 'vpn_disconnect', fallback: null });
};

export const vpnStatus = async (): Promise<string> =>
  callRust({ command: 'vpn_status', fallback: 'disconnected' });

export const isVpnServiceAvailable = async (): Promise<boolean> =>
  callRust({ command: 'vpn_service_available', fallback: false });

export const takeTileConnectRequest = async (): Promise<boolean> =>
  callRust({ command: 'vpn_take_tile_request', fallback: false });

export const hideAppWindow = async (): Promise<void> => {
  await callRust({ command: 'vpn_hide_window', fallback: null });
};

export const hasVpnPermission = async (): Promise<boolean> =>
  callRust({ command: 'vpn_has_permission', fallback: true });

export const requestVpnPermission = async (): Promise<boolean> =>
  callRust({ command: 'vpn_request_permission', fallback: true });

export const probeNodeLatency = async ({ targets }: ProbeLatencyInput): Promise<LatencyByNode> => {
  const outcomes = await callRust({
    command: 'vpn_probe_latency',
    args: { targets },
    fallback: [],
  });

  return mapToObj(outcomes, ({ id, rttMs }) => [id, rttMs]);
};
