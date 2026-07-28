import type { SplitConfig, TunnelConfig } from '@gnomevpn/schemas';
import type { Channel } from '@tauri-apps/api/core';

export type TunnelEvent =
  | { type: 'connecting' }
  | { type: 'handshake' }
  | { type: 'connected'; assignedIp: string }
  | { type: 'bytesUpdate'; rx: number; tx: number }
  | { type: 'disconnected' }
  | { type: 'error'; message: string };

export type RustCommands = {
  vpn_connect: {
    args: {
      config: TunnelConfig;
      onEvent: Channel<TunnelEvent>;
      autoReconnect: boolean;
      split?: SplitConfig;
      heartbeat?: { apiUrl: string; token: string; deviceId: string };
    };
    result: null;
  };
  list_installed_apps: { args: never; result: { name: string; path: string }[] };
  list_running_processes: { args: never; result: { name: string; path: string }[] };
  vpn_disconnect: { args: never; result: null };
  vpn_status: { args: never; result: string };
  vpn_traffic: { args: never; result: { rx: number; tx: number } };
  vpn_service_available: { args: never; result: boolean };
  vpn_take_tile_request: { args: never; result: boolean };
  vpn_hide_window: { args: never; result: null };
  vpn_open_settings: { args: never; result: null };
  vpn_share_config: { args: { fileName: string; content: string }; result: boolean };
  vpn_has_permission: { args: never; result: boolean };
  vpn_request_permission: { args: never; result: boolean };
  vpn_probe_latency: {
    args: {
      targets: { id: string; host: string; port: number; serverName: string }[];
    };
    result: { id: string; rttMs: number | null }[];
  };
  service_repair: { args: never; result: null };
  vault_save_token: { args: { token: string }; result: null };
  vault_read_token: { args: never; result: string | null };
  vault_clear_token: { args: never; result: null };
};

export type RustCommand = keyof RustCommands;
