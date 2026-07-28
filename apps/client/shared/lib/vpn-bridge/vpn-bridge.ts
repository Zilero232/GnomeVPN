import { SPLIT_MODE } from '@gnomevpn/schemas';
import { Channel } from '@tauri-apps/api/core';
import { mapToObj } from 'remeda';

import { callRust } from '../ipc';
import { isTauriDesktop } from '../tauri-platform';

import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';
import type { TunnelEvent } from '../ipc';
import type {
  InstalledApp,
  LatencyByNode,
  ProbeLatencyInput,
  VpnConnectInput,
  VpnTraffic,
} from './vpn-bridge.types';

export const emptySplitConfig = (): SplitConfig => ({
  appsMode: SPLIT_MODE.allowed,
  apps: [],
  ipsMode: SPLIT_MODE.allowed,
  ips: [],
});

const asMode = (value: unknown): SplitMode =>
  value === SPLIT_MODE.disallowed ? SPLIT_MODE.disallowed : SPLIT_MODE.allowed;

const asList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

export const normalizeSplitConfig = (value: unknown): SplitConfig => {
  const source = (value ?? {}) as Record<string, unknown>;

  return {
    appsMode: asMode(source.appsMode),
    apps: asList(source.apps),
    ipsMode: asMode(source.ipsMode),
    ips: asList(source.ips),
  };
};

export const vpnConnect = async ({
  config,
  onEvent,
  autoReconnect,
  split = emptySplitConfig(),
}: VpnConnectInput): Promise<void> => {
  const channel = new Channel<TunnelEvent>();
  channel.onmessage = onEvent;

  const args = isTauriDesktop()
    ? { config, onEvent: channel, autoReconnect, split }
    : { config, onEvent: channel, autoReconnect };

  await callRust({
    command: 'vpn_connect',
    args,
    fallback: null,
  });
};

export const listInstalledApps = async (): Promise<InstalledApp[]> =>
  callRust({ command: 'list_installed_apps', fallback: [] });

export const listRunningProcesses = async (): Promise<InstalledApp[]> =>
  callRust({ command: 'list_running_processes', fallback: [] });

export const pickExecutable = async (): Promise<string | null> => {
  if (!isTauriDesktop()) {
    return null;
  }

  const { open } = await import('@tauri-apps/plugin-dialog');

  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Executable', extensions: ['exe'] }],
  });

  return typeof selected === 'string' ? selected : null;
};

export const vpnDisconnect = async (): Promise<void> => {
  await callRust({ command: 'vpn_disconnect', fallback: null });
};

export const vpnStatus = async (): Promise<string> =>
  callRust({ command: 'vpn_status', fallback: 'disconnected' });

export const vpnTraffic = async (): Promise<VpnTraffic> =>
  callRust({ command: 'vpn_traffic', fallback: { rx: 0, tx: 0 } });

export const isVpnServiceAvailable = async (): Promise<boolean> =>
  callRust({ command: 'vpn_service_available', fallback: false });

export const takeTileConnectRequest = async (): Promise<boolean> =>
  callRust({ command: 'vpn_take_tile_request', fallback: false });

export const hideAppWindow = async (): Promise<void> => {
  await callRust({ command: 'vpn_hide_window', fallback: null });
};

export const openSystemVpnSettings = async (): Promise<void> => {
  await callRust({ command: 'vpn_open_settings', fallback: null });
};

export const shareConfigFile = async (args: {
  fileName: string;
  content: string;
}): Promise<boolean> => callRust({ command: 'vpn_share_config', args, fallback: false });

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
