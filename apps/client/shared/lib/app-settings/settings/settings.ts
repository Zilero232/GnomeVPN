import type { SplitConfig, TunnelProtocol } from '@gnomevpn/schemas';

import { DEFAULT_TUNNEL_PROTOCOL } from '@gnomevpn/schemas';

import { emptySplitConfig, normalizeSplitConfig } from '../../vpn-bridge';
import { setting } from '../store';

export const autoConnectSetting = setting({ key: 'autoConnect', fallback: true });

export const autoReconnectSetting = setting({ key: 'autoReconnect', fallback: true });

export const closeToTraySetting = setting({ key: 'closeToTray', fallback: true });

export const manuallyDisconnectedSetting = setting({ key: 'manuallyDisconnected', fallback: false });

export const autoStartInitializedSetting = setting({ key: 'autoStartInitialized', fallback: false });

export const deviceIdSetting = setting<string | null, string>({ key: 'deviceId', fallback: null });

export const lastNodeIdSetting = setting<string | null, string>({ key: 'lastNodeId', fallback: null });

export const protocolSetting = setting<TunnelProtocol>({ key: 'protocol', fallback: DEFAULT_TUNNEL_PROTOCOL });

export const splitSetting = setting<SplitConfig>({
  key: 'split',
  fallback: emptySplitConfig(),
  parse: normalizeSplitConfig
});
