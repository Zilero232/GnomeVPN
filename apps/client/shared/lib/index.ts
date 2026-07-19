export { logger } from './logger';
export { notify } from './notifications';
export { isTauriDesktop, isTauriMobile } from './tauri-platform';
export { vpnConnect, vpnDisconnect, vpnStatus } from './vpn-bridge';
export {
  closeMainWindow,
  hideMainWindow,
  isMainWindowMaximized,
  minimizeMainWindow,
  onMainWindowResized,
  showMainWindow,
  toggleMainWindow,
  toggleMaximizeMainWindow,
} from './window';

export type { VpnEvent } from './vpn-bridge';
