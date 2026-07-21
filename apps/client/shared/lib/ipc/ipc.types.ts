import type { TunnelConfig } from '@gnomevpn/schemas';
import type { Channel } from '@tauri-apps/api/core';

export type TunnelEvent =
  | { type: 'connecting' }
  | { type: 'handshake' }
  | { type: 'connected'; assignedIp: string }
  | { type: 'bytesUpdate'; rx: number; tx: number }
  | { type: 'disconnected' }
  | { type: 'error'; message: string };

/**
 * Every command exposed by the Rust side, mirroring the invoke_handler list in
 * apps/tauri/src/lib.rs. Adding a command here without adding it there fails at
 * runtime, so the two lists are meant to be read side by side.
 */
export type RustCommands = {
  vpn_connect: {
    args: {
      config: TunnelConfig;
      onEvent: Channel<TunnelEvent>;
      killSwitch: boolean;
      autoReconnect: boolean;
    };
    result: null;
  };
  vpn_disconnect: { args: never; result: null };
  vpn_status: { args: never; result: string };
  vpn_service_available: { args: never; result: boolean };
  service_repair: { args: never; result: null };
  vault_save_token: { args: { token: string }; result: null };
  vault_read_token: { args: never; result: string | null };
  vault_clear_token: { args: never; result: null };
};

export type RustCommand = keyof RustCommands;
