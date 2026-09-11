import type { ShareConfigInput, TileConnectRequest } from './platform.types';

import { callRust } from '../../ipc';
import { isTauriMobile } from '../../tauri-platform';

const NO_TILE_REQUEST: TileConnectRequest = { requested: false, needsAttention: false };

export const takeTileConnectRequest = async (): Promise<TileConnectRequest> =>
  isTauriMobile() ? callRust({ command: 'vpn_take_tile_request', fallback: NO_TILE_REQUEST }) : NO_TILE_REQUEST;

export const hideAppWindow = async (): Promise<void> => {
  await callRust({ command: 'vpn_hide_window', fallback: null });
};

export const shareConfigFile = async (args: ShareConfigInput): Promise<boolean> => callRust({ command: 'vpn_share_config', args, fallback: false });

export const hasVpnPermission = async (): Promise<boolean> => callRust({ command: 'vpn_has_permission', fallback: true });

export const requestVpnPermission = async (): Promise<boolean> => callRust({ command: 'vpn_request_permission', fallback: true });
