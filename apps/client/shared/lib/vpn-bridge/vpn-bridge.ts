import { Channel } from '@tauri-apps/api/core';
import { mapToObj } from 'remeda';

import { callRust } from '../ipc';

import type { TunnelEvent } from '../ipc';
import type { LatencyByNode, ProbeLatencyInput, VpnConnectInput } from './vpn-bridge.types';

export const vpnConnect = async ({
  config,
  onEvent,
  autoReconnect,
}: VpnConnectInput): Promise<void> => {
  const channel = new Channel<TunnelEvent>();
  channel.onmessage = onEvent;

  await callRust({
    command: 'vpn_connect',
    args: { config, onEvent: channel, autoReconnect },
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

export const takeTileConnectRequest = async (): Promise<boolean> =>
  callRust({ command: 'vpn_take_tile_request', fallback: false });

export const probeNodeLatency = async ({ targets }: ProbeLatencyInput): Promise<LatencyByNode> => {
  const outcomes = await callRust({
    command: 'vpn_probe_latency',
    args: { targets },
    fallback: [],
  });

  return mapToObj(outcomes, ({ id, rttMs }) => [id, rttMs]);
};
